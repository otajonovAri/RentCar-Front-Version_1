import { Layout, Button, theme, Grid, Tooltip, Space } from 'antd'
import { Outlet, useNavigate } from 'react-router-dom'
import { CarFilled, MoonOutlined, SunOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons'
import { useThemeStore } from '@/store/themeStore'

const { Content } = Layout

export default function GuestLayout() {
  const navigate   = useNavigate()
  const { isDark, toggle } = useThemeStore()
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>

      {/* ── Public Header ─────────────────────────────────────────────── */}
      <div style={{
        position:       'sticky',
        top:            0,
        zIndex:         100,
        background:     token.colorBgContainer,
        boxShadow:      `0 1px 0 ${token.colorBorderSecondary}`,
        height:         56,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 20px',
      }}>
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => navigate('/catalog')}
        >
          <div style={{
            width:          34,
            height:         34,
            borderRadius:   10,
            background:     'linear-gradient(135deg,#1677ff,#6366f1)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <CarFilled style={{ fontSize: 18, color: '#fff' }} />
          </div>
          {!isMobile && (
            <span style={{ fontWeight: 800, fontSize: 16, color: token.colorText }}>
              RentCar
            </span>
          )}
        </div>

        {/* Right actions */}
        <Space size={6}>
          <Tooltip title={isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}>
            <Button
              type="text"
              shape="circle"
              icon={isDark
                ? <SunOutlined style={{ fontSize: 16, color: '#faad14' }} />
                : <MoonOutlined style={{ fontSize: 16 }} />
              }
              onClick={toggle}
            />
          </Tooltip>

          <Button
            icon={<LoginOutlined />}
            onClick={() => navigate('/login')}
          >
            {!isMobile && 'Kirish'}
          </Button>

          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => navigate('/register')}
            style={{ background: 'linear-gradient(135deg,#1677ff,#6366f1)', border: 'none' }}
          >
            {!isMobile && "Ro'yxatdan o'tish"}
          </Button>
        </Space>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <Content style={{
        padding:   isMobile ? '12px' : '24px',
        minHeight: 'calc(100vh - 56px)',
      }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
