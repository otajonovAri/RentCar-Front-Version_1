import { Modal, message, Avatar, theme } from 'antd'
import { useState } from 'react'
import { usersApi } from '@/api/usersApi'
import type { UserDto } from '@/types/users'
import type { UserRole } from '@/types/auth'
import {
  CrownFilled, SafetyCertificateFilled,
  TeamOutlined, UserOutlined, ShopFilled,
} from '@ant-design/icons'
import { useIsMobile } from '@/hooks/useIsMobile'

// ── Role config ────────────────────────────────────────────────────────────
const ROLE_CFG: Record<UserRole, {
  label: string; desc: string
  color: string; gradient: string
  icon: React.ReactNode
}> = {
  SuperAdmin: {
    label: 'Super Admin', desc: "Tizimning to'liq huquqi",
    color: '#f5222d', gradient: 'linear-gradient(135deg,#f5222d,#ff7875)',
    icon: <CrownFilled />,
  },
  Admin: {
    label: 'Admin', desc: 'Boshqaruv paneli',
    color: '#1677ff', gradient: 'linear-gradient(135deg,#1677ff,#69b1ff)',
    icon: <SafetyCertificateFilled />,
  },
  Manager: {
    label: 'Menejer', desc: 'Ijara boshqaruvi',
    color: '#722ed1', gradient: 'linear-gradient(135deg,#722ed1,#b37feb)',
    icon: <TeamOutlined />,
  },
  Owner: {
    label: 'Egasi', desc: 'Mashina egasi',
    color: '#fa8c16', gradient: 'linear-gradient(135deg,#fa8c16,#ffd591)',
    icon: <ShopFilled />,
  },
  Customer: {
    label: 'Mijoz', desc: 'Oddiy foydalanuvchi',
    color: '#13c2c2', gradient: 'linear-gradient(135deg,#13c2c2,#87e8de)',
    icon: <UserOutlined />,
  },
}

