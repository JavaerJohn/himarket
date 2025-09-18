import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Alert, Tabs } from "antd";
import api from "../lib/api";
import { ConsumerBasicInfo, CredentialManager, SubscriptionManager } from "../components/consumer";
import type { Consumer, Subscription } from "../types/consumer";
import type { ApiResponse } from "../types";

function ConsumerDetailPage() {
  const { consumerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [consumer, setConsumer] = useState<Consumer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  const fetchConsumerDetail = useCallback(async () => {
    if (!consumerId) return;
    try {
      const response: ApiResponse<Consumer> = await api.get(`/consumers/${consumerId}`);
      if (response?.code === "SUCCESS" && response?.data) {
        setConsumer(response.data);
      }
    } catch (error) {
      console.error('获取消费者详情失败:', error);
      setError('加载失败，请稍后重试');
    }
  }, [consumerId]);

  const fetchSubscriptions = useCallback(async (searchParams?: { productName: string; status: string }) => {
    if (!consumerId) return;
    setSubscriptionsLoading(true);
    try {
      const params = {
        page: 1,
        size: 100,
        ...searchParams
      };
      const response: ApiResponse<{ content: Subscription[] }> = await api.get(`/consumers/${consumerId}/subscriptions`, { params });
      if (response?.code === "SUCCESS" && response.data) {
        // 确保从正确的数据结构中提取订阅列表
        const subscriptionsData = response.data.content
        setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('获取订阅列表失败:', error);
      setSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [consumerId]);

  useEffect(() => {
    if (!consumerId) return;
    setLoading(true);
    Promise.all([
      fetchConsumerDetail(),
      fetchSubscriptions()
    ]).finally(() => {
      setLoading(false);
    });
  }, [consumerId, fetchConsumerDetail, fetchSubscriptions]);



  if (error) {
    return (
      <Layout loading={loading}>
        <Alert message={error} type="error" showIcon className="my-8" />
      </Layout>
    );
  }

  if (!consumer) {
    return (
      <Layout loading={loading}>
        <Alert message="未找到消费者信息" type="warning" showIcon className="my-8" />
      </Layout>
    );
  }

      return (
      <Layout loading={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="基本信息" key="basic">
          <ConsumerBasicInfo consumer={consumer} />
          <div className="mt-6">
            <CredentialManager 
              consumerId={consumerId!}
            />
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="订阅列表" key="authorization">
          <SubscriptionManager 
            consumerId={consumerId!}
            subscriptions={subscriptions}
            onSubscriptionsChange={fetchSubscriptions}
            loading={subscriptionsLoading}
          />
        </Tabs.TabPane>
      </Tabs>
    </Layout>
  );
}

export default ConsumerDetailPage; 