import { useNavigate, useLocation } from 'react-router-dom'
import { Badge, Grid } from 'antd'
import {
  HomeFilled, CarFilled, FileTextFilled,
  MessageFilled, UserOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { theme } from 'antd'

const { useBreakpoint } = Grid

interface NavItem {
  path:  string
  icon:  (active: boolean) => React.ReactNode
  label: string
  badge?: number
}

interface Props {
  unreadMessages?: number
}

export default function CustomerBottomNav({ unreadMessages = 0 }: Props) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const screens   = useBreakpoint()
  const isDark    = useThemeStore((s) => s.isDark)
  const { token } = theme.useToken()
  const role      = useAuthStore((s) => s.role)

  const isMobile   = !screens.md
  const isCustomer = role === 'Customer' || role === 'Owner'

  if (!isMobile || !isCustomer) return null

  const navItems: NavItem[] = [
    {
      path:  '/my-rentals',
      label: 'Bosh sahifa',
      icon:  (a) => <HomeFilled style={{ fontSize: 22, color: a ? token.colorPrimary : (isDark ? '#64748b' : '#94a3b8') }} />,
    },
    {
      path:  '/catalog',
      label: 'Katalog',
      icon:  (a) => <CarFilled style={{ fontSize: 22, color: a ? token.colorPrimary : (isDark ? '#64748b' : '#94a3b8') }} />,
    },
    {
      path:  '/rentals',
      label: 'Ijaralarim',
      icon:  (a) => <FileTextFilled style={{ fontSize: 22, color: a ? token.colorPrimary : (isDark ? '#64748b' : '#94a3b8') }} />,
    },
    {
      path:  '/conversations',
      label: 'Chat',
      badge: unreadMessages,
      icon:  (a) => <MessageFilled style={{ fontSize: 22, color: a ? token.colorPrimary : (isDark ? '#64748b' : '#94a3b8') }} />,
    },
    {
      path:  '/profile',
      label: 'Profil',
      icon:  (a) => <UserOutlined style={{ fontSize: 22, color: a ? token.colorPrimary : (isDark ? '#64748b' : '#94a3b8') }} />,
    },
  ]

  return (
    <>
      {/* Bottom nav bar */}
      <div style={{
        position:        'fixed',
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          1000,
        background:      isDark ? '#141414' : '#ffffff',
        borderTop:       `1px solid ${isDark ? '#2d2d2d' : '#f0f0f0'}`,
        display:         'flex',
        alignItems:      'stretch',
        height:          60,
        paddingBottom:   'env(safe-area-inset-bottom)',
        boxShadow:       isDark
          ? '0 -4px 20px rgba(0,0,0,0.4)'
          : '0 -4px 20px rgba(0,0,0,0.08)',
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/catalog' && location.pathname.startsWith('/catalog'))

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            3,
                background:     'transparent',
                border:         'none',
                cursor:         'pointer',
                padding:        '6px 4px',
                position:       'relative',
                transition:     'opacity 0.15s',
              }}
            >
              {/* Active indicator line at top */}
              {isActive && (
                <div style={{
                  position:     'absolute',
                  top:          0,
                  left:         '50%',
                  transform:    'translateX(-50%)',
                  width:        28,
                  height:       3,
                  borderRadius: '0 0 4px 4px',
                  background:   token.colorPrimary,
                }} />
              )}

              {/* Icon with badge */}
              <Badge
                count={item.badge ?? 0}
                size="small"
                offset={[6, -2]}
                style={{ fontSize: 10 }}
              >
                {item.icon(isActive)}
              </Badge>

              {/* Label */}
              <span style={{
                fontSize:   10,
                fontWeight: isActive ? 700 : 500,
                color:      isActive
                  ? token.colorPrimary
                  : (isDark ? '#64748b' : '#94a3b8'),
                lineHeight: 1,
                transition: 'color 0.15s',
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Spacer so content doesn't hide behind nav */}
      <div style={{ height: 60 }} />
    </>
  )
}
