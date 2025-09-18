import { useState, useEffect, useRef } from "react";
import { Button, Avatar, Dropdown, Skeleton } from "antd";
import { UserOutlined, LogoutOutlined, AppstoreOutlined } from "@ant-design/icons";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";

interface UserInfo {
  displayName: string;
  email?: string;
  avatar?: string;
}

// 全局缓存用户信息，避免重复请求
let globalUserInfo: UserInfo | null = null;
let globalLoading = false;

export function UserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(globalUserInfo);
  const [loading, setLoading] = useState(globalUserInfo ? false : true);
  const navigate = useNavigate();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // 如果已有缓存数据，直接使用
    if (globalUserInfo) {
      setUserInfo(globalUserInfo);
      setLoading(false);
      return;
    }

    // 如果正在加载中，等待加载完成
    if (globalLoading) {
      const checkLoading = () => {
        if (!globalLoading && mounted.current) {
          setUserInfo(globalUserInfo);
          setLoading(false);
        } else if (globalLoading) {
          setTimeout(checkLoading, 100);
        }
      };
      checkLoading();
      return;
    }

    // 开始加载用户信息
    globalLoading = true;
    setLoading(true);

    api.get("/developers/profile")
        .then((response) => {
          const data = response.data;
          if (data) {
            const userData = {
              displayName: data.username || data.email || "未命名用户",
              email: data.email,
              avatar: data.avatarUrl || undefined,
            };
            globalUserInfo = userData;
            if (mounted.current) {
              setUserInfo(userData);
            }
          }
        })
        .catch((error) => {
          console.error('获取用户信息失败:', error);
        })
        .finally(() => {
          globalLoading = false;
          if (mounted.current) {
            setLoading(false);
          }
        });

    return () => {
      mounted.current = false;
    };
  }, []);

  const handleLogout = () => {
    // 清除用户信息并跳转到登录页
    globalUserInfo = null;
    globalLoading = false;
    setUserInfo(null);
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'user-info',
      label: (
        <div className="px-3 py-2">
          <div className="font-semibold text-gray-900">{userInfo?.displayName}</div>
          {userInfo?.email && (
            <div className="text-sm text-gray-500">{userInfo.email}</div>
          )}
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'my-applications',
      icon: <AppstoreOutlined />,
      label: '消费者管理',
      onClick: () => navigate('/consumers'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton.Avatar size={32} active />
        {/* <Skeleton.Input active size="small" style={{ width: 80, height: 24 }} /> */}
      </div>
    );
  }

  if (userInfo) {
    return (
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={['hover']}
        overlayClassName="user-dropdown" 
      >
        <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
          <Avatar src={userInfo.avatar} icon={<UserOutlined />} size="default" />
          {/* <span>{userInfo.displayName}</span> */}
        </div>
      </Dropdown>
    );
  }

  return (
    <Button
      icon={<UserOutlined />}
      onClick={() => {
        navigate(`/login`);
      }}
      type="default"
    >
      登录
    </Button>
  );
} 