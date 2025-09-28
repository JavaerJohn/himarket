import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as yaml from 'js-yaml'
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 


// Token 相关函数
export const getToken = (): string | null => {
  return localStorage.getItem('access_token')
}

export const removeToken = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('userInfo')
}

export const isAuthenticated = (): boolean => {
  return !!getToken()
}

export const getStatusBadgeVariant = (status: string) => {
  return status === "PENDING" ? "orange" : status === "READY" ? "blue" : "green"
}

export const getServiceName = (linkedServiceParam: any) => {  
  
  if (linkedServiceParam?.sourceType === 'NACOS') {
    return linkedServiceParam.nacosRefConfig?.mcpServerName||'Nacos MCP服务'
  }    
  if (linkedServiceParam?.apigRefConfig) {
    if ('apiName' in linkedServiceParam.apigRefConfig && linkedServiceParam.apigRefConfig.apiName) {
      return linkedServiceParam.apigRefConfig.apiName
    }
    if ('mcpServerName' in linkedServiceParam.apigRefConfig && linkedServiceParam.apigRefConfig.mcpServerName) {
      return linkedServiceParam.apigRefConfig.mcpServerName
    }
  }
  if (linkedServiceParam?.higressRefConfig) {
    return linkedServiceParam.higressRefConfig.mcpServerName
  }
  if (linkedServiceParam?.adpAIGatewayRefConfig) {
    return linkedServiceParam.adpAIGatewayRefConfig.mcpServerName
  }
  return '未知服务'
}

/**
 * 格式化日期时间，显示完整的时间点包括小时、分钟、秒
 * @param dateString 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return String(dateString);
    }
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return String(dateString);
  }
};

/**
 * 格式化日期，只显示年月日
 * @param dateString 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
export const formatDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return String(dateString);
    }
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return String(dateString);
  }
};

// 类型映射
export const ProductTypeMap: Record<string, string> = {
  REST_API: 'REST API',
  MCP_SERVER: 'MCP Server',
};

// OpenAPI 规范解析相关类型和函数
export interface OpenAPIEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    description?: string;
    required?: boolean;
    schema?: any;
  }>;
  requestBody?: {
    description?: string;
    content?: any;
    required?: boolean;
  };
  responses?: Record<string, {
    description: string;
    content?: any;
  }>;
  tags?: string[];
}

export interface ParsedOpenAPI {
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  endpoints: OpenAPIEndpoint[];
}

/**
 * 解析OpenAPI规范
 * @param spec OpenAPI规范字符串（YAML或JSON格式）
 * @returns 解析后的OpenAPI对象
 */
export const parseOpenAPISpec = (spec: string): ParsedOpenAPI | null => {
  try {
    let openApiDoc: any;
    
    // 尝试解析YAML格式
    try {
      openApiDoc = yaml.load(spec);
    } catch {
      // 如果YAML解析失败，尝试JSON格式
      openApiDoc = JSON.parse(spec);
    }

    if (!openApiDoc || !openApiDoc.paths) {
      return null;
    }

    const endpoints: OpenAPIEndpoint[] = [];

    // 解析路径和方法
    Object.entries(openApiDoc.paths).forEach(([path, pathItem]: [string, any]) => {
      if (pathItem && typeof pathItem === 'object') {
        // HTTP方法
        const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
        
        methods.forEach(method => {
          const operation = pathItem[method];
          if (operation) {
            endpoints.push({
              path,
              method: method.toUpperCase(),
              operationId: operation.operationId,
              summary: operation.summary,
              description: operation.description,
              parameters: operation.parameters,
              requestBody: operation.requestBody,
              responses: operation.responses,
              tags: operation.tags,
            });
          }
        });
      }
    });

    return {
      info: openApiDoc.info,
      servers: openApiDoc.servers,
      endpoints,
    };
  } catch (error) {
    console.error('OpenAPI规范解析失败:', error);
    return null;
  }
};

/**
 * 获取HTTP方法的颜色标签
 * @param method HTTP方法
 * @returns 对应的颜色类名
 */
export const getMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    GET: 'green',
    POST: 'blue',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
    HEAD: 'gray',
    OPTIONS: 'gray',
    TRACE: 'gray',
  };
  return colors[method.toUpperCase()] || 'gray';
};

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    // 优先尝试现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (error) {
    // 现代API失败，继续降级处理
    console.warn('Modern clipboard API failed, falling back to execCommand');
  }

  try {
    // 降级到传统方法
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch (error) {
    console.error('All copy methods failed:', error);
    throw error;
  }
};
