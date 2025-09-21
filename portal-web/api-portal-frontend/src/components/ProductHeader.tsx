import React, { useState } from "react";
import { Typography, Button, Modal, Form, Select, Input, message } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { getConsumers, subscribeProduct } from "../lib/api";
import type { Consumer } from "../types/consumer";
import type { McpConfig, ProductIcon } from "../types";

const { Title, Paragraph } = Typography;

interface ProductHeaderProps {
  name: string;
  description: string;
  icon?: ProductIcon | null;
  defaultIcon?: string;
  mcpConfig?: McpConfig | null;
  updatedAt?: string;
  productType?: 'REST_API' | 'MCP_SERVER';
}

// 处理产品图标的函数
const getIconUrl = (icon?: ProductIcon | null, defaultIcon?: string): string => {
  const fallback = defaultIcon || "/logo.svg";
  
  if (!icon) {
    return fallback;
  }
  
  switch (icon.type) {
    case "URL":
      return icon.value || fallback;
    case "BASE64":
      // 如果value已经包含data URL前缀，直接使用；否则添加前缀
      return icon.value ? (icon.value.startsWith('data:') ? icon.value : `data:image/png;base64,${icon.value}`) : fallback;
    default:
      return fallback;
  }
};

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  name,
  description,
  icon,
  defaultIcon = "/default-icon.png",
  mcpConfig,
  updatedAt,
  productType,
}) => {
  const { id, mcpName } = useParams();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [form] = Form.useForm();

  // 判断是否应该显示申请订阅按钮
  const shouldShowSubscribeButton = !mcpConfig || mcpConfig.meta.source !== 'NACOS';

  // 获取消费者列表
  const fetchConsumers = async () => {
    try {
      setLoading(true);
      const response = await getConsumers({}, { page: 1, size: 100 });
      if (response.data) {
        setConsumers(response.data.content || response.data);
      }
    } catch (error) {
      // message.error('获取消费者列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 显示弹窗
  const showModal = () => {
    setIsModalVisible(true);
    fetchConsumers();
  };

  // 隐藏弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // 提交申请
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 调用申请订阅API
      await subscribeProduct(values.consumerId, id || mcpName || '');
      message.success('申请提交成功', 1);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('申请订阅失败:', error);
      // message.error('申请提交失败，请重试');
    }
  };

  return (
    <>
      <div className="mb-2">
        {/* 第一行：图标和标题信息 */}
        <div className="flex items-center gap-4 mb-3">
          {(!icon || imageLoadFailed) && productType === 'REST_API' ? (
            <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center">
              <ApiOutlined className="text-3xl text-black" />
            </div>
          ) : (
            <img
              src={getIconUrl(icon, defaultIcon)}
              alt="icon"
              className="w-16 h-16 rounded-lg object-cover border flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (productType === 'REST_API') {
                  setImageLoadFailed(true);
                } else {
                  // 确保有一个最终的fallback图片，避免无限循环请求
                  const fallbackIcon = defaultIcon || "/logo.svg";
                  const currentUrl = new URL(target.src, window.location.href).href;
                  const fallbackUrl = new URL(fallbackIcon, window.location.href).href;
                  if (currentUrl !== fallbackUrl) {
                    target.src = fallbackIcon;
                  }
                }
              }}
            />
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <Title level={3} className="mb-1 text-xl font-semibold">
              {name}
            </Title>
            {updatedAt && (
              <div className="text-sm text-gray-400">
                {new Date(updatedAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }).replace(/\//g, '.')} updated
              </div>
            )}
          </div>
        </div>
        
        {/* 第二行：描述信息，与左边框对齐 */}
        <Paragraph className="text-gray-600 mb-3 text-sm leading-relaxed">
          {description}
        </Paragraph>
        
        {/* 第三行：申请订阅按钮，与左边框对齐 */}
        {shouldShowSubscribeButton && (
          <Button type="primary" onClick={showModal}>
            申请订阅
          </Button>
        )}
      </div>

      {/* 申请订阅弹窗 */}
      <Modal
        title="申请订阅"
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item label="产品名称">
            <Input value={name} disabled />
          </Form.Item>
          
          <Form.Item label="产品ID">
            <Input value={id || mcpName} disabled />
          </Form.Item>

          <Form.Item
            label="消费者"
            name="consumerId"
            rules={[{ required: true, message: '请选择消费者' }]}
          >
            <Select
              placeholder="搜索或选择消费者"
              showSearch
              loading={loading}
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={loading ? '加载中...' : '暂无消费者数据'}
            >
              {consumers.map(consumer => (
                <Select.Option key={consumer.consumerId} value={consumer.consumerId}>
                  {consumer.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* <Form.Item
            label="申请理由"
            name="reason"
            rules={[{ required: true, message: '请输入申请理由' }]}
          >
            <TextArea
              rows={4}
              placeholder="请描述申请订阅的原因和用途"
              maxLength={500}
              showCount
            />
          </Form.Item> */}
        </Form>
      </Modal>
    </>
  );
}; 