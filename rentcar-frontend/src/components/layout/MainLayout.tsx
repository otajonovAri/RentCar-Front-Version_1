import { useState } from 'react'
import { Layout, Drawer, theme, Grid } from 'antd'
import { Outlet } from 'react-router-dom'
import AppSider from './AppSider'
import AppHeader from './AppHeader'
import CustomerBottomNav from './CustomerBottomNav'
import MobileDrawerMenu from './MobileDrawerMenu'
import { useThemeStore } from '@/store/themeStore'

const { Content } = Layout
const { useBreakpoint } = Grid

export default function MainLayout() {
  const [collapsed,  setCollapsed]  = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { token }  = theme.useToken()
  const screens    = useBreakpoint()
  const isDark     = useThemeStore((s) => s.isDark)

  const isMobile = !screens.lg

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', background: token.colorBgLayout, flexDirection: 'row' }}>
      {/* Desktop: Sider */}
      {!isMobile && (
        <AppSider collapsed={collapsed} />
      )}

      {/* Mobile: Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          styles={{
            body:   { padding: 0, background: isDark ? '#141414' : '#001529' },
            header: { display: 'none' },
            mask:   {},
          }}
        >
          <MobileDrawerMenu onClose={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      {/* Right side: header (fixed) + scrollable content below */}
      <div style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        height:         '100vh',
        overflow:       'hidden',
        background:     token.colorBgLayout,
        minWidth:       0,
      }}>
        <AppHeader
          collapsed={collapsed}
          onToggle={isMobile ? () => setDrawerOpen(true) : () => setCollapsed((c) => !c)}
        />

        {/* Scrollable content area — header bu zone'dan tashqarida */}
        <div style={{ flex: 1, overflow: 'auto', background: token.colorBgLayout }}>
          <Content
            style={{
              padding:    isMobile ? '12px' : '24px',
              background: token.colorBgLayout,
            }}
          >
            <Outlet />
          </Content>
        </div>
      </div>

      {/* Customer mobile bottom navigation */}
      <CustomerBottomNav />
    </Layout>
  )
}
