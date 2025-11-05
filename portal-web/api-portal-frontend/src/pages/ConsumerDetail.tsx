import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Alert, Tabs } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import api from "../lib/api";
import { ConsumerBasicInfo, AuthConfig, SubscriptionManager } from "../components/consumer";
import type { Consumer, Subscription } from "../types/consumer";
import type { ApiResponse } from "../types";

function ConsumerDetailPage() {
  const { consumerId } = useParams();
  const navigate = useNavigate();
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [consumer, setConsumer] = useState<Consumer>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (!consumerId) return;
    
    const fetchConsumerDetail = async () => {
      try {
        const response: ApiResponse<Consumer> = await api.get(`/consumers/${consumerId}`);
        if (response?.code === "SUCCESS" && response?.data) {
          setConsumer(response.data);
        }
      } catch (error) {
        console.error('获取消费者详情失败:', error);
        setError('加载失败，请稍后重试');
      }
    };

    const fetchSubscriptions = async () => {
      setSubscriptionsLoading(true);
      try {
        const response: ApiResponse<{content: Subscription[], totalElements: number}> = await api.get(`/consumers/${consumerId}/subscriptions`);
        if (response?.code === "SUCCESS" && response?.data) {
          // 从分页数据中提取实际的订阅数组
          const subscriptionsData = response.data.content || [];
          setSubscriptions(subscriptionsData);
        }
      } catch (error) {
        console.error('获取订阅列表失败:', error);
      } finally {
        setSubscriptionsLoading(false);
      }
    };
    
    const loadData = async () => {
      try {
        await Promise.all([
          fetchConsumerDetail(),
          fetchSubscriptions()
        ]);
      } finally {
        // 不设置loading状态，避免闪烁
      }
    };
    
    loadData();
  }, [consumerId]);

  if (error) {
    return (
      <Layout>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          className="my-8" />
      </Layout>
    );
  }

  return (
    <Layout>
      {consumer ? (
        <>
          {/* 消费者头部 - 返回按钮 + 消费者名称 */}
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <ArrowLeftOutlined 
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                style={{ fontSize: '20px', fontWeight: 'normal' }}
                onClick={() => navigate('/consumers')}
              />
              <span className="text-2xl font-normal text-gray-500">
                {consumer.name}
              </span>
            </div>
          </div>
          
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane tab="基本信息" key="basic">
              <ConsumerBasicInfo consumer={consumer} />
              <div className="mt-6">
                <AuthConfig consumerId={consumerId!} />
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab="订阅列表" key="authorization">
              <SubscriptionManager 
                consumerId={consumerId!}
                subscriptions={subscriptions}
                onSubscriptionsChange={async (searchParams) => {
                  // 重新获取订阅列表
                  if (consumerId) {
                    setSubscriptionsLoading(true);
                    try {
                      // 构建查询参数
                      const params = new URLSearchParams();
                      if (searchParams?.productName) {
                        params.append('productName', searchParams.productName);
                      }
                      if (searchParams?.status) {
                        params.append('status', searchParams.status);
                      }
                      
                      const queryString = params.toString();
                      const url = `/consumers/${consumerId}/subscriptions${queryString ? `?${queryString}` : ''}`;
                      
                      const response: ApiResponse<{content: Subscription[], totalElements: number}> = await api.get(url);
                      if (response?.code === "SUCCESS" && response?.data) {
                        // 从分页数据中提取实际的订阅数组
                        const subscriptionsData = response.data.content || [];
                        setSubscriptions(subscriptionsData);
                      }
                    } catch (error) {
                      console.error('获取订阅列表失败:', error);
                    } finally {
                      setSubscriptionsLoading(false);
                    }
                  }
                }}
                loading={subscriptionsLoading}
              />
            </Tabs.TabPane>
          </Tabs>
        </>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      )}
    </Layout>
  );
}

export default ConsumerDetailPage;
