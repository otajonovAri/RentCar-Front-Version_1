import { useEffect, useState } from 'react'
import { Layout, Button, Avatar, Dropdown, Typography, Space, Tooltip, theme, Grid, Badge } from 'antd'
import {
  MenuFoldOutlined, MenuUnfoldOutlined,
  LogoutOutlined, SettingOutlined, SunOutlined, MoonOutlined, MessageOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authApi } from '@/api/authApi'
import { conversationsApi } from '@/api/conversationsApi'
import type { MenuProps } from 'antd'

const { Header } = Layout
const { Text } = Typography

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Admin',
  Admin:      'Administrator',
  Manager:    'Menejer',
  Owner:      'Egasi',
  Customer:   'Mijoz',
}

interface AppHeaderProps {
  collapsed: boolean
  onToggle: () => void
}

export default function AppHeader({ collapsed, onToggle }: AppHeaderProps) {
  const navigate = useNavigate()
  const { fullName, role, logout, userId } = useAuthStore()
  const { isDark, toggle } = useThemeStore()
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    const load = () =>
      conversationsApi.getUnreadCount(userId)
        .then(r => setUnreadCount(r.data))
        .catch(() => {})
    load()
    const timer = setInterval(load, 15_000)
    return () => clearInterval(timer)
  }, [userId])

  const initials = (fullName ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Profil sozlamalari',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Chiqish',
      danger: true,
      onClick: handleLogout,
    },
  ]

  return (
    <Header
      style={{
        padding:        '0 20px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        background:     token.colorBgContainer,
        boxShadow:      `0 1px 0 ${token.colorBorderSecondary}`,
        position:       'sticky',
        top:            0,
        zIndex:         10,
        height:         56,
      }}
    >
      {/* Chap: sidebar toggle */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{ fontSize: 18, width: 40, height: 40 }}
      />

      {/* O'ng: theme toggle + suhbatlar + user */}
      <Space size={4}>
        <Tooltip title="Suhbatlar">
          <Badge count={unreadCount} size="small" offset={[-4, 4]}>
            <Button
              type="text"
              shape="circle"
              icon={<MessageOutlined style={{ fontSize: 17 }} />}
              onClick={() => navigate('/conversations')}
              style={{ width: 40, height: 40 }}
            />
          </Badge>
        </Tooltip>

        <Tooltip title={isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}>
          <Button
            type="text"
            shape="circle"
            icon={
              isDark
                ? <SunOutlined  style={{ fontSize: 17, color: '#faad14' }} />
                : <MoonOutlined style={{ fontSize: 17 }} />
            }
            onClick={toggle}
            style={{ width: 40, height: 40 }}
          />
        </Tooltip>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
          <Space
            style={{
              cursor:       'pointer',
              padding:      '4px 8px',
              borderRadius: token.borderRadius,
            }}
          >
            <Avatar
              size={34}
              style={{
                background: 'linear-gradient(135deg, #1677ff 0%, #6366f1 100%)',
                fontWeight: 700,
                fontSize:   14,
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>
            <div style={{ display: screens?.sm ? 'flex' : 'none', flexDirection: 'column', lineHeight: 1.3 }}>
              <Text strong style={{ fontSize: 13 }}>{fullName}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {ROLE_LABELS[role ?? ''] ?? role}
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}
