import { useState } from 'react'
import { Layout, Drawer, theme, Grid } from 'antd'
import { Outlet } from 'react-router-dom'
import AppSider from './AppSider'
import AppHeader from './AppHeader'
import { useThemeStore } from '@/store/themeStore'

const { Content } = Layout
const { useBreakpoint } = Grid

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isDark  = useThemeStore((s) => s.isDark)

  const isMobile = !screens.md

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {/* Desktop: sticky Sider */}
      {!isMobile && (
        <AppSider collapsed={collapsed} />
      )}

      {/* Mobile: Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={220}
          styles={{
            body:   { padding: 0, background: isDark ? '#141414' : '#001529' },
            header: { display: 'none' },
            mask:   {},
          }}
        >
          <AppSider collapsed={false} onMenuClick={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      <Layout style={{ background: token.colorBgLayout }}>
        <AppHeader
          collapsed={collapsed}
          onToggle={isMobile ? () => setDrawerOpen(true) : () => setCollapsed((c) => !c)}
        />
        <Content
          style={{
            padding:    isMobile ? '12px' : '24px',
            minHeight:  'calc(100vh - 56px)',
            background: token.colorBgLayout,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
