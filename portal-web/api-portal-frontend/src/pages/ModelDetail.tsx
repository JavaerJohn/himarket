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
import { CopyOutlined, BulbOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { ProductType } from "../types";
import type {
  Product,
  ModelApiProduct,
  ApiResponse,
  ApiProductModelConfig,
} from "../types";
import remarkGfm from 'remark-gfm';

const { Panel } = Collapse;

function ModelDetail() {
  const { modelProductId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Product | null>(null);
  const [modelConfig, setModelConfig] = useState<ApiProductModelConfig | null>(null);
  const [selectedModelDomainIndex, setSelectedModelDomainIndex] = useState<number>(0);
  const [selectedHigressDomainIndex, setSelectedHigressDomainIndex] = useState<number>(0);

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
      if (!modelProductId) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response: ApiResponse<Product> = await api.get(`/products/${modelProductId}`);
        if (response.code === "SUCCESS" && response.data) {
          setData(response.data);

          // 处理Model配置
          if (response.data.type === ProductType.MODEL_API) {
            const modelProduct = response.data as ModelApiProduct;

            if (modelProduct.modelConfig) {
              setModelConfig(modelProduct.modelConfig);
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
  }, [modelProductId]);

  // 当产品切换时重置域名选择索引
  useEffect(() => {
    setSelectedModelDomainIndex(0);
  }, [data?.productId]);

  // 获取所有唯一域名
  const getAllUniqueDomains = () => {
    if (!modelConfig?.aigwModelAPIConfig?.routes) return []
    
    const domainsMap = new Map<string, { domain: string; protocol: string }>()
    
    modelConfig.aigwModelAPIConfig.routes.forEach(route => {
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
  const modelDomainOptions = allUniqueDomains.map((domain, index) => ({
    value: index,
    label: `${domain.protocol.toLowerCase()}://${domain.domain}`
  }))

  // Helper functions for route display
  const getMatchTypePrefix = (type: string) => {
    switch (type) {
      case 'Exact':
        return '等于';
      case 'Prefix': 
        return '前缀是';
      case 'RegularExpression':
        return '正则是';
      default:
        return '等于';
    }
  };

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
    // 精确匹配不加任何符号
    
    let routeText = `${domainInfo}${pathWithSuffix}`
    
    // 添加描述信息
    if (route.description && route.description.trim()) {
      routeText += ` - ${route.description}`
    }
    
    return routeText
  };

  const getMethodsText = (route: any) => {
    const methods = route.match?.methods
    if (!methods || methods.length === 0) {
      return 'ANY'
    }
    return methods.join(', ')
  }

  // 获取适用场景中文翻译
  const getModelCategoryText = (category: string) => {
    switch (category) {
      case 'Text':
        return '文本生成'
      case 'Image':
        return '图片生成'
      case 'Video':
        return '视频生成'
      case 'Audio':
        return '语音合成'
      case 'Embedding':
        return '向量化（Embedding）'
      case 'Rerank':
        return '文本排序（Rerank）'
      case 'Others':
        return '其他'
      default:
        return category || '未知'
    }
  };

  // 生成curl命令示例
  const generateCurlExample = () => {
    // AI Gateway 的 cURL 生成
    if (modelConfig?.aigwModelAPIConfig?.routes && allUniqueDomains.length) {
      // 直接使用第一个路由
      const firstRoute = modelConfig.aigwModelAPIConfig.routes[0];

      if (!firstRoute?.match?.path?.value) {
        return null;
      }

      // 使用选择的域名
      const selectedDomain = allUniqueDomains[selectedModelDomainIndex] || allUniqueDomains[0];
      const baseUrl = `${selectedDomain.protocol.toLowerCase()}://${selectedDomain.domain}`;
      const fullUrl = `${baseUrl}${firstRoute.match.path.value}`;

      return `curl --location '${fullUrl}' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "model": "{{model_name}}",
    "stream": true,
    "max_tokens": 1024,
    "top_p": 0.95,
    "temperature": 1,
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "你是谁？"
        }
    ]
}'`;
    }

    // Higress 的 cURL 生成
    if (modelConfig?.higressModelConfig?.route) {
      const route = modelConfig.higressModelConfig.route;
      const domain = route.domains?.[0];
      const path = route.match?.path?.value;

      if (domain && path) {
        const fullUrl = `${domain.protocol.toLowerCase()}://${domain.domain}${path}`;
        return `curl --location '${fullUrl}' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "model": "{{model_name}}",
    "stream": true,
    "max_tokens": 1024,
    "top_p": 0.95,
    "temperature": 1,
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "你是谁？"
        }
    ]
}'`;
      }
    }

    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div>Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="p-8">
          <Alert message="Error" description={error} type="error" showIcon />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <ProductHeader
          name={data.name}
          description={data.description}
          icon={data.icon}
          updatedAt={data.updatedAt}
          productType="MODEL_API"
        />
        <hr className="border-gray-200 mt-4" />
      </div>

      {/* 主要内容区域 */}
      <Row gutter={24} style={{ marginTop: "24px" }}>
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
                  label: `Configuration${modelConfig?.aigwModelAPIConfig?.routes ? ` (${modelConfig.aigwModelAPIConfig.routes.length})` : modelConfig?.higressModelConfig ? ' (1)' : ''}`,
                  children: modelConfig?.aigwModelAPIConfig ? (
                    <div className="space-y-4">
                      {/* 适用场景信息 */}
                      {modelConfig.aigwModelAPIConfig.modelCategory && (
                        <div className="text-sm">
                          <span className="text-gray-700">适用场景: </span>
                          <span className="font-medium">{getModelCategoryText(modelConfig.aigwModelAPIConfig.modelCategory)}</span>
                        </div>
                      )}

                      {/* 协议信息 */}
                      <div className="text-sm">
                        <span className="text-gray-700">协议: </span>
                        <span className="font-medium">{modelConfig.aigwModelAPIConfig.aiProtocols?.join(', ') || 'DashScope'}</span>
                      </div>

                      {/* 路由配置表格 */}
                      {modelConfig.aigwModelAPIConfig.routes && modelConfig.aigwModelAPIConfig.routes.length > 0 && (
                        <div>
                          <div className="text-sm text-gray-600 mb-3">路由配置:</div>
                          
                          {/* 域名选择器 */}
                          {modelDomainOptions.length > 0 && (
                            <div className="mb-2">
                              <div className="flex items-stretch border border-gray-200 rounded-md overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 border-r border-gray-200 flex items-center whitespace-nowrap">
                                  域名
                                </div>
                                <div className="flex-1">
                                  <Select
                                    value={selectedModelDomainIndex}
                                    onChange={setSelectedModelDomainIndex}
                                    className="w-full"
                                    placeholder="选择域名"
                                    size="middle"
                                    bordered={false}
                                    style={{
                                      fontSize: '12px',
                                      height: '100%'
                                    }}
                                  >
                                    {modelDomainOptions.map((option) => (
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
                              {modelConfig.aigwModelAPIConfig.routes.map((route, index) => (
                                <Panel
                                  key={index}
                                  header={
                                    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
                                      <div className="flex-1">
                                        <div className="font-mono text-sm font-medium text-blue-600 mb-1">
                                          {getRouteDisplayText(route, selectedModelDomainIndex)}
                                          {route.builtin && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">默认</span>
                                          )}
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
                                          if (allUniqueDomains.length > 0 && allUniqueDomains.length > selectedModelDomainIndex) {
                                            const selectedDomain = allUniqueDomains[selectedModelDomainIndex]
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
                                    borderBottom: index < modelConfig.aigwModelAPIConfig.routes.length - 1 ? '1px solid #e5e7eb' : 'none'
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
                                        <div className="font-mono">
                                          {getMethodsText(route)}
                                        </div>
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
                                  </div>
                                </Panel>
                              ))}
                            </Collapse>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : modelConfig?.higressModelConfig ? (
                    (() => {
                      const route = modelConfig.higressModelConfig.route
                      // 生成域名选择器选项
                      const higressDomainOptions = route.domains?.map((domain, index) => ({
                        value: index,
                        label: `${domain.protocol.toLowerCase()}://${domain.domain}`
                      })) || []

                      return (
                        <div className="space-y-4">
                          {/* 路由配置 */}
                          <div>
                            <div className="text-sm text-gray-600 mb-3">路由配置:</div>

                            {/* 域名选择器 */}
                            {higressDomainOptions.length > 0 && (
                              <div className="mb-2">
                                <div className="flex items-stretch border border-gray-200 rounded-md overflow-hidden">
                                  <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 border-r border-gray-200 flex items-center whitespace-nowrap">
                                    域名
                                  </div>
                                  <div className="flex-1">
                                    <Select
                                      value={selectedHigressDomainIndex}
                                      onChange={setSelectedHigressDomainIndex}
                                      className="w-full"
                                      placeholder="选择域名"
                                      size="middle"
                                      bordered={false}
                                      style={{
                                        fontSize: '12px',
                                        height: '100%'
                                      }}
                                    >
                                      {higressDomainOptions.map((option) => (
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
                                <Panel
                                  key="higress-route"
                                  header={
                                    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
                                      <div className="flex-1">
                                        <div className="font-mono text-sm font-medium text-blue-600 mb-1">
                                          {(() => {
                                            if (!route.match) return 'Unknown Route'
                                            
                                            const path = route.match.path?.value || '/'
                                            const pathType = route.match.path?.type
                                            
                                            // 拼接域名信息 - 使用选择的域名索引
                                            let domainInfo = ''
                                            if (route.domains && route.domains.length > 0 && route.domains.length > selectedHigressDomainIndex) {
                                              const domain = route.domains[selectedHigressDomainIndex]
                                              domainInfo = `${domain.protocol.toLowerCase()}://${domain.domain}`
                                            } else if (route.domains && route.domains.length > 0) {
                                              // 回退到第一个域名
                                              const domain = route.domains[0]
                                              domainInfo = `${domain.protocol.toLowerCase()}://${domain.domain}`
                                            }
                                            
                                            // 构建路由信息
                                            let pathWithSuffix = path
                                            if (pathType === 'PRE' || pathType === 'Prefix') {
                                              pathWithSuffix = `${path}*`
                                            } else if (pathType === 'RegularExpression') {
                                              pathWithSuffix = `${path}~`
                                            }
                                            
                                            return `${domainInfo}${pathWithSuffix}`
                                          })()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          方法: <span className="font-medium text-gray-700">
                                            {(() => {
                                              const methods = route.match?.methods
                                              if (!methods || methods.length === 0) return 'ANY'
                                              return methods.join(', ')
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        size="small"
                                        type="text"
                                        icon={<CopyOutlined />}
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          if (route.domains && route.domains.length > 0 && route.domains.length > selectedHigressDomainIndex) {
                                            const domain = route.domains[selectedHigressDomainIndex]
                                            const path = route.match?.path?.value || '/'
                                            const fullUrl = `${domain.protocol.toLowerCase()}://${domain.domain}${path}`
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
                            >
                              {(() => {
                                const route = modelConfig.higressModelConfig.route
                                const getMatchTypePrefix = (matchType: string) => {
                                  switch (matchType) {
                                    case 'Exact':
                                      return '等于'
                                    case 'PRE':
                                    case 'Prefix':
                                      return '前缀是'
                                    case 'RegularExpression':
                                      return '正则是'
                                    default:
                                      return '等于'
                                  }
                                }
                                
                                return (
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
                                        <div className="font-mono">
                                          {route.match?.methods ? route.match.methods.join(', ') : 'ANY'}
                                        </div>
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

                                    {/* 模型匹配（Higress 特有） */}
                                    {route.match?.modelMatches && route.match.modelMatches.length > 0 && (
                                      <div>
                                        <div className="text-xs text-gray-500 mb-1">模型匹配:</div>
                                        <div className="space-y-1">
                                          {route.match.modelMatches.map((model: any, modelIndex: number) => (
                                            <div key={modelIndex} className="text-sm font-mono">
                                              {model.name} {getMatchTypePrefix(model.type)} {model.value}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </Panel>
                          </Collapse>
                        </div>
                      </div>
                    </div>
                      )
                    })()
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

        {/* 右侧内容 - Model调试 */}
        <Col span={9}>
          <Card className="mb-6 rounded-lg border-gray-200">
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-3">Model调试</h3>
              <Tabs
              defaultActiveKey="chat"
              items={[
                {
                  key: "chat",
                  label: "Chat",
                  children: (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BulbOutlined className="text-4xl text-gray-300" />
                      <p className="text-gray-500 mt-4 mb-2">Chat</p>
                      <p className="text-sm text-gray-400">🚀 敬请期待</p>
                    </div>
                  ),
                },
                {
                  key: "curl",
                  label: "cURL",
                  children: modelConfig?.aigwModelAPIConfig ? (
                    <div className="space-y-4">
                      {generateCurlExample() ? (
                        <div className="relative">
                          <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap border">
                            <code>{generateCurlExample()}</code>
                          </pre>
                          <Button
                            size="small"
                            type="text"
                            icon={<CopyOutlined />}
                            className="absolute top-2 right-2"
                            onClick={async () => {
                              const curlCommand = generateCurlExample();
                              if (curlCommand) {
                                try {
                                  await navigator.clipboard.writeText(curlCommand);
                                  message.success('Curl命令已复制到剪贴板');
                                } catch (error) {
                                  message.error('复制失败');
                                }
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center py-4">
                          当前配置中没有找到 /v1/chat/completions 路由
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        将 <code className="bg-gray-100 px-1 rounded">{"{{model_name}}"}</code> 替换为实际的模型名称
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      暂无Model API配置信息
                    </div>
                  ),
                },
              ]}
            />
            </div>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
}

export default ModelDetail;