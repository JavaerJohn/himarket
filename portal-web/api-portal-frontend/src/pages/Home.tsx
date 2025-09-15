import { Button, Card, Typography } from "antd";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useEffect } from "react";
import { getTokenFromCookie } from "../lib/utils";

const { Title, Paragraph } = Typography;

function HomePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromCookie = params.get("fromCookie");
    const token = getTokenFromCookie();
    if (fromCookie && token) {
      localStorage.setItem("access_token", token);
    }
  }, []);

  return (
    <Layout>
      <div className="text-center">
        <Title level={1} className="text-6xl font-bold text-gray-900 mb-6">
          HiMarket AI 开放平台
        </Title>
        <Paragraph className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          低成本接入企业级AI能力，助力业务快速创新
        </Paragraph>
        <Link to="/apis">
          <Button 
            type="primary" 
            size="large" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
          >
            Get started
          </Button>
        </Link>
      </div>
      
      <div className="mt-16">
        <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 border-0">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 opacity-90"></div>
            <div className="absolute inset-0 grid grid-cols-8 gap-4">
              {Array.from({ length: 32 }, (_, i) => (
                <div key={i} className="bg-white/10 rounded-full aspect-square opacity-30"></div>
              ))}
            </div>
            <div className="relative z-10 h-64 flex items-center justify-center">
              <div className="text-white text-center">
                <Title level={2} className="text-3xl font-bold mb-4 text-white">
                  探索 AI API 服务
                </Title>
                <Paragraph className="text-purple-100 text-lg">
                  丰富多样的 AI 能力，助您打造智能应用
                </Paragraph>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default HomePage; 