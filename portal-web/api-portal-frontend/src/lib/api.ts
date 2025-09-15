import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd';

const api: AxiosInstance = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})


// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('access_token');
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    switch (status) {
      case 401:
        message.error('未登录或登录已过期，请重新登录');
        // 清除token信息
        localStorage.removeItem('access_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;
      case 403:
        message.error('无权限访问该资源，请重新登录');
        // 清除token信息
        localStorage.removeItem('access_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;
      case 404:
        message.error('请求的资源不存在');
        break;
      case 500:
        message.error('服务器异常，请稍后再试');
        break;
      default:
        message.error(error.response?.data?.message || '请求发生错误');
    }
    return Promise.reject(error);
  }
)

// Consumer相关API
export interface QueryConsumerParam {
  name?: string;
  email?: string;
  status?: string;
  company?: string;
}

export interface Pageable {
  page: number;
  size: number;
}

export function getConsumers(param: QueryConsumerParam, pageable: Pageable) {
  return api.get('/consumers', {
    params: {
      ...param,
      page: pageable.page,
      size: pageable.size,
    },
  });
}

export function deleteConsumer(consumerId: string) {
  return api.delete(`/consumers/${consumerId}`);
}

export function createConsumer(data: any) {
  return api.post('/consumers', data);
}

// 申请订阅API产品
export function subscribeProduct(consumerId: string, productId: string) {
  return api.post(`/consumers/${consumerId}/subscriptions`, {
    productId: productId
  });
}


// OIDC相关接口定义 - 对接OidcController
export interface IdpResult {
  provider: string;
  name: string;
}

export interface AuthResult {
  data: {
    access_token: string;
  }
}

// 获取OIDC提供商列表 - 对接 /developers/oidc/providers
export function getOidcProviders(): Promise<IdpResult[]> {
  return api.get('/developers/oidc/providers');
}

// OIDC回调处理 - 对接 /developers/oidc/callback
export function handleOidcCallback(code: string, state: string): Promise<AuthResult> {
  return api.get('/developers/oidc/callback', {
    params: { code, state }
  });
}

export default api 