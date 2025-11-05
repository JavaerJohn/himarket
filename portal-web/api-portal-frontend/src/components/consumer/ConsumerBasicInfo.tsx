import { Card, Descriptions } from "antd";
import type { Consumer } from "../../types/consumer";

interface ConsumerBasicInfoProps {
  consumer: Consumer;
}

export function ConsumerBasicInfo({ consumer }: ConsumerBasicInfoProps) {
  return (
    <Card title="基本信息" style={{ borderRadius: '12px' }}>
      <Descriptions column={2} size="middle">
        <Descriptions.Item label="名称">{consumer.name}</Descriptions.Item>
        <Descriptions.Item label="描述">{consumer.description || '-'}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
