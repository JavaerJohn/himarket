import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Divider, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import api, { getOidcProviders, type IdpResult } from "../lib/api";
import aliyunIcon from "../assets/aliyun.png";
import githubIcon from "../assets/github.png";
import googleIcon from "../assets/google.png";
import { AxiosError } from "axios";


const oidcIcons: Record<string, React.ReactNode> = {
  google: <img src={googleIcon} alt="Google" className="w-5 h-5 mr-2" />,
  github: <img src={githubIcon} alt="GitHub" className="w-6 h-6 mr-2" />,
  aliyun: <img src={aliyunIcon} alt="Aliyun" className="w-6 h-6 mr-2" />,
};

const Login: React.FC = () => {
  const [providers, setProviders] = useState<IdpResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 使用OidcController的接口获取OIDC提供商
    getOidcProviders()
      .then((response: any) => {
        console.log('OIDC providers response:', response);
        
        // 处理不同的响应格式
        let providersData: IdpResult[];
        if (Array.isArray(response)) {
          providersData = response;
        } else if (response && Array.isArray(response.data)) {
          providersData = response.data;
        } else if (response && response.data) {
          console.warn('Unexpected response format:', response);
          providersData = [];
        } else {
          providersData = [];
        }
        
        console.log('Processed providers data:', providersData);
        setProviders(providersData);
      })
      .catch((error) => {
        console.error('Failed to fetch OIDC providers:', error);
        setProviders([]);
      });
  }, []);

  // 账号密码登录
  const handlePasswordLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.post("/developers/login", {
        username: values.username,
        password: values.password,
      });
      // 登录成功后跳转到首页并携带access_token
      if (res && res.data && res.data.access_token) {
        message.success('登录成功！');
        localStorage.setItem('access_token', res.data.access_token)
        navigate('/')
      } else {
        message.error("登录失败，未获取到access_token");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || "登录失败，请检查账号密码是否正确");
      } else {
        message.error("登录失败");
      }
    } finally {
      setLoading(false);
    }
  };

  // 跳转到 OIDC 授权 - 对接OidcController
  const handleOidcLogin = (provider: string) => {
    // 获取API前缀配置
    const apiPrefix = api.defaults.baseURL || '/api/v1';
    
    // 构建授权URL - 对接 /developers/oidc/authorize
    const authUrl = new URL(`${window.location.origin}${apiPrefix}/developers/oidc/authorize`);
    authUrl.searchParams.set('provider', provider);
    
    console.log('Redirecting to OIDC authorization:', authUrl.toString());
    
    // 跳转到OIDC授权服务器
    window.location.href = authUrl.toString();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">登录HiMarket-前台</h2>
        </div>

        {/* 账号密码登录表单 */}
        <Form
          name="login"
          onFinish={handlePasswordLogin}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入账号' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="账号"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
              size="large"
            >
              {loading ? "登录中..." : "登录"}
            </Button>
          </Form.Item>
        </Form>

        {/* 分隔线 */}
        <Divider plain>或</Divider>

        {/* OIDC 登录按钮 */}
        <div className="flex flex-col gap-3">
          {!Array.isArray(providers) || providers.length === 0 ? (
            <div className="text-gray-400 text-center">暂无可用第三方登录</div>
          ) : (
            providers.map((provider) => (
              <Button
                key={provider.provider}
                onClick={() => handleOidcLogin(provider.provider)}
                className="w-full flex items-center justify-center"
                size="large"
                icon={oidcIcons[provider.provider.toLowerCase()] || <span>🆔</span>}
              >
                使用{provider.name || provider.provider}登录
              </Button>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-gray-500">
          没有账号？
          <Link to="/register" className="text-blue-500 hover:underline ml-1">
            注册
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
