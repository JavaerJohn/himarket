import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, Button, message } from 'antd'
import { 
  ApiOutlined, 
  GlobalOutlined,
  TeamOutlined,
  EditOutlined,
  CheckCircleFilled,
  MinusCircleFilled,
  CopyOutlined,
  ExclamationCircleFilled,
  ClockCircleFilled
} from '@ant-design/icons'
import type { ApiProduct } from '@/types/api-product'
import { getServiceName, formatDateTime, copyToClipboard } from '@/lib/utils'
import { apiProductApi } from '@/lib/api'


interface ApiProductOverviewProps {
  apiProduct: ApiProduct
  linkedService: any | null
  onEdit: () => void
}

export function ApiProductOverview({ apiProduct, linkedService, onEdit }: ApiProductOverviewProps) {

  const [portalCount, setPortalCount] = useState(0)
  const [subscriberCount] = useState(0)

  const navigate = useNavigate()

  useEffect(() => {
    if (apiProduct.productId) {
      fetchPublishedPortals()
    }
  }, [apiProduct.productId])

  const fetchPublishedPortals = async () => {
    try {
      const res = await apiProductApi.getApiProductPublications(apiProduct.productId)
      setPortalCount(res.data.content?.length || 0)
    } catch (error) {
    } finally {
    }
  }


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">概览</h1>
        <p className="text-gray-600">API产品概览</p>
      </div>

      {/* 基本信息 */}
      <Card 
        title="基本信息"
        extra={
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={onEdit}
          >
            编辑
          </Button>
        }
      >
        <div>
            <div className="grid grid-cols-6 gap-8 items-center pt-0 pb-2">
             <span className="text-xs text-gray-600">产品名称:</span>
             <span className="col-span-2 text-xs text-gray-900">{apiProduct.name}</span>
             <span className="text-xs text-gray-600">产品ID:</span>
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs text-gray-700">{apiProduct.productId}</span>
                <Button 
                  type="text" 
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={async () => {
                    try {
                      await copyToClipboard(apiProduct.productId);
                      message.success('产品ID已复制');
                    } catch {
                      message.error('复制失败，请手动复制');
                    }
                  }}
                  className="h-auto p-1 min-w-0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-8 items-center pt-2 pb-2">
             <span className="text-xs text-gray-600">类型:</span>
              <span className="col-span-2 text-xs text-gray-900">
                {apiProduct.type === 'REST_API' ? 'REST API' : 'MCP Server'}
              </span>
             <span className="text-xs text-gray-600">状态:</span>
              <div className="col-span-2 flex items-center">
                {apiProduct.status === "PENDING" ? (
                  <ExclamationCircleFilled className="text-yellow-500 mr-2" style={{fontSize: '10px'}} />
                ) : apiProduct.status === "READY" ? (
                  <ClockCircleFilled className="text-blue-500 mr-2" style={{fontSize: '10px'}} />
                ) : (
                  <CheckCircleFilled className="text-green-500 mr-2" style={{fontSize: '10px'}} />
                )}
                <span className="text-xs text-gray-900">
                  {apiProduct.status === "PENDING" ? "待配置" : apiProduct.status === "READY" ? "待发布" : "已发布"}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-8 items-center pt-2 pb-2">
              <span className="text-xs text-gray-600">自动审批订阅:</span>
              <div className="col-span-2 flex items-center">
                {apiProduct.autoApprove === true ? (
                  <CheckCircleFilled className="text-green-500 mr-2" style={{fontSize: '10px'}} />
                ) : (
                  <MinusCircleFilled className="text-gray-400 mr-2" style={{fontSize: '10px'}} />
                )}
                <span className="text-xs text-gray-900">
                 {apiProduct.autoApprove === true ? '已开启' : '已关闭'}
                </span>
              </div>
              <span className="text-xs text-gray-600">创建时间:</span>
              <span className="col-span-2 text-xs text-gray-700">{formatDateTime(apiProduct.createAt)}</span>
            </div>

            {apiProduct.description && (
              <div className="grid grid-cols-6 gap-8 pt-2 pb-2">
               <span className="text-xs text-gray-600">描述:</span>
                <span className="col-span-5 text-xs text-gray-700 leading-relaxed">
                  {apiProduct.description}
                </span>
              </div>
            )}

        </div>
      </Card>

      {/* 统计数据 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              navigate(`/api-products/detail?productId=${apiProduct.productId}&tab=portal`)
            }}
          >
            <Statistic
              title="发布的门户"
              value={portalCount}
              prefix={<GlobalOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              navigate(`/api-products/detail?productId=${apiProduct.productId}&tab=link-api`)
            }}
          >
            <Statistic
              title="关联API"
              value={getServiceName(linkedService) || '未关联'}
              prefix={<ApiOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="hover:shadow-md transition-shadow">
            <Statistic
              title="订阅用户"
              value={subscriberCount}
              prefix={<TeamOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

    </div>
  )
} 