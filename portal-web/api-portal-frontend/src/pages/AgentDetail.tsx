import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { Layout } from "../components/Layout";
import { ProductHeader } from "../components/ProductHeader";
import {
  Card,
  Alert,
  Button,
  message,
  Tabs,
  Row,
  Col,
  Collapse,
  Select,
} from "antd";
import { CopyOutlined, RobotOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { ProductType } from "../types";
import type {
  Product,
  AgentApiProduct,
  ApiResponse,
  ApiProductAgentConfig,
} from "../types";
import remarkGfm from 'remark-gfm';

const { Panel } = Collapse;

function AgentDetail() {
  const { agentProductId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Product | null>(null);
  const [agentConfig, setAgentConfig] = useState<ApiProductAgentConfig | null>(null);
  const [selectedAgentDomainIndex, setSelectedAgentDomainIndex] = useState<number>(0);

  // 复制到剪贴板函数
  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${description}已复制到剪贴板`);
    } catch (error) {
      console.error("复制失败:", error);
      message.error("复制失败，请手动复制");
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!agentProductId) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response: ApiResponse<Product> = await api.get(`/products/${agentProductId}`);
        if (response.code === "SUCCESS" && response.data) {
          setData(response.data);

          // 处理Agent配置
          if (response.data.type === ProductType.AGENT_API) {
            const agentProduct = response.data as AgentApiProduct;

            if (agentProduct.agentConfig) {
              setAgentConfig(agentProduct.agentConfig);
            }
          }
        } else {
          setError(response.message || "数据加载失败");
        }
      } catch (error) {
        console.error("API请求失败:", error);
        setError("加载失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [agentProductId]);

  // 当产品切换时重置域名选择索引
  useEffect(() => {
    setSelectedAgentDomainIndex(0);
  }, [data?.productId]);

  if (error) {
    return (
      <Layout>
        <div style={{ padding: "24px" }}>
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
          />
        </div>
      </Layout>
    );
  }

  if (!data && !loading) {
    return (
      <Layout>
        <div style={{ padding: "24px" }}>
          <Alert message="未找到对应的Agent API" type="warning" showIcon />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div>Loading...</div>
        </div>
      </Layout>
    );
  }

  // 获取所有唯一域名
  const getAllUniqueDomains = () => {
    if (!agentConfig?.agentAPIConfig?.routes) return []
    
    const domainsMap = new Map<string, { domain: string; protocol: string }>()
    
    agentConfig.agentAPIConfig.routes.forEach(route => {
      if (route.domains && route.domains.length > 0) {
        route.domains.forEach((domain: any) => {
          const key = `${domain.protocol}://${domain.domain}`
          domainsMap.set(key, domain)
        })
      }
    })
    
    return Array.from(domainsMap.values())
  }

  const allUniqueDomains = getAllUniqueDomains()

  // 生成域名选择器选项
  const agentDomainOptions = allUniqueDomains.map((domain, index) => ({
    value: index,
    label: `${domain.protocol.toLowerCase()}://${domain.domain}`
  }))

  // Helper functions for route display - moved to component level
  const getMatchTypePrefix = (matchType: string) => {
    switch (matchType) {
      case 'Exact': return '等于'
      case 'Prefix': return '前缀是'
      case 'RegularExpression': return '正则是'
      default: return '等于'
    }
  }

  const getRouteDisplayText = (route: any, domainIndex: number = 0) => {
    if (!route.match) return 'Unknown Route'
    
    const path = route.match.path?.value || '/'
    const pathType = route.match.path?.type
    
    // 拼接域名信息 - 使用选择的域名索引
    let domainInfo = ''
    if (allUniqueDomains.length > 0 && allUniqueDomains.length > domainIndex) {
      const selectedDomain = allUniqueDomains[domainIndex]
      domainInfo = `${selectedDomain.protocol.toLowerCase()}://${selectedDomain.domain}`
    } else if (route.domains && route.domains.length > 0) {
      // 回退到路由的第一个域名
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
    
    let routeText = `${domainInfo}${pathWithSuffix}`
    
    // 添加描述信息
    if (route.description && route.description.trim()) {
      routeText += ` - ${route.description.trim()}`
    }
    
    return routeText
  }

  const getMethodsText = (route: any) => {
    if (!route.match?.methods || route.match.methods.length === 0) {
      return 'ANY'
    }
    return route.match.methods.join(', ')
  }

  return (
    <Layout>
      <div className="mb-6">
        <ProductHeader
          name={data?.name || ''}
          description={data?.description || ''}
          icon={data?.icon}
          defaultIcon="/Agent.svg"
          updatedAt={data?.updatedAt}
          productType="AGENT_API"
        />
        <hr className="border-gray-200 mt-4" />
      </div>

      {/* 主要内容区域 - 左右布局 */}
      <Row gutter={24}>
        {/* 左侧内容 */}
        <Col span={15}>
          <Card className="mb-6 rounded-lg border-gray-200">
            <Tabs
              defaultActiveKey="overview"
              items={[
                {
                  key: "overview",
                  label: "Overview",
                  children: data?.document ? (
                    <div className="min-h-[400px]">
                      <div 
                        className="prose prose-lg max-w-none"
                        style={{
                          lineHeight: '1.7',
                          color: '#374151',
                          fontSize: '16px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                        }}
                      >
                        <style>{`
                          .prose h1 {
                            color: #111827;
                            font-weight: 700;
                            font-size: 2.25rem;
                            line-height: 1.2;
                            margin-top: 0;
                            margin-bottom: 1.5rem;
                            border-bottom: 2px solid #e5e7eb;
                            padding-bottom: 0.5rem;
                          }
                          .prose h2 {
                            color: #1f2937;
                            font-weight: 600;
                            font-size: 1.875rem;
                            line-height: 1.3;
                            margin-top: 2rem;
                            margin-bottom: 1rem;
                            border-bottom: 1px solid #e5e7eb;
                            padding-bottom: 0.25rem;
                          }
                          .prose h3 {
                            color: #374151;
                            font-weight: 600;
                            font-size: 1.5rem;
                            margin-top: 1.5rem;
                            margin-bottom: 0.75rem;
                          }
                          .prose p {
                            margin-bottom: 1.25rem;
                            color: #4b5563;
                            line-height: 1.7;
                            font-size: 16px;
                          }
                          .prose code {
                            background-color: #f3f4f6;
                            border: 1px solid #e5e7eb;
                            border-radius: 0.375rem;
                            padding: 0.125rem 0.375rem;
                            font-size: 0.875rem;
                            color: #374151;
                            font-weight: 500;
                          }
                          .prose pre {
                            background-color: #1f2937;
                            border-radius: 0.5rem;
                            padding: 1.25rem;
                            overflow-x: auto;
                            margin: 1.5rem 0;
                            border: 1px solid #374151;
                          }
                          .prose pre code {
                            background-color: transparent;
                            border: none;
                            color: #f9fafb;
                            padding: 0;
                            font-size: 0.875rem;
                            font-weight: normal;
                          }
                          .prose blockquote {
                            border-left: 4px solid #3b82f6;
                            padding-left: 1rem;
                            margin: 1.5rem 0;
                            color: #6b7280;
                            font-style: italic;
                            background-color: #f8fafc;
                            padding: 1rem;
                            border-radius: 0.375rem;
                            font-size: 16px;
                          }
                          .prose ul, .prose ol {
                            margin: 1.25rem 0;
                            padding-left: 1.5rem;
                          }
                          .prose ol {
                            list-style-type: decimal;
                            list-style-position: outside;
                          }
                          .prose ul {
                            list-style-type: disc;
                            list-style-position: outside;
                          }
                          .prose li {
                            margin: 0.5rem 0;
                            color: #4b5563;
                            display: list-item;
                            font-size: 16px;
                          }
                          .prose ol li {
                            padding-left: 0.25rem;
                          }
                          .prose ul li {
                            padding-left: 0.25rem;
                          }
                          .prose table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 1.5rem 0;
                            font-size: 16px;
                          }
                          .prose th, .prose td {
                            border: 1px solid #d1d5db;
                            padding: 0.75rem;
                            text-align: left;
                          }
                          .prose th {
                            background-color: #f9fafb;
                            font-weight: 600;
                            color: #374151;
                            font-size: 16px;
                          }
                          .prose td {
                            color: #4b5563;
                            font-size: 16px;
                          }
                          .prose a {
                            color: #3b82f6;
                            text-decoration: underline;
                            font-weight: 500;
                            transition: color 0.2s;
                            font-size: inherit;
                          }
                          .prose a:hover {
                            color: #1d4ed8;
                          }
                          .prose strong {
                            color: #111827;
                            font-weight: 600;
                            font-size: inherit;
                          }
                          .prose em {
                            color: #6b7280;
                            font-style: italic;
                            font-size: inherit;
                          }
                          .prose hr {
                            border: none;
                            height: 1px;
                            background-color: #e5e7eb;
                            margin: 2rem 0;
                          }
                        `}</style>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.document}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No overview available
                    </div>
                  ),
                },
                {
                  key: "configuration",
                  label: `Configuration${agentConfig?.agentAPIConfig?.routes ? ` (${agentConfig.agentAPIConfig.routes.length})` : ''}`,
                  children: agentConfig?.agentAPIConfig ? (
                    <div className="space-y-4">
                      {/* 协议信息 */}
                      <div className="text-sm">
                        <span className="text-gray-700">协议: </span>
                        <span className="font-medium">{agentConfig.agentAPIConfig.agentProtocols?.join(', ') || 'DashScope'}</span>
                      </div>

                      {/* 路由配置表格 */}
                      {agentConfig.agentAPIConfig.routes && agentConfig.agentAPIConfig.routes.length > 0 && (
                        <div>
                          <div className="text-sm text-gray-600 mb-3">路由配置:</div>
                          
                          {/* 域名选择器 */}
                          {agentDomainOptions.length > 1 && (
                            <div className="mb-2">
                              <div className="flex items-stretch border border-gray-200 rounded-md overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 border-r border-gray-200 flex items-center whitespace-nowrap">
                                  域名
                                </div>
                                <div className="flex-1">
                                  <Select
                                    value={selectedAgentDomainIndex}
                                    onChange={setSelectedAgentDomainIndex}
                                    className="w-full"
                                    placeholder="选择域名"
                                    size="middle"
                                    bordered={false}
                                    style={{
                                      fontSize: '12px',
                                      height: '100%'
                                    }}
                                  >
                                    {agentDomainOptions.map((option) => (
                                      <Select.Option key={option.value} value={option.value}>
                                        <span className="text-xs text-gray-900 font-mono">
                                          {option.label}
                                        </span>
                                      </Select.Option>
                                    ))}
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Collapse ghost expandIconPosition="end">
                              {agentConfig.agentAPIConfig.routes.map((route, index) => (
                                <Panel
                                  key={index}
                                  header={
                                    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
                                      <div className="flex-1">
                                        <div className="font-mono text-sm font-medium text-blue-600 mb-1">
                                          {getRouteDisplayText(route, selectedAgentDomainIndex)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          方法: <span className="font-medium text-gray-700">{getMethodsText(route)}</span>
                                        </div>
                                      </div>
                                      <Button
                                        size="small"
                                        type="text"
                                        icon={<CopyOutlined />}
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          if (allUniqueDomains.length > 0 && allUniqueDomains.length > selectedAgentDomainIndex) {
                                            const selectedDomain = allUniqueDomains[selectedAgentDomainIndex]
                                            const path = route.match?.path?.value || '/'
                                            const fullUrl = `${selectedDomain.protocol.toLowerCase()}://${selectedDomain.domain}${path}`
                                            await copyToClipboard(fullUrl, "链接")
                                          } else if (route.domains && route.domains.length > 0) {
                                            const domain = route.domains[0]
                                            const path = route.match?.path?.value || '/'
                                            const fullUrl = `${domain.protocol.toLowerCase()}://${domain.domain}${path}`
                                            await copyToClipboard(fullUrl, "链接")
                                          }
                                        }}
                                      />
                                    </div>
                                  }
                                  style={{
                                    borderBottom: index < agentConfig.agentAPIConfig.routes.length - 1 ? '1px solid #e5e7eb' : 'none'
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
                                </Panel>
                              ))}
                            </Collapse>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No configuration available
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* 右侧调试功能 */}
        <Col span={9}>
          <Card className="mb-6 rounded-lg border-gray-200">
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-3">Agent调试</h3>
              <div className="text-center py-8">
                <div className="mb-3">
                  <RobotOutlined className="text-3xl text-gray-300" />
                </div>
                <div className="text-gray-500 mb-2">
                  <div className="text-sm">Agent调试</div>
                </div>
                <div className="text-sm text-gray-400">
                  🚀 敬请期待
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
}

export default AgentDetail;