const ALLOWED_ROLES: Record<'SuperAdmin' | 'Admin', UserRole[]> = {
  SuperAdmin: ['Customer', 'Owner', 'Manager', 'Admin', 'SuperAdmin'],
  Admin:      ['Customer', 'Owner', 'Manager'],
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

interface Props {
  user:       UserDto | null
  editorRole: UserRole
  onClose:    () => void
  onSuccess:  () => void
}

export default function UserRoleModal({ user, editorRole, onClose, onSuccess }: Props) {
  const isMobile              = useIsMobile()
  const { token }             = theme.useToken()
  const isDark                = token.colorBgContainer === '#141414' || token.colorBgBase === '#000'
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<UserRole | null>(null)
  const [pressed,  setPressed]  = useState<UserRole | null>(null)

  const currentRole    = user?.role as UserRole | undefined
  const availableRoles = ALLOWED_ROLES[editorRole as 'SuperAdmin' | 'Admin'] ?? []

  const handleOpen = () => setSelected(currentRole ?? null)

  const handleSave = async () => {
    if (!user || !selected) return
    if (selected === currentRole) { onClose(); return }
    setLoading(true)
    try {
      await usersApi.updateRole(user.id, { role: selected })
      message.success(`✅ ${user.fullName} roli ${ROLE_CFG[selected].label} ga o'zgartirildi`)
      onSuccess()
    } catch {
      message.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null
  const userCfg = ROLE_CFG[currentRole!] ?? ROLE_CFG.Customer

  return (
    <Modal
      title={null}
      open={!!user}
      onCancel={onClose}
      afterOpenChange={open => { if (open) handleOpen() }}
      onOk={handleSave}
      confirmLoading={loading}
      okText="Saqlash"
      cancelText="Bekor"
      okButtonProps={{
        disabled: !selected || selected === currentRole,
        style: { borderRadius: 8, fontWeight: 700 },
      }}
      destroyOnHidden
      width={isMobile ? '95vw' : 460}
    >
      {/* ── User header ── */}
      <div style={{
        margin:       '-20px -24px 20px',
        padding:      '24px 24px 20px',
        background:   'linear-gradient(135deg,#1a0a3d 0%,#722ed1 60%,#1677ff 100%)',
        borderRadius: '8px 8px 0 0',
        position:     'relative',
        overflow:     'hidden',
      }}>
        {[{s:120,t:-40,r:-40,o:.08},{s:80,b:-30,l:20,o:.06}].map((c,i)=>(
          <div key={i} style={{
            position:'absolute', borderRadius:'50%', background:'#fff',
            width:c.s, height:c.s, opacity:c.o,
            top:c.t, right:c.r, bottom:c.b, left:c.l,
          }}/>
        ))}
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:14 }}>
          <Avatar
            src={user.avatarUrl || undefined}
            size={52}
            style={{
              background: userCfg.gradient,
              fontWeight: 700, fontSize: 18,
              border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              flexShrink: 0,
            }}
          >
            {!user.avatarUrl && getInitials(user.fullName)}
          </Avatar>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:'#fff', lineHeight:1.2 }}>
              {user.fullName}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:2 }}>
              {user.email}
            </div>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:5,
              marginTop:6, padding:'2px 10px', borderRadius:20,
              background:'rgba(255,255,255,0.18)',
              border:'1px solid rgba(255,255,255,0.3)',
              fontSize:11, color:'#fff', fontWeight:600,
            }}>
              {userCfg.icon} Hozirgi: {userCfg.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── Role selector ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          fontSize:12, fontWeight:600, marginBottom:10,
          textTransform:'uppercase', letterSpacing:.5,
          color: token.colorTextTertiary,
        }}>
          Yangi rol tanlang
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {availableRoles.map(role => {
            const cfg    = ROLE_CFG[role]
            const isSel  = selected === role
            const isCurr = currentRole === role
            const isPres = pressed === role

            // Dark modeda har rol o'z rangida, light modeda neytral
            const idleBg = isDark
              ? `${cfg.color}14`          // 8% opacity — seziladi lekin o'qish oson
              : `${cfg.color}08`          // 5% opacity — ozroq

            const idleBorder = isDark
              ? `${cfg.color}35`          // 21% opacity border
              : token.colorBorderSecondary

            return (
              <div
                key={role}
                onClick={() => setSelected(role)}
                onMouseDown={() => setPressed(role)}
                onMouseUp={() => setPressed(null)}
                onMouseLeave={() => setPressed(null)}
                onTouchStart={() => setPressed(role)}
                onTouchEnd={() => setPressed(null)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          12,
                  padding:      '11px 14px',
                  borderRadius: 12,
                  cursor:       'pointer',
                  userSelect:   'none',

                  // Border
                  border: `2px solid ${isSel ? cfg.color : idleBorder}`,

                  // Background
                  background: isSel
                    ? `${cfg.color}18`
                    : idleBg,

                  // Shadow
                  boxShadow: isSel
                    ? `0 0 0 3px ${cfg.color}20, inset 0 1px 0 ${cfg.color}10`
                    : 'none',

                  // Press + select scale animation
                  transform: isPres
                    ? 'scale(0.975)'
                    : isSel
                      ? 'scale(1.01)'
                      : 'scale(1)',

                  transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {/* Icon circle */}
                <div style={{
                  width:36, height:36, borderRadius:10, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:16,
                  background: isSel
                    ? cfg.gradient
                    : isDark
                      ? `${cfg.color}22`
                      : `${cfg.color}12`,
                  color: isSel ? '#fff' : cfg.color,
                  transition: 'all 0.15s',
                  boxShadow: isSel ? `0 3px 10px ${cfg.color}50` : 'none',
                }}>
                  {cfg.icon}
                </div>

                <div style={{ flex:1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 14,
                    color: isSel ? cfg.color : token.colorText,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'color 0.15s',
                  }}>
                    {cfg.label}
                    {isCurr && (
                      <span style={{
                        fontSize:10, padding:'1px 7px', borderRadius:20,
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        color: token.colorTextTertiary,
                        fontWeight:600,
                      }}>
                        Hozirgi
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize:11, marginTop:1,
                    color: isSel ? `${cfg.color}cc` : token.colorTextTertiary,
                    transition: 'color 0.15s',
                  }}>
                    {cfg.desc}
                  </div>
                </div>

                {/* Check indicator */}
                <div style={{
                  width:22, height:22, borderRadius:'50%', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isSel ? cfg.gradient : 'transparent',
                  border: isSel ? 'none' : `2px solid ${isDark ? 'rgba(255,255,255,0.12)' : token.colorBorderSecondary}`,
                  boxShadow: isSel ? `0 2px 8px ${cfg.color}60` : 'none',
                  transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                  transform: isSel ? 'scale(1)' : 'scale(0.85)',
                }}>
                  {isSel && (
                    <span style={{ color:'#fff', fontSize:11, fontWeight:900, lineHeight:1 }}>✓</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Admin warning */}
      {editorRole === 'Admin' && (
        <div style={{
          marginTop:12, padding:'8px 12px', borderRadius:8,
          background: isDark ? 'rgba(250,140,22,0.12)' : '#fff7e6',
          border: `1px solid ${isDark ? 'rgba(250,140,22,0.3)' : '#ffd591'}`,
          fontSize:11,
          color: isDark ? '#ffd591' : '#ad6800',
        }}>
          ⚠️ Admin sifatida faqat Customer, Owner va Manager rollarini tayinlashingiz mumkin.
        </div>
      )}
    </Modal>
  )
}
