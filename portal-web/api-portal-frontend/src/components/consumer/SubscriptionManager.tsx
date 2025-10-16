import { useState } from "react";
import {
  Card,
  Button,
  message,
  Input,
  Modal,
  Table,
  Badge,
  Popconfirm,
  Select,
} from "antd";
import {
  PlusOutlined,
} from "@ant-design/icons";
import api from "../../lib/api";
import type { Subscription } from "../../types/consumer";
import type { ApiResponse, Product } from "../../types";
import { getSubscriptionStatusText, getSubscriptionStatusColor } from "../../lib/statusUtils";
import { formatDateTime } from "../../lib/utils";

interface SubscriptionManagerProps {
  consumerId: string;
  subscriptions: Subscription[];
  onSubscriptionsChange: (searchParams?: { productName: string; status: string }) => void;
  loading?: boolean;
}

export function SubscriptionManager({ consumerId, subscriptions, onSubscriptionsChange, loading = false }: SubscriptionManagerProps) {
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [subscriptionSearch, setSubscriptionSearch] = useState({ productName: '', status: '' as 'PENDING' | 'APPROVED' | '' });

  // 过滤产品：移除已订阅的产品
  const filterProducts = (allProducts: Product[]) => {
    // 获取已订阅的产品ID列表
    const subscribedProductIds = subscriptions.map(sub => sub.productId);
    
    // 过滤掉已订阅的产品
    return allProducts.filter(product => 
      !subscribedProductIds.includes(product.productId)
    );
  };

  const openProductModal = async () => {
    setProductModalVisible(true);
    setProductLoading(true);
    try {
      const response: ApiResponse<{ content: Product[] }> = await api.get("/products?page=0&size=100");
      if (response?.code === "SUCCESS" && response?.data) {
        const allProducts = response.data.content || [];
        // 初始化时过滤掉已订阅的产品
        const filtered = filterProducts(allProducts);
        setFilteredProducts(filtered);
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
      // message.error('获取产品列表失败');
    } finally {
      setProductLoading(false);
    }
  };


  const handleSubscribeProducts = async () => {
    if (!selectedProduct) {
      message.warning('请选择要订阅的产品');
      return;
    }

    setSubscribeLoading(true);
    try {
      await api.post(`/consumers/${consumerId}/subscriptions`, { productId: selectedProduct });
      message.success('订阅成功');
      setProductModalVisible(false);
      setSelectedProduct('');
      onSubscriptionsChange();
    } catch (error) {
      console.error('订阅失败:', error);
      // message.error('订阅失败');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleUnsubscribe = async (productId: string) => {
    try {
      await api.delete(`/consumers/${consumerId}/subscriptions/${productId}`);
      message.success('取消订阅成功');
      onSubscriptionsChange();
    } catch (error) {
      console.error('取消订阅失败:', error);
      // message.error('取消订阅失败');
    }
  };



  const subscriptionColumns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      render: (productName: Product['productName']) => productName || '-',
    },
    {
      title: '产品类型',
      dataIndex: 'productType',
      key: 'productType',
      render: (productType: Product['productType']) => {
        const typeMap = {
          'REST_API': 'REST API',
          'HTTP_API': 'HTTP API',
          'MCP_SERVER': 'MCP Server'
        };
        return typeMap[productType as keyof typeof typeMap] || productType || '-';
      }
    },
    {
      title: '订阅状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={getSubscriptionStatusColor(status) as 'success' | 'processing' | 'error' | 'default' | 'warning'} text={getSubscriptionStatusText(status)} />
      ),
    },
    {
      title: '订阅时间',
      dataIndex: 'createAt',
      key: 'createAt',
      render: (date: string) => date ? formatDateTime(date) : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Subscription) => (
        <Popconfirm
          title="确定要取消订阅吗？"
          onConfirm={() => handleUnsubscribe(record.productId)}
        >
          <Button type="link" danger size="small">
            取消订阅
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 确保 subscriptions 始终是数组
  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];

  return (
    <>
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openProductModal}
            >
              订阅
            </Button>
            <Input.Search
              placeholder="请输入API名称进行搜索"
              style={{ width: 300 }}
              onSearch={(value) => {
                const newSearch = { ...subscriptionSearch, productName: value };
                setSubscriptionSearch(newSearch);
                onSubscriptionsChange(newSearch);
              }}
            />
            <Select
              placeholder="订阅状态"
              style={{ width: 120 }}
              allowClear
              value={subscriptionSearch.status || undefined}
              onChange={(value) => {
                const newSearch = { ...subscriptionSearch, status: value as 'PENDING' | 'APPROVED' | '' };
                setSubscriptionSearch(newSearch);
                onSubscriptionsChange(newSearch);
              }}
            >
              <Select.Option value="PENDING">待审批</Select.Option>
              <Select.Option value="APPROVED">已通过</Select.Option>
            </Select>
          </div>
        </div>
        <Table
          columns={subscriptionColumns}
          dataSource={safeSubscriptions}
          rowKey={(record) => record.productId}
          pagination={false}
          size="small"
          loading={loading}
          locale={{ emptyText: '暂无订阅记录，请点击上方按钮进行订阅' }}
        />
      </Card>

      {/* 产品选择弹窗 */}
      <Modal
        title="订阅产品"
        open={productModalVisible}
        onCancel={() => {
          if (!subscribeLoading) {
            setProductModalVisible(false);
            setSelectedProduct('');
          }
        }}
        footer={
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                if (!subscribeLoading) {
                  setProductModalVisible(false);
                  setSelectedProduct('');
                }
              }}
              disabled={subscribeLoading}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSubscribeProducts}
              disabled={!selectedProduct}
              loading={subscribeLoading}
            >
              确定订阅
            </Button>
          </div>
        }
        width={500}
        styles={{
          content: {
            borderRadius: '8px',
            padding: 0
          },
          header: {
            borderRadius: '8px 8px 0 0',
            marginBottom: 0,
            paddingBottom: '8px'
          },
          body: {
            padding: '24px'
          }
        }}
      >
        <div>
          <div className="text-sm text-gray-700 mb-3 font-medium">选择要订阅的产品：</div>
          <Select
            placeholder="请输入产品名称进行搜索或直接选择"
            style={{ width: '100%' }}
            value={selectedProduct}
            onChange={setSelectedProduct}
            loading={productLoading}
            showSearch={true}
            filterOption={(input, option) => {
              const product = filteredProducts.find(p => p.productId === option?.value);
              if (!product) return false;
              
              const searchText = input.toLowerCase();
              return (
                product.name?.toLowerCase().includes(searchText) ||
                product.description?.toLowerCase().includes(searchText)
              );
            }}
            notFoundContent={productLoading ? '加载中...' : '暂无可订阅的产品'}
          >
            {filteredProducts.map(product => (
              <Select.Option key={product.productId} value={product.productId}>
                {product.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>
    </>
  );
} 