import { useEffect, useState, useCallback } from "react";
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
} from "antd";
import ReactMarkdown from "react-markdown";
import { ProductType } from "../types";
import type {
  Product,
  McpConfig,
  McpServerProduct,
  ApiResponse,
} from "../types";
import * as yaml from "js-yaml";
import remarkGfm from 'remark-gfm';
import 'react-markdown-editor-lite/lib/index.css'

function McpDetail() {
  const { mcpName } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Product | null>(null);
  const [mcpConfig, setMcpConfig] = useState<McpConfig | null>(null);
  const [parsedTools, setParsedTools] = useState<
    Array<{
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
    }>
  >([]);
  const [httpJson, setHttpJson] = useState("");
  const [sseJson, setSseJson] = useState("");
  const [localJson, setLocalJson] = useState("");

  // 解析YAML配置的函数
  const parseYamlConfig = (
    yamlString: string
  ): {
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
      console.warn("解析YAML配置失败:", error);
      return null;
    }
  };

  // 生成连接配置的函数
  const generateConnectionConfig = useCallback((
    domains: Array<{ domain: string; protocol: string }> | null | undefined,
    path: string | null | undefined,
    serverName: string,
    localConfig?: unknown
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
      const domain = domains[0];
      const baseUrl = `${domain.protocol}://${domain.domain}`;
      let endpoint = `${baseUrl}${path}`;

      if (mcpConfig?.meta?.source === 'ADP_AI_GATEWAY') {
        endpoint = `${baseUrl}/mcp-servers${path}`;
      }

      const httpConfig = `{
  "mcpServers": {
    "${serverName}": {
      "url": "${endpoint}"
    }
  }
}`;

      const sseConfig = `{
  "mcpServers": {
    "${serverName}": {
      "type": "sse",
      "url": "${endpoint}/sse"
    }
  }
}`;

      setHttpJson(httpConfig);
      setSseJson(sseConfig);
      setLocalJson("");
      return;
    }

    // 无有效配置
    setHttpJson("");
    setSseJson("");
    setLocalJson("");
  }, [mcpConfig]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!mcpName) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response: ApiResponse<Product> = await api.get(`/products/${mcpName}`);
        if (response.code === "SUCCESS" && response.data) {
          setData(response.data);

          // 处理MCP配置（统一使用新结构 mcpConfig）
          if (response.data.type === ProductType.MCP_SERVER) {
            const mcpProduct = response.data as McpServerProduct;

            if (mcpProduct.mcpConfig) {
              setMcpConfig(mcpProduct.mcpConfig);

              // 解析tools配置
              if (mcpProduct.mcpConfig.tools) {
                const parsedConfig = parseYamlConfig(
                  mcpProduct.mcpConfig.tools
                );
                if (parsedConfig && parsedConfig.tools) {
                  setParsedTools(parsedConfig.tools);
                }
              }
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
  }, [mcpName]);

  // 监听 mcpConfig 变化，重新生成连接配置
  useEffect(() => {
    if (mcpConfig) {
      generateConnectionConfig(
        mcpConfig.mcpServerConfig.domains,
        mcpConfig.mcpServerConfig.path,
        mcpConfig.mcpServerName,
        mcpConfig.mcpServerConfig.rawConfig
      );
    }
  }, [mcpConfig]);

  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // 非安全上下文降级处理
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败，请手动复制");
    }
  };


  if (error) {
    return (
      <Layout loading={loading}>
        <Alert message={error} type="error" showIcon className="my-8" />
      </Layout>
    );
  }
  if (!data) {
    return (
      <Layout loading={loading}>
        <Alert
          message="未找到相关数据"
          type="warning"
          showIcon
          className="my-8"
        />
      </Layout>
    );
  }

  const { name, description, status, category, enableConsumerAuth } = data;
  const hasLocalConfig = Boolean(mcpConfig?.mcpServerConfig.rawConfig);



  return (
    <Layout loading={loading}>
      <ProductHeader
        name={name}
        description={description}
        status={status}
        category={category}
        icon={data.icon || "/MCP.png"}
        defaultIcon="/MCP.png"
        enableConsumerAuth={enableConsumerAuth || undefined}
        showConsumerAuth={true}
        mcpConfig={mcpConfig}
      />

      {/* 主要内容区域 - 左右布局 */}
      <Row gutter={24}>
        {/* 左侧内容 */}
        <Col span={15}>
          <Card className="mb-6">
            <Tabs
              defaultActiveKey="overview"
              items={[
                {
                  key: "overview",
                  label: "Overview",
                  children: data.document ? (
                    <div className="prose custom-html-style">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.document}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No overview available
                    </div>
                  ),
                },
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
                                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {(!tool.args || tool.args.length === 0) && (
                                    <div className="text-gray-500 text-sm">No parameters required</div>
                                  )}
                                </div>
                              ),
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

        {/* 右侧连接指导 */}
        <Col span={9}>
          {mcpConfig && (
            <Card className="mb-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3">连接点配置</h3>
                <Tabs
                  size="small" 
                  defaultActiveKey={hasLocalConfig ? "local" : (httpJson ? "http" : "sse")}
                  items={
                    hasLocalConfig
                      ? [
                          {
                            key: "local",
                            label: "Local Config",
                            children: (
                              <div className="relative bg-gray-50 border border-gray-200 rounded-md p-3">
                                <Button
                                  size="small"
                                  className="absolute top-2 right-2 z-10"
                                  onClick={() => handleCopy(localJson)}
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                                  </svg>
                                </Button>
                                <div className="text-gray-800 font-mono text-xs overflow-x-auto">
                                  <pre className="whitespace-pre-wrap">{localJson}</pre>
                                </div>
                              </div>
                            ),
                          },
                        ]
                      : [
                          {
                            key: "sse",
                            label: "SSE",
                            children: (
                              <div className="relative bg-gray-50 border border-gray-200 rounded-md p-3">
                                <Button
                                  size="small"
                                  className="absolute top-2 right-2 z-10"
                                  onClick={() => handleCopy(sseJson)}
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                                  </svg>
                                </Button>
                                <div className="text-gray-800 font-mono text-xs overflow-x-auto">
                                  <pre className="whitespace-pre-wrap">{sseJson}</pre>
                                </div>
                              </div>
                            ),
                          },
                          {
                            key: "http",
                            label: "Streaming HTTP",
                            children: (
                              <div className="relative bg-gray-50 border border-gray-200 rounded-md p-3">
                                <Button
                                  size="small"
                                  className="absolute top-2 right-2 z-10"
                                  onClick={() => handleCopy(httpJson)}
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                                  </svg>
                                </Button>
                                <div className="text-gray-800 font-mono text-xs overflow-x-auto">
                                  <pre className="whitespace-pre-wrap">{httpJson}</pre>
                                </div>
                              </div>
                            ),
                          },
                        ]
                  }
                />
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </Layout>
  );
}

export default McpDetail;
