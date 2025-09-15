import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Dropdown, MenuProps, Typography, Spin, Modal, message } from 'antd'
import { 
  LinkOutlined,
  MoreOutlined,
  LeftOutlined,
  GlobalOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { PortalOverview } from '@/components/portal/PortalOverview'
import { PortalPublishedApis } from '@/components/portal/PortalPublishedApis'
import { PortalDevelopers } from '@/components/portal/PortalDevelopers'
import { PortalConsumers } from '@/components/portal/PortalConsumers'
import { PortalSettings } from '@/components/portal/PortalSettings'
import { portalApi } from '@/lib/api'
import { Portal } from '@/types'

const { Title, Paragraph } = Typography

// 移除mockPortal，使用真实API数据

const menuItems = [
  {
    key: "overview",
    label: "Overview",
    icon: GlobalOutlined,
    description: "Portal概览"
  },
  {
    key: "published-apis",
    label: "Published API Products",
    icon: FileTextOutlined,
    description: "已发布的API产品"
  },
  {
    key: "developers",
    label: "Developers",
    icon: TeamOutlined,
    description: "开发者管理"
  },
  // {
  //   key: "consumers",
  //   label: "Consumers",
  //   icon: UserOutlined,
  //   description: "消费者管理"
  // },
  {
    key: "settings",
    label: "Settings",
    icon: SettingOutlined,
    description: "门户设置"
  }
]

export default function PortalDetail() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [portal, setPortal] = useState<Portal | null>(null)
  const [loading, setLoading] = useState(true) // 初始状态为 loading
  const [error, setError] = useState<string | null>(null)

  // 从URL查询参数获取当前tab，默认为overview
  const currentTab = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(currentTab)

  const fetchPortalData = async () => {
    try {
      setLoading(true)
      const portalId = searchParams.get('id') || 'portal-6882e06f4fd0c963020e3485'
      const response = await portalApi.getPortalDetail(portalId) as any
      if (response && response.code === 'SUCCESS') {
        setPortal(response.data)
      } else {
        setError(response?.message || '获取Portal信息失败')
      }
    } catch (err) {
      console.error('获取Portal信息失败:', err)
      setError('获取Portal信息失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortalData()
  }, [])

  // 当URL中的tab参数变化时，更新activeTab
  useEffect(() => {
    setActiveTab(currentTab)
  }, [currentTab])

  const handleBackToPortals = () => {
    navigate('/portals')
  }

  // 处理tab切换，同时更新URL查询参数
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey)
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('tab', tabKey)
    setSearchParams(newSearchParams)
  }

  const renderContent = () => {
    if (!portal) return null
    
    switch (activeTab) {
      case "overview":
        return <PortalOverview portal={portal} />
      case "published-apis":
        return <PortalPublishedApis portal={portal} />
      case "developers":
        return <PortalDevelopers portal={portal} />
      case "consumers":
        return <PortalConsumers portal={portal} />
      case "settings":
        return <PortalSettings portal={portal} onRefresh={fetchPortalData} />
      default:
        return <PortalOverview portal={portal} />
    }
  }

  const dropdownItems: MenuProps['items'] = [
    {
      key: "delete",
      label: "删除",
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: "删除Portal",
          content: "确定要删除该Portal吗？",
          onOk: () => {
            handleDeletePortal();
          },
        });
      },
    },
  ]
  const handleDeletePortal = () => {
    portalApi.deletePortal(searchParams.get('id') || '').then(() => {
      message.success('删除成功')
      navigate('/portals')
    }).catch(() => {
      // message.error(error.response?.data?.message || '删除失败')
    })
  }

  if (error || !portal) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          {error && <><p className=" mb-4">{error || 'Portal信息不存在'}</p>
          <Button onClick={() => navigate('/portals')}>返回Portal列表</Button></>}
          {!error && <Spin fullscreen spinning={loading} />}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <Spin fullscreen spinning={loading} />
      {/* Portal详情侧边栏 */}
      <div className="w-64 border-r bg-white flex flex-col">
        {/* 返回按钮 */}
        <div className="pb-4 border-b">
          <Button 
            type="text"
            // className="w-full justify-start text-gray-600 hover:text-gray-900"
            onClick={handleBackToPortals}
            icon={<LeftOutlined />}
          >
            返回 Portal 列表
          </Button>
        </div>

        {/* Portal 信息 */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <Title level={5} className="mb-0">{portal.name}</Title>
            <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </div>
          <Paragraph className="text-gray-600 mb-3" ellipsis={{ rows: 1, tooltip: portal.name }}>{portal.description}</Paragraph>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <LinkOutlined className="h-3 w-3" />
            <a 
              href={`http://${portal.portalDomainConfig?.[0]?.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline truncate text-blue-600"
            >
              {portal.portalDomainConfig?.[0]?.domain}
            </a>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.key
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto">
      {renderContent()}
      </div>
    </div>
  )
} 