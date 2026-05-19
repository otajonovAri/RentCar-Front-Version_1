import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HomeFilled, CarFilled, CalendarFilled,
  WarningFilled, SafetyCertificateFilled, ToolFilled,
  DollarCircleFilled, FileTextFilled, AppstoreFilled, ShopFilled,
  CrownFilled, ThunderboltFilled, TagsFilled, TeamOutlined,
  BranchesOutlined, GlobalOutlined, EnvironmentOutlined,
  UnorderedListOutlined, AuditOutlined, PercentageOutlined,
  SolutionOutlined, MessageFilled, BellFilled, UserOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/auth'

const { Sider } = Layout

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  roles?: UserRole[]
}

const menuItems: MenuItem[] = [
  // ── Customer / Owner ──────────────────────────────────────────────────────
  { key: '/my-rentals',     icon: <HomeFilled />,              label: 'Bosh sahifa',          roles: ['Customer', 'Owner'] },
  { key: '/catalog',        icon: <CarFilled />,               label: 'Avtomobillar',         roles: ['Customer', 'Owner'] },
  { key: '/reservations',   icon: <CalendarFilled />,          label: 'Rezervatsiyalar',      roles: ['Customer', 'Owner'] },
  { key: '/rentals',        icon: <FileTextFilled />,          label: 'Ijaralarim',           roles: ['Customer', 'Owner'] },
  { key: '/fines',          icon: <WarningFilled />,           label: 'Jarimalar',            roles: ['Customer', 'Owner'] },
  { key: '/conversations',  icon: <MessageFilled />,           label: 'Chat',                 roles: ['Customer', 'Owner'] },
  { key: '/notifications',  icon: <BellFilled />,              label: 'Bildirishnomalar',     roles: ['Customer', 'Owner'] },
  { key: '/profile',        icon: <UserOutlined />,            label: 'Profil',               roles: ['Customer', 'Owner'] },
  // ── Admin / Manager ───────────────────────────────────────────────────────
  { key: '/dashboard',      icon: <HomeFilled />,              label: 'Dashboard',            roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/cars',           icon: <CarFilled />,               label: 'Mashinalar',           roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/regions',        icon: <GlobalOutlined />,          label: 'Viloyatlar',           roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/cities',         icon: <EnvironmentOutlined />,     label: 'Shaharlar',            roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/branches',       icon: <BranchesOutlined />,        label: 'Filiallar',            roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/drivers',        icon: <TeamOutlined />,            label: 'Haydovchilar',         roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/reservations',   icon: <CalendarFilled />,          label: 'Rezervatsiyalar',      roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/rentals',        icon: <FileTextFilled />,          label: 'Ijaralar',             roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/payments',       icon: <DollarCircleFilled />,      label: "To'lovlar",            roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/inspections',    icon: <ThunderboltFilled />,       label: "Texnik ko'riklar",     roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/fines',          icon: <WarningFilled />,           label: 'Jarimalar',            roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/damage-reports', icon: <AuditOutlined />,           label: 'Zarar hisobotlari',    roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/maintenance',    icon: <ToolFilled />,              label: 'Texnik xizmat',        roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/invoices',       icon: <FileTextFilled />,          label: 'Hisob-fakturalar',     roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/owners',         icon: <CrownFilled />,             label: 'Ownerlar',             roles: ['Admin', 'SuperAdmin'] },
  { key: '/owner-contracts',icon: <SolutionOutlined />,        label: 'Shartnomalar',         roles: ['Admin', 'SuperAdmin'] },
  { key: '/owner-payouts',  icon: <DollarCircleFilled />,      label: "Owner to'lovlari",     roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/pricing-tiers',  icon: <AppstoreFilled />,          label: 'Narxlar jadvali',      roles: ['Admin', 'SuperAdmin'] },
  { key: '/insurance',      icon: <SafetyCertificateFilled />, label: "Sug'urta",             roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { key: '/promotions',     icon: <PercentageOutlined />,      label: 'Promokodlar',          roles: ['Admin', 'SuperAdmin'] },
  { key: '/car-listings',   icon: <TagsFilled />,              label: "Mashina so'rovlari",   roles: ['Admin', 'SuperAdmin'] },
  { key: '/car-features',   icon: <UnorderedListOutlined />,   label: 'Xususiyatlar',         roles: ['Admin', 'SuperAdmin'] },
  { key: '/brands',         icon: <ShopFilled />,              label: 'Brendlar',             roles: ['Admin', 'SuperAdmin'] },
  { key: '/car-models',     icon: <AppstoreFilled />,          label: 'Modellar',             roles: ['Admin', 'SuperAdmin'] },
  { key: '/users',          icon: <CrownFilled />,             label: 'Foydalanuvchilar',     roles: ['Admin', 'SuperAdmin'] },
]

interface AppSiderProps {
  collapsed: boolean
  onMenuClick?: () => void
}

export default function AppSider({ collapsed, onMenuClick }: AppSiderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useAuthStore((s) => s.role)

  const visibleItems = menuItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  )

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{ overflow: 'auto', height: '100vh', position: 'sticky', top: 0 }}
      width={220}
    >
      {/* Logo */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          10,
          padding:      '0 20px',
          height:       56,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink:   0,
        }}
      >
        <CarFilled style={{ fontSize: 20, color: '#1677ff', flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>
            RentCar
          </span>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ border: 'none', marginTop: 4 }}
        items={visibleItems.map((item) => ({
          key:     item.key,
          icon:    item.icon,
          label:   item.label,
          onClick: () => { navigate(item.key); onMenuClick?.() },
        }))}
      />
    </Sider>
  )
}
