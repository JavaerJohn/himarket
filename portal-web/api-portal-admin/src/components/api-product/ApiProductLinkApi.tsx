import { Card, Button, Modal, Form, Select, message, Collapse, Tabs, Row, Col } from 'antd'
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import type { ApiProduct, LinkedService, RestAPIItem, HigressMCPItem, NacosMCPItem, APIGAIMCPItem, AIGatewayAgentItem, ApiItem } from '@/types/api-product'
import type { Gateway, NacosInstance } from '@/types/gateway'
import { apiProductApi, gatewayApi, nacosApi } from '@/lib/api'
import { getGatewayTypeLabel } from '@/lib/constant'
import { copyToClipboard } from '@/lib/utils'
import * as yaml from 'js-yaml'
import { SwaggerUIWrapper } from './SwaggerUIWrapper'

interface ApiProductLinkApiProps {
  apiProduct: ApiProduct
  linkedService: LinkedService | null
  onLinkedServiceUpdate: (linkedService: LinkedService | null) => void
  handleRefresh: () => void
}

export function ApiProductLinkApi({ apiProduct, linkedService, onLinkedServiceUpdate, handleRefresh }: ApiProductLinkApiProps) {
  // 移除了内部的 linkedService 状态，现在从 props 接收
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [nacosInstances, setNacosInstances] = useState<NacosInstance[]>([])
  const [gatewayLoading, setGatewayLoading] = useState(false)
  const [nacosLoading, setNacosLoading] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null)
  const [selectedNacos, setSelectedNacos] = useState<NacosInstance | null>(null)
  const [nacosNamespaces, setNacosNamespaces] = useState<any[]>([])
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null)
  const [apiList, setApiList] = useState<ApiItem[] | NacosMCPItem[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [sourceType, setSourceType] = useState<'GATEWAY' | 'NACOS'>('GATEWAY')
  const [parsedTools, setParsedTools] = useState<Array<{
    name: string;
    description: string;
    args?: Array<{
      name: string;
      description: string;
      type: string;
      required: boolean;
      position: string;
      default?: string;
      enum?: string[];
    }>;
  }>>([])
  const [httpJson, setHttpJson] = useState('')
  const [sseJson, setSseJson] = useState('')
  const [localJson, setLocalJson] = useState('')

  useEffect(() => {    
    fetchGateways()
    fetchNacosInstances()
  }, [])

  // 解析MCP tools配置
  useEffect(() => {
    if (apiProduct.type === 'MCP_SERVER' && apiProduct.mcpConfig?.tools) {
      const parsedConfig = parseYamlConfig(apiProduct.mcpConfig.tools)
      if (parsedConfig && parsedConfig.tools && Array.isArray(parsedConfig.tools)) {
        setParsedTools(parsedConfig.tools)
      } else {
        // 如果tools字段存在但是空数组，也设置为空数组
        setParsedTools([])
      }
    } else {
      setParsedTools([])
    }
  }, [apiProduct])

  // 生成连接配置
  useEffect(() => {
    if (apiProduct.type === 'MCP_SERVER' && apiProduct.mcpConfig) {
      generateConnectionConfig(
        apiProduct.mcpConfig.mcpServerConfig.domains,
        apiProduct.mcpConfig.mcpServerConfig.path,
        apiProduct.mcpConfig.mcpServerName,
        apiProduct.mcpConfig.mcpServerConfig.rawConfig,
        apiProduct.mcpConfig.meta?.protocol
      )
    }
  }, [apiProduct])

  // 解析YAML配置的函数
  const parseYamlConfig = (yamlString: string): {
    tools?: Array<{
      name: string;
      description: string;
      args?: Array<{
        name: string;
        description: string;
        type: string;
        required: boolean;
        position: string;
        default?: string;
        enum?: string[];
      }>;
    }>;
  } | null => {
    try {
      const parsed = yaml.load(yamlString) as {
        tools?: Array<{
          name: string;
          description: string;
          args?: Array<{
            name: string;
            description: string;
            type: string;
            required: boolean;
            position: string;
            default?: string;
            enum?: string[];
          }>;
        }>;
      };
      return parsed;
    } catch (error) {
      console.error('YAML解析失败:', error)
      return null
    }
  }

  // 生成连接配置
  const generateConnectionConfig = (
    domains: Array<{ domain: string; protocol: string }> | null | undefined,
    path: string | null | undefined,
    serverName: string,
    localConfig?: unknown,
    protocolType?: string
  ) => {
    // 互斥：优先判断本地模式
    if (localConfig) {
      const localConfigJson = JSON.stringify(localConfig, null, 2);
      setLocalJson(localConfigJson);
      setHttpJson("");
      setSseJson("");
      return;
    }

    // HTTP/SSE 模式
    if (domains && domains.length > 0 && path) {
      const domain = domains[0]
      const fullUrl = `${domain.protocol}://${domain.domain}${path || '/'}`

      if (protocolType === 'SSE') {
        // 仅生成SSE配置，不追加/sse
        const sseConfig = {
          mcpServers: {
            [serverName]: {
              type: "sse",
              url: fullUrl
            }
          }
        }
        setSseJson(JSON.stringify(sseConfig, null, 2))
        setHttpJson("")
        setLocalJson("")
        return;
      } else if (protocolType === 'StreamableHTTP') {
        // 仅生成HTTP配置
        const httpConfig = {
          mcpServers: {
            [serverName]: {
              url: fullUrl
            }
          }
        }
        setHttpJson(JSON.stringify(httpConfig, null, 2))
        setSseJson("")
        setLocalJson("")
        return;
      } else {
        // protocol为null或其他值：生成两种配置
        const sseConfig = {
          mcpServers: {
            [serverName]: {
              type: "sse",
              url: `${fullUrl}/sse`
            }
          }
        }

        const httpConfig = {
          mcpServers: {
            [serverName]: {
              url: fullUrl
            }
          }
        }

        setSseJson(JSON.stringify(sseConfig, null, 2))
        setHttpJson(JSON.stringify(httpConfig, null, 2))
        setLocalJson("")
        return;
      }
    }

    // 无有效配置
    setHttpJson("");
    setSseJson("");
    setLocalJson("");
  }

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败，请手动复制");
    }
  }

  const fetchGateways = async () => {
    setGatewayLoading(true)
    try {
      const res = await gatewayApi.getGateways()
      let result;
      if (apiProduct.type === 'REST_API') {
        // REST API 只支持 APIG_API 网关
        result = res.data?.content?.filter?.((item: Gateway) => item.gatewayType === 'APIG_API');
      } else if (apiProduct.type === 'AGENT_API') {
        // Agent API 只支持 APIG_AI 网关
        result = res.data?.content?.filter?.((item: Gateway) => item.gatewayType === 'APIG_AI');
      } else {
        // MCP Server 支持 HIGRESS、APIG_AI、ADP_AI_GATEWAY
        result = res.data?.content?.filter?.((item: Gateway) => item.gatewayType === 'HIGRESS' || item.gatewayType === 'APIG_AI' || item.gatewayType === 'ADP_AI_GATEWAY');
      }
      setGateways(result || [])
    } catch (error) {
      console.error('获取网关列表失败:', error)
    } finally {
      setGatewayLoading(false)
    }
  }

  const fetchNacosInstances = async () => {
    setNacosLoading(true)
    try {
      const res = await nacosApi.getNacos({
        page: 1,
        size: 1000 // 获取所有 Nacos 实例
      })
      setNacosInstances(res.data.content || [])
    } catch (error) {
      console.error('获取Nacos实例列表失败:', error)
    } finally {
      setNacosLoading(false)
    }
  }

  const handleSourceTypeChange = (value: 'GATEWAY' | 'NACOS') => {
    setSourceType(value)
  setSelectedGateway(null)
  setSelectedNacos(null)
  setSelectedNamespace(null)
  setNacosNamespaces([])
    setApiList([])
    form.setFieldsValue({
      gatewayId: undefined,
      nacosId: undefined,
      apiId: undefined
    })
  }

  const handleGatewayChange = async (gatewayId: string) => {
    const gateway = gateways.find(g => g.gatewayId === gatewayId)
    setSelectedGateway(gateway || null)
    
    if (!gateway) return

    setApiLoading(true)
    try {
      if (gateway.gatewayType === 'APIG_API') {
        // APIG_API类型：获取REST API列表
        const restRes = await gatewayApi.getGatewayRestApis(gatewayId, {})
        const restApis = (restRes.data?.content || []).map((api: any) => ({
          apiId: api.apiId,
          apiName: api.apiName,
          type: 'REST API'
        }))
        setApiList(restApis)
      } else if (gateway.gatewayType === 'HIGRESS') {
        // HIGRESS类型：获取MCP Server列表
        const res = await gatewayApi.getGatewayMcpServers(gatewayId, {
          page: 1,
          size: 1000 // 获取所有MCP Server
        })
        const mcpServers = (res.data?.content || []).map((api: any) => ({
          mcpServerName: api.mcpServerName,
          fromGatewayType: 'HIGRESS' as const,
          type: 'MCP Server'
        }))
        setApiList(mcpServers)
      } else if (gateway.gatewayType === 'APIG_AI') {
        if (apiProduct.type === 'AGENT_API') {
          // APIG_AI类型 + Agent API产品：获取Agent API列表
          const res = await gatewayApi.getGatewayAgentApis(gatewayId, {
            page: 1,
            size: 500 // 获取所有Agent API
          })
          const agentApis = (res.data?.content || []).map((api: any) => ({
            agentApiId: api.agentApiId,
            agentApiName: api.agentApiName,
            fromGatewayType: 'APIG_AI' as const,
            type: 'Agent API'
          }))
          setApiList(agentApis)
        } else {
          // APIG_AI类型 + MCP Server产品：获取MCP Server列表
          const res = await gatewayApi.getGatewayMcpServers(gatewayId, {
            page: 1,
            size: 500 // 获取所有MCP Server
          })
          const mcpServers = (res.data?.content || []).map((api: any) => ({
            mcpServerName: api.mcpServerName,
            fromGatewayType: 'APIG_AI' as const,
            mcpRouteId: api.mcpRouteId,
            apiId: api.apiId,
            mcpServerId: api.mcpServerId,
            type: 'MCP Server'
          }))
          setApiList(mcpServers)
        }
      } else if (gateway.gatewayType === 'ADP_AI_GATEWAY') {
        // ADP_AI_GATEWAY类型：获取MCP Server列表
        const res = await gatewayApi.getGatewayMcpServers(gatewayId, {
          page: 1,
          size: 500 // 获取所有MCP Server
        })
        const mcpServers = (res.data?.content || []).map((api: any) => ({
          mcpServerName: api.mcpServerName || api.name,
          fromGatewayType: 'ADP_AI_GATEWAY' as const,
          mcpRouteId: api.mcpRouteId,
          mcpServerId: api.mcpServerId,
          type: 'MCP Server'
        }))
        setApiList(mcpServers)
      }
    } catch (error) {
    } finally {
      setApiLoading(false)
    }
  }

  const handleNacosChange = async (nacosId: string) => {
    const nacos = nacosInstances.find(n => n.nacosId === nacosId)
    setSelectedNacos(nacos || null)
    setSelectedNamespace(null)
    setApiList([])
    setNacosNamespaces([])
    if (!nacos) return

    // 获取命名空间列表
    try {
      const nsRes = await nacosApi.getNamespaces(nacosId, { page: 1, size: 1000 })
      const namespaces = (nsRes.data?.content || []).map((ns: any) => ({
        namespaceId: ns.namespaceId,
        namespaceName: ns.namespaceName || ns.namespaceId,
        namespaceDesc: ns.namespaceDesc
      }))
      setNacosNamespaces(namespaces)
    } catch (e) {
      console.error('获取命名空间失败', e)
    }
  }

  const handleNamespaceChange = async (namespaceId: string) => {
    setSelectedNamespace(namespaceId)
    setApiLoading(true)
    try {
      if (!selectedNacos) return
      const res = await nacosApi.getNacosMcpServers(selectedNacos.nacosId, {
        page: 1,
        size: 1000,
        namespaceId
      })
      const mcpServers = (res.data?.content || []).map((api: any) => ({
        mcpServerName: api.mcpServerName,
        fromGatewayType: 'NACOS' as const,
        type: `MCP Server (${namespaceId})`
      }))
      setApiList(mcpServers)
    } catch (e) {
      console.error('获取Nacos MCP Server列表失败:', e)
    } finally {
      setApiLoading(false)
    }
  }


  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const { sourceType, gatewayId, nacosId, apiId } = values
      const selectedApi = apiList.find((item: any) => {
        if ('apiId' in item) {
          // REST API或MCP server 会返回apiId和mcpRouteId，此时mcpRouteId为唯一值，apiId不是
          if ('mcpRouteId' in item) {
            return item.mcpRouteId === apiId
          } else {
            return item.apiId === apiId
          }
        } else if ('mcpServerName' in item) {
          return item.mcpServerName === apiId
        } else if ('agentApiId' in item || 'agentApiName' in item) {
          // Agent API: 匹配agentApiId或agentApiName
          return item.agentApiId === apiId || item.agentApiName === apiId
        }
        return false
      })
      const newService: LinkedService = {
        gatewayId: sourceType === 'GATEWAY' ? gatewayId : undefined, // 对于 Nacos，使用 nacosId 作为 gatewayId
        nacosId: sourceType === 'NACOS' ? nacosId : undefined,
        sourceType,
        productId: apiProduct.productId,
        apigRefConfig: selectedApi && ('apiId' in selectedApi || 'agentApiId' in selectedApi || 'agentApiName' in selectedApi) ? selectedApi as RestAPIItem | APIGAIMCPItem | AIGatewayAgentItem : undefined,
        higressRefConfig: selectedApi && 'mcpServerName' in selectedApi && 'fromGatewayType' in selectedApi && selectedApi.fromGatewayType === 'HIGRESS' ? selectedApi as HigressMCPItem : undefined,
        nacosRefConfig: sourceType === 'NACOS' && selectedApi && 'fromGatewayType' in selectedApi && selectedApi.fromGatewayType === 'NACOS' ? {
          ...selectedApi,
          namespaceId: selectedNamespace || 'public'
        } : undefined,
        adpAIGatewayRefConfig: selectedApi && 'fromGatewayType' in selectedApi && selectedApi.fromGatewayType === 'ADP_AI_GATEWAY' ? selectedApi as APIGAIMCPItem : undefined,
      }
      apiProductApi.createApiProductRef(apiProduct.productId, newService).then(async () => {
        message.success('关联成功')
        setIsModalVisible(false)
        
        // 重新获取关联信息并更新
        try {
          const res = await apiProductApi.getApiProductRef(apiProduct.productId)
          onLinkedServiceUpdate(res.data || null)
        } catch (error) {
          console.error('获取关联API失败:', error)
          onLinkedServiceUpdate(null)
        }
        
        // 重新获取产品详情（特别重要，因为关联API后apiProduct.apiConfig可能会更新）
        handleRefresh()
        
        form.resetFields()
        setSelectedGateway(null)
        setSelectedNacos(null)
        setApiList([])
        setSourceType('GATEWAY')
      }).catch(() => {
        message.error('关联失败')
      })
    })
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setSelectedGateway(null)
    setSelectedNacos(null)
    setApiList([])
    setSourceType('GATEWAY')
  }


  const handleDelete = () => {
    if (!linkedService) return

    Modal.confirm({
      title: '确认解除关联',
      content: '确定要解除与当前API的关联吗？',
      icon: <ExclamationCircleOutlined />,
      onOk() {
        return apiProductApi.deleteApiProductRef(apiProduct.productId).then(() => {
          message.success('解除关联成功')
          onLinkedServiceUpdate(null)
          // 重新获取产品详情（解除关联后apiProduct.apiConfig可能会更新）
          handleRefresh()
        }).catch(() => {
          message.error('解除关联失败')
        })
      }
    })
  }

  const getServiceInfo = () => {
    if (!linkedService) return null

    let apiName = ''
    let apiType = ''
    let sourceInfo = ''
    let gatewayInfo = ''

    // 首先根据 Product 的 type 确定基本类型
    if (apiProduct.type === 'REST_API') {
      // REST API 类型产品 - 只能关联 API 网关上的 REST API
      if (linkedService.sourceType === 'GATEWAY' && linkedService.apigRefConfig && 'apiName' in linkedService.apigRefConfig) {
        apiName = linkedService.apigRefConfig.apiName || '未命名'
        apiType = 'REST API'
        sourceInfo = 'API网关'
        gatewayInfo = linkedService.gatewayId || '未知'
      }
    } else if (apiProduct.type === 'MCP_SERVER') {
      // MCP Server 类型产品 - 可以关联多种平台上的 MCP Server
      apiType = 'MCP Server'
      
      if (linkedService.sourceType === 'GATEWAY' && linkedService.apigRefConfig && 'mcpServerName' in linkedService.apigRefConfig) {
        // AI网关上的MCP Server
        apiName = linkedService.apigRefConfig.mcpServerName || '未命名'
        sourceInfo = 'AI网关'
        gatewayInfo = linkedService.gatewayId || '未知'
      } else if (linkedService.sourceType === 'GATEWAY' && linkedService.higressRefConfig) {
        // Higress网关上的MCP Server
        apiName = linkedService.higressRefConfig.mcpServerName || '未命名'
        sourceInfo = 'Higress网关'
        gatewayInfo = linkedService.gatewayId || '未知'
      } else if (linkedService.sourceType === 'GATEWAY' && linkedService.adpAIGatewayRefConfig) {
        // 专有云AI网关上的MCP Server
        apiName = linkedService.adpAIGatewayRefConfig.mcpServerName || '未命名'
        sourceInfo = '专有云AI网关'
        gatewayInfo = linkedService.gatewayId || '未知'
      } else if (linkedService.sourceType === 'NACOS' && linkedService.nacosRefConfig) {
        // Nacos上的MCP Server
        apiName = linkedService.nacosRefConfig.mcpServerName || '未命名'
        sourceInfo = 'Nacos服务发现'
        gatewayInfo = linkedService.nacosId || '未知'
      }
    } else if (apiProduct.type === 'AGENT_API') {
      // Agent API 类型产品 - 只能关联 AI 网关上的 Agent API
      apiType = 'Agent API'
      
      if (linkedService.sourceType === 'GATEWAY' && linkedService.apigRefConfig && 'agentApiName' in linkedService.apigRefConfig) {
        // AI网关上的Agent API
        apiName = linkedService.apigRefConfig.agentApiName || '未命名'
        sourceInfo = 'AI网关'
        gatewayInfo = linkedService.gatewayId || '未知'
      }
      // 注意：Agent API 不支持专有云AI网关（ADP_AI_GATEWAY）
    }

    return {
      apiName,
      apiType,
      sourceInfo,
      gatewayInfo
    }
  }

  const renderLinkInfo = () => {
    const serviceInfo = getServiceInfo()
    
    // 没有关联任何API
    if (!linkedService || !serviceInfo) {
      return (
        <Card className="mb-6">
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">暂未关联任何API</div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              关联API
            </Button>
          </div>
        </Card>
      )
    }

    return (
      <Card 
        className="mb-6"
        title="关联详情"
        extra={
          <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleDelete}>
            解除关联
          </Button>
        }
      >
        <div>
          {/* 第一行：名称 + 类型 */}
          <div className="grid grid-cols-6 gap-8 items-center pt-2 pb-2">
            <span className="text-xs text-gray-600">名称:</span>
            <span className="col-span-2 text-xs text-gray-900">{serviceInfo.apiName || '未命名'}</span>
            <span className="text-xs text-gray-600">类型:</span>
            <span className="col-span-2 text-xs text-gray-900">{serviceInfo.apiType}</span>
          </div>
          
          {/* 第二行：来源 + ID */}
          <div className="grid grid-cols-6 gap-8 items-center pt-2 pb-2">
            <span className="text-xs text-gray-600">来源:</span>
            <span className="col-span-2 text-xs text-gray-900">{serviceInfo.sourceInfo}</span>
            <span className="text-xs text-gray-600">
              {linkedService?.sourceType === 'NACOS' ? 'Nacos ID:' : '网关ID:'}
            </span>
            <span className="col-span-2 text-xs text-gray-700">{serviceInfo.gatewayInfo}</span>
          </div>
        </div>
      </Card>
    )
  }

  const renderApiConfig = () => {
    const isMcp = apiProduct.type === 'MCP_SERVER'
    const isOpenApi = apiProduct.type === 'REST_API'
    const isAgent = apiProduct.type === 'AGENT_API'

    // MCP Server类型：无论是否有linkedService都显示tools和连接点配置  
    if (isMcp && apiProduct.mcpConfig) {
      return (
        <Card title="配置详情">
          <Row gutter={24}>
            {/* 左侧：工具列表 */}
            <Col span={15}>
              <Card>
                <Tabs
                  defaultActiveKey="tools"
                  items={[
                    {
                      key: "tools",
                      label: `Tools (${parsedTools.length})`,
                      children: parsedTools.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg bg-gray-50">
                          {parsedTools.map((tool, idx) => (
                            <div key={idx} className={idx < parsedTools.length - 1 ? "border-b border-gray-200" : ""}>
                              <Collapse
                                ghost
                                expandIconPosition="end"
                                items={[{
                                  key: idx.toString(),
                                  label: tool.name,
                                  children: (
                                    <div className="px-4 pb-2">
                                      <div className="text-gray-600 mb-4">{tool.description}</div>
                                      
                                      {tool.args && tool.args.length > 0 && (
                                        <div>
                                          <p className="font-medium text-gray-700 mb-3">输入参数:</p>
                                          {tool.args.map((arg, argIdx) => (
                                            <div key={argIdx} className="mb-3">
                                              <div className="flex items-center mb-2">
                                                <span className="font-medium text-gray-800 mr-2">{arg.name}</span>
                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded mr-2">
                                                  {arg.type}
                                                </span>
                                                {arg.required && (
                                                  <span className="text-red-500 text-xs mr-2">*</span>
                                                )}
                                                {arg.description && (
                                                  <span className="text-xs text-gray-500">
                                                    {arg.description}
                                                  </span>
                                                )}
                                              </div>
                                              <input
                                                type="text"
                                                placeholder={arg.description || `请输入${arg.name}`}
                                                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                                                defaultValue={arg.default !== undefined ? JSON.stringify(arg.default) : ''}
                                              />
                                              {arg.enum && (
                                                <div className="text-xs text-gray-500">
                                                  可选值: {arg.enum.map(value => <code key={value} className="mr-1">{value}</code>)}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                }]}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-8">
                          No tools available
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>

            {/* 右侧：连接点配置 */}
            <Col span={9}>
              <Card>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">连接点配置</h3>
                  <Tabs
                    size="small" 
                    defaultActiveKey={localJson ? "local" : (sseJson ? "sse" : "http")}
                    items={(() => {
                      const tabs = [];
                      
                      if (localJson) {
                        tabs.push({
                          key: "local",
                          label: "Stdio",
                          children: (
                            <div className="relative bg-gray-50 border border-gray-200 rounded-md p-3">
                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                className="absolute top-2 right-2 z-10"
                                onClick={() => handleCopy(localJson)}
                              >
                              </Button>
                              <div className="text-gray-800 font-mono text-xs overflow-x-auto">
                                <pre className="whitespace-pre-wrap">{localJson}</pre>
                              </div>
                            </div>
                          ),
                        });
                      } else {
                        if (sseJson) {
                          tabs.push({
                            key: "sse",
                            label: "SSE",
                            children: (
                              <div className="relative bg-gray-50 border border-gray-200 rounded-md p-3">
                                <Button
                                  size="small"
                                  icon={<CopyOutlined />}
                                  className="absolute top-2 right-2 z-10"
                                  onClick={() => handleCopy(sseJson)}
                                >
                                </Button>
                                <div className="text-gray-800 font-mono text-xs overflow-x-auto">
                                  <pre className="whitespace-pre-wrap">{sseJson}</pre>
                                </div>
                              </div>
                            ),
                          });
                        }
                        
                        if (httpJson) {
                          tabs.push({
                            key: "http",
                            label: "Streaming HTTP",
                            children: (
                              <div className="relative bg-gray-50 border border-gray-200 rounded-md p-3">
                                <Button
                                  size="small"
                                  icon={<CopyOutlined />}
                                  className="absolute top-2 right-2 z-10"
                                  onClick={() => handleCopy(httpJson)}
                                >
                                </Button>
                                <div className="text-gray-800 font-mono text-xs overflow-x-auto">
                                  <pre className="whitespace-pre-wrap">{httpJson}</pre>
                                </div>
                              </div>
                            ),
                          });
                        }
                      }
                      
                      return tabs;
                    })()}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )
    }

    // Agent API类型：显示协议支持和路由配置
    if (isAgent && apiProduct.agentConfig?.agentAPIConfig) {
      const agentAPIConfig = apiProduct.agentConfig.agentAPIConfig
      const routes = agentAPIConfig.routes || []
      const protocols = agentAPIConfig.agentProtocols || []


      // 生成匹配类型前缀文字
      const getMatchTypePrefix = (matchType: string) => {
        switch (matchType) {
          case 'Exact':
            return '等于'
          case 'Prefix': 
            return '前缀是'
          case 'RegularExpression':
            return '正则是'
          default:
            return '等于'
        }
      }

      // 生成路由显示文本（优化方法显示）
      const getRouteDisplayText = (route: any) => {
        if (!route.match) return 'Unknown Route'
        
        const path = route.match.path?.value || '/'
        const pathType = route.match.path?.type
        
        // 拼接域名信息
        let domainInfo = ''
        if (route.domains && route.domains.length > 0) {
          const domain = route.domains[0]
          domainInfo = `${domain.protocol.toLowerCase()}://${domain.domain}`
        }
        
        // 构建基本路由信息（匹配符号直接加到path后面）
        let pathWithSuffix = path
        if (pathType === 'Prefix') {
          pathWithSuffix = `${path}*`
        } else if (pathType === 'RegularExpression') {
          pathWithSuffix = `${path}~`
        }
        // 精确匹配不加任何符号
        
        let routeText = `${domainInfo}${pathWithSuffix}`
        
        // 添加描述信息
        if (route.description && route.description.trim()) {
          routeText += ` - ${route.description.trim()}`
        }
        
        return routeText
      }

      // 获取方法显示文本
      const getMethodsText = (route: any) => {
        if (!route.match?.methods || route.match.methods.length === 0) {
          return 'ANY'
        }
        return route.match.methods.join(', ')
      }

      // 生成完整URL
      const getFullUrl = (route: any) => {
        if (!route.domains || route.domains.length === 0) return ''
        const domain = route.domains[0]
        const path = route.match?.path?.value || '/'
        return `${domain.protocol.toLowerCase()}://${domain.domain}${path}`
      }

      return (
        <Card title="配置详情">
          <div className="space-y-4">
          {/* 协议信息 */}
          <div className="text-sm">
            <span className="text-gray-700">协议: </span>
            <span className="font-medium">{protocols.join(', ')}</span>
          </div>

            {/* 路由配置表格 */}
            {routes.length > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-3">路由配置:</div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Collapse ghost expandIconPosition="end">
                    {routes.map((route, index) => (
                      <Collapse.Panel
                        key={index}
                        header={
                          <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="font-mono text-sm font-medium text-blue-600 mb-1">
                                {getRouteDisplayText(route)}
                              </div>
                              <div className="text-xs text-gray-500">
                                方法: <span className="font-medium text-gray-700">{getMethodsText(route)}</span>
                              </div>
                            </div>
                            <Button
                              size="small"
                              type="text"
                              onClick={async (e) => {
                                e.stopPropagation()
                                const fullUrl = getFullUrl(route)
                                if (fullUrl) {
                                  try {
                                    await copyToClipboard(fullUrl)
                                    message.success('链接已复制到剪贴板')
                                  } catch (error) {
                                    message.error('复制失败')
                                  }
                                }
                              }}
                            >
                              <CopyOutlined />
                            </Button>
                          </div>
                        }
                        style={{
                          borderBottom: index < routes.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}
                    >
                      <div className="pl-4 space-y-3">
                        {/* 域名信息 */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">域名:</div>
                          {route.domains?.map((domain: any, domainIndex: number) => (
                            <div key={domainIndex} className="text-sm">
                              <span className="font-mono">{domain.protocol.toLowerCase()}://{domain.domain}</span>
                            </div>
                          ))}
                        </div>

                        {/* 匹配规则 */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-gray-500">路径:</div>
                            <div className="font-mono">
                              {getMatchTypePrefix(route.match?.path?.type)} {route.match?.path?.value}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">方法:</div>
                            <div>{route.match?.methods ? route.match.methods.join(', ') : 'ANY'}</div>
                          </div>
                        </div>

                        {/* 请求头匹配 */}
                        {route.match?.headers && route.match.headers.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">请求头匹配:</div>
                            <div className="space-y-1">
                              {route.match.headers.map((header: any, headerIndex: number) => (
                                <div key={headerIndex} className="text-sm font-mono">
                                  {header.name} {getMatchTypePrefix(header.type)} {header.value}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 查询参数匹配 */}
                        {route.match?.queryParams && route.match.queryParams.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">查询参数匹配:</div>
                            <div className="space-y-1">
                              {route.match.queryParams.map((param: any, paramIndex: number) => (
                                <div key={paramIndex} className="text-sm font-mono">
                                  {param.name} {getMatchTypePrefix(param.type)} {param.value}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 描述 */}
                        {route.description && (
                          <div>
                            <div className="text-xs text-gray-500">描述:</div>
                            <div className="text-sm">{route.description}</div>
                          </div>
                        )}
                      </div>
                    </Collapse.Panel>
                  ))}
                </Collapse>
                </div>
              </div>
            )}
          </div>
        </Card>
      )
    }

    // REST API类型：需要linkedService才显示
    if (!linkedService) {
      return null
    }

    return (
      <Card title="配置详情">

        {isOpenApi && apiProduct.apiConfig && apiProduct.apiConfig.spec && (
          <div>
            <h4 className="text-base font-medium mb-4">REST API接口文档</h4>
            <SwaggerUIWrapper apiSpec={apiProduct.apiConfig.spec} />
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">API关联</h1>
        <p className="text-gray-600">管理Product关联的API</p>
      </div>

      {renderLinkInfo()}
      {renderApiConfig()}

      <Modal
        title={linkedService ? '重新关联API' : '关联新API'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="关联"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="sourceType"
            label="来源类型"
            initialValue="GATEWAY"
            rules={[{ required: true, message: '请选择来源类型' }]}
          >
            <Select placeholder="请选择来源类型" onChange={handleSourceTypeChange}>
              <Select.Option value="GATEWAY">网关</Select.Option>
              <Select.Option value="NACOS" disabled={apiProduct.type === 'REST_API' || apiProduct.type === 'AGENT_API'}>Nacos</Select.Option>
            </Select>
          </Form.Item>

          {sourceType === 'GATEWAY' && (
            <Form.Item
              name="gatewayId"
              label="网关实例"
              rules={[{ required: true, message: '请选择网关' }]}
            >
              <Select 
                placeholder="请选择网关实例" 
                loading={gatewayLoading}
                showSearch
                filterOption={(input, option) =>
                  (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleGatewayChange}
                optionLabelProp="label"
              >
                {gateways.filter(gateway => {
                  // 如果是Agent API类型，只显示AI网关（APIG_AI）
                  if (apiProduct.type === 'AGENT_API') {
                    return gateway.gatewayType === 'APIG_AI';
                  }
                  return true;
                }).map(gateway => (
                  <Select.Option
                    key={gateway.gatewayId}
                    value={gateway.gatewayId}
                    label={gateway.gatewayName}
                  >
                    <div>
                      <div className="font-medium">{gateway.gatewayName}</div>
                      <div className="text-sm text-gray-500">
                        {gateway.gatewayId} - {getGatewayTypeLabel(gateway.gatewayType as any)}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {sourceType === 'NACOS' && (
            <Form.Item
              name="nacosId"
              label="Nacos实例"
              rules={[{ required: true, message: '请选择Nacos实例' }]}
            >
              <Select
                placeholder="请选择Nacos实例"
                loading={nacosLoading}
                showSearch
                filterOption={(input, option) =>
                  (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleNacosChange}
                optionLabelProp="label"
              >
                {nacosInstances.map(nacos => (
                  <Select.Option 
                    key={nacos.nacosId} 
                    value={nacos.nacosId}
                    label={nacos.nacosName}
                  >
                    <div>
                      <div className="font-medium">{nacos.nacosName}</div>
                      <div className="text-sm text-gray-500">
                        {nacos.serverUrl}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {sourceType === 'NACOS' && selectedNacos && (
            <Form.Item
              name="namespaceId"
              label="命名空间"
              rules={[{ required: true, message: '请选择命名空间' }]}
            >
              <Select
                placeholder="请选择命名空间"
                loading={apiLoading && nacosNamespaces.length === 0}
                onChange={handleNamespaceChange}
                showSearch
                filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}
                optionLabelProp="label"
              >
                {nacosNamespaces.map(ns => (
                  <Select.Option key={ns.namespaceId} value={ns.namespaceId} label={ns.namespaceName}>
                    <div>
                      <div className="font-medium">{ns.namespaceName}</div>
                      <div className="text-sm text-gray-500">{ns.namespaceId}</div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          
          {(selectedGateway || (selectedNacos && selectedNamespace)) && (
            <Form.Item
              name="apiId"
              label={apiProduct.type === 'REST_API' ? '选择REST API' : 
                     apiProduct.type === 'AGENT_API' ? '选择Agent API' : '选择MCP Server'}
              rules={[{ required: true, message: apiProduct.type === 'REST_API' ? '请选择REST API' : 
                       apiProduct.type === 'AGENT_API' ? '请选择Agent API' : '请选择MCP Server' }]}
            >
              <Select 
                placeholder={apiProduct.type === 'REST_API' ? '请选择REST API' : 
                           apiProduct.type === 'AGENT_API' ? '请选择Agent API' : '请选择MCP Server'} 
                loading={apiLoading}
                showSearch
                filterOption={(input, option) =>
                  (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                optionLabelProp="label"
              >
                {apiList.map((api: any) => {
                  let key, value, displayName;
                  if (apiProduct.type === 'REST_API') {
                    key = api.apiId;
                    value = api.apiId;
                    displayName = api.apiName;
                  } else if (apiProduct.type === 'AGENT_API') {
                    key = api.agentApiId || api.agentApiName;
                    value = api.agentApiId || api.agentApiName;
                    displayName = api.agentApiName;
                  } else {
                    // MCP Server
                    key = api.mcpRouteId || api.mcpServerName || api.name;
                    value = api.mcpRouteId || api.mcpServerName || api.name;
                    displayName = api.mcpServerName || api.name;
                  }
                  
                  return (
                    <Select.Option 
                      key={key} 
                      value={value}
                      label={displayName}
                    >
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-sm text-gray-500">
                          {api.type} - {key}
                        </div>
                      </div>
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
} 