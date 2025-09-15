import {Card, Row, Col, Statistic} from 'antd'
import {
    UserOutlined,
    ApiOutlined,
    LinkOutlined,
    CheckCircleFilled,
    MinusCircleFilled
} from '@ant-design/icons'
import {Portal} from '@/types'
import {useState, useEffect} from 'react'
import {portalApi, apiProductApi} from '@/lib/api'
import {useNavigate} from 'react-router-dom'

interface PortalOverviewProps {
    portal: Portal
}

const StatusIndicator = ({enabled}: {enabled: boolean}) => (
    <div className="flex items-center">
        {enabled ? (
            <CheckCircleFilled className="text-green-500 mr-2" style={{fontSize: '12px'}} />
        ) : (
            <MinusCircleFilled className="text-gray-500 mr-2" style={{fontSize: '12px'}} />
        )}
        <span className="text-gray-700">
            {enabled ? '已启用' : '已停用'}
        </span>
    </div>
)

export function PortalOverview({portal}: PortalOverviewProps) {
    const navigate = useNavigate()
    const [apiCount, setApiCount] = useState(0)
    const [developerCount, setDeveloperCount] = useState(0)

    useEffect(() => {
        if (!portal.portalId) return;
        
        portalApi.getDeveloperList(portal.portalId, {
            page: 1,
            size: 10
        }).then((res: any) => {
            setDeveloperCount(res.data.totalElements || 0)
        })
        apiProductApi.getApiProducts({
            portalId: portal.portalId,
            page: 1,
            size: 10
        }).then((res: any) => {
            setApiCount(res.data.totalElements || 0)
        })

    }, [portal.portalId]) // 只依赖portalId，而不是整个portal对象

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">概览</h1>
                <p className="text-gray-600">Portal的基本信息和统计数据</p>
            </div>

            {/* 统计卡片 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={12}>
                    <Card onClick={() => {
                        navigate(`/portals/detail?id=${portal.portalId}&tab=developers`)
                    }}>
                        <Statistic
                            title="注册开发者"
                            value={developerCount}
                            prefix={<UserOutlined/>}
                            valueStyle={{color: '#1890ff'}}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={12}>
                    <Card onClick={() => {
                        navigate(`/portals/detail?id=${portal.portalId}&tab=published-apis`)
                    }}>
                        <Statistic
                            title="已发布的API"
                            value={apiCount}
                            prefix={<ApiOutlined/>}
                            valueStyle={{color: '#722ed1'}}
                        />
                    </Card>
                </Col>

            </Row>

            {/* 详细信息 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={24}>
                    <Card title="基本信息" className="h-full">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Portal名称</span>
                                <span className="font-medium">{portal.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Portal ID</span>
                                <span className="font-medium">{portal.portalId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">域名</span>
                                <div className="flex items-center gap-2">
                                    <LinkOutlined/>
                                    <a href={`http://${portal.portalDomainConfig?.[0]?.domain}`} target="_blank"
                                       rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        {portal.portalDomainConfig?.[0]?.domain}
                                    </a>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">账号密码登录</span>
                                <StatusIndicator enabled={portal.portalSettingConfig?.builtinAuthEnabled || false} />
                            </div>
                            {/* <div className="flex justify-between">
                <span className="text-gray-600">OIDC认证</span>
                <Tag color={portal.portalSettingConfig?.oidcAuthEnabled ? "green" : "default"}>
                  {portal.portalSettingConfig?.oidcAuthEnabled ? "已启用" : "已停用"}
                </Tag>
              </div> */}
                            <div className="flex justify-between">
                                <span className="text-gray-600">开发者自动审批</span>
                                <StatusIndicator enabled={portal.portalSettingConfig?.autoApproveDevelopers || false} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">订阅自动审批</span>
                                <StatusIndicator enabled={portal.portalSettingConfig?.autoApproveSubscriptions || false} />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

        </div>
    )
} 