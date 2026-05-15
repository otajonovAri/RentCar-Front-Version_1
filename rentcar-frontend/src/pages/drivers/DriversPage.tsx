import { useState, useEffect, useCallback } from 'react'
import { Button, theme, Spin, Grid } from 'antd'
import {
  PlusOutlined, EditOutlined, PhoneOutlined,
  CarFilled, TeamOutlined, BankFilled,
  DollarCircleFilled, UserOutlined,
} from '@ant-design/icons'
import { driversApi } from '@/api/driversApi'
import type { DriverListItemDto } from '@/types/drivers'
import DriverFormModal from './components/DriverFormModal'
import { useAuthStore } from '@/store/authStore'

const fmt = (n: number) => n.toLocaleString('ru-RU')

// Gradient palette cycling by id
const PALETTE = [
  { bg: 'linear-gradient(135deg,#fa8c16,#fadb14)', shadow: 'rgba(250,140,22,0.35)' },
  { bg: 'linear-gradient(135deg,#1677ff,#6366f1)', shadow: 'rgba(22,119,255,0.3)'  },
  { bg: 'linear-gradient(135deg,#52c41a,#13c2c2)', shadow: 'rgba(82,196,26,0.3)'  },
  { bg: 'linear-gradient(135deg,#722ed1,#eb2f96)', shadow: 'rgba(114,46,209,0.3)' },
  { bg: 'linear-gradient(135deg,#13c2c2,#1677ff)', shadow: 'rgba(19,194,194,0.3)' },
  { bg: 'linear-gradient(135deg,#eb2f96,#fa8c16)', shadow: 'rgba(235,47,150,0.3)' },
]
function paletteFor(id: number) { return PALETTE[id % PALETTE.length] }

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return fullName.slice(0, 2).toUpperCase()
}

export default function DriversPage() {
  const { token }    = theme.useToken()
  const screens      = Grid.useBreakpoint()
  const isMobile     = !screens.md
  const { hasRole }  = useAuthStore()
  const canEdit      = hasRole(['Admin', 'SuperAdmin', 'Manager'])

  const [data,      setData]      = useState<DriverListItemDto[]>([])
  const [loading,   setLoading]   = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<DriverListItemDto | null>(null)
  const [hovered,   setHovered]   = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await driversApi.getAll()
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const avgRate = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.dailyRate, 0) / data.length)
    : 0

  const cols = isMobile ? 1 : !screens.lg ? 2 : 3

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#3d1a00 0%,#fa8c16 55%,#fadb14 100%)',
        padding:      isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position:     'relative',
        overflow:     'hidden',
      }}>
        {/* Decorative circles */}
        {[{s:200,t:-70,r:-50,o:.07},{s:130,t:30,r:120,o:.05},{s:90,b:-30,l:60,o:.08}].map((c,i)=>(
          <div key={i} style={{
            position:'absolute', borderRadius:'50%', background:'#fff',
            width:c.s, height:c.s, opacity:c.o,
            top:c.t, right:c.r, bottom:c.b, left:c.l,
          }}/>
        ))}

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{
            display:       'flex',
            alignItems:    isMobile ? 'flex-start' : 'center',
            gap:           16,
            marginBottom:  20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Icon */}
            <div style={{
              width:56, height:56, borderRadius:14,
              background:'rgba(255,255,255,0.15)',
              backdropFilter:'blur(10px)',
              border:'1px solid rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>
              <TeamOutlined style={{ fontSize:28, color:'#fff' }}/>
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:isMobile?22:28, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Haydovchilarimiz
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {data.length} ta haydovchi · O'rtacha {fmt(avgRate)} so'm/kun
              </p>
            </div>

            {/* Stats chips */}
            {!isMobile && (
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { icon:<TeamOutlined/>,        label:'Haydovchilar', val:data.length },
                  { icon:<DollarCircleFilled/>,  label:'O\'rtacha stavka', val:`${fmt(avgRate)} so'm` },
                ].map((s,i) => (
                  <div key={i} style={{
                    padding:'8px 16px', borderRadius:12,
                    background:'rgba(255,255,255,0.12)',
                    backdropFilter:'blur(6px)',
                    border:'1px solid rgba(255,255,255,0.2)',
                    display:'flex', alignItems:'center', gap:8, color:'#fff', fontSize:13,
                  }}>
                    <span style={{ fontSize:16 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize: i===0?18:14, lineHeight:1 }}>{s.val}</div>
                      <div style={{ fontSize:10, opacity:.7 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add button */}
            {canEdit && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => { setEditing(null); setModalOpen(true) }}
                style={{
                  background:'rgba(255,255,255,0.2)',
                  backdropFilter:'blur(8px)',
                  border:'1px solid rgba(255,255,255,0.35)',
                  color:'#fff',
                  borderRadius:10,
                  fontWeight:600,
                  flexShrink:0,
                }}
              >
                {isMobile ? '' : 'Yangi haydovchi'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── GRID ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:80, gap:16 }}>
          <Spin size="large"/>
          <span style={{ color:token.colorTextTertiary, fontSize:13 }}>Haydovchilar yuklanmoqda...</span>
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🧑‍✈️</div>
          <div style={{ fontSize:18, fontWeight:700, color:token.colorText, marginBottom:6 }}>Haydovchi topilmadi</div>
          <div style={{ fontSize:13, color:token.colorTextTertiary }}>Hali haydovchilar qo'shilmagan</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:isMobile?14:20 }}>
          {data.map((driver) => {
            const pal   = paletteFor(driver.id)
            const isHov = hovered === driver.id
            const initials = getInitials(driver.fullName)
            return (
              <div
                key={driver.id}
                onMouseEnter={() => setHovered(driver.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background:    token.colorBgContainer,
                  borderRadius:  16,
                  border:        `1.5px solid ${isHov ? '#fa8c16' : token.colorBorderSecondary}`,
                  overflow:      'hidden',
                  transform:     isHov ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow:     isHov
                    ? '0 16px 40px rgba(250,140,22,0.12), 0 4px 12px rgba(0,0,0,0.08)'
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  transition:    'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                  display:       'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Color bar top */}
                <div style={{ height:5, background: pal.bg }} />

                {/* Card body */}
                <div style={{ padding:'20px 18px 16px', flex:1, display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>

                  {/* Avatar */}
                  <div style={{
                    width:72, height:72, borderRadius:'50%',
                    background: pal.bg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: `0 6px 20px ${pal.shadow}`,
                    fontSize:24, fontWeight:800, color:'#fff',
                    flexShrink:0,
                    letterSpacing:1,
                  }}>
                    {initials || <UserOutlined style={{ fontSize:28 }}/>}
                  </div>

                  {/* Name */}
                  <div style={{ textAlign:'center' }}>
                    <div style={{
                      fontWeight:700, fontSize:16, color:token.colorText,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      maxWidth:200,
                    }}>
                      {driver.fullName}
                    </div>
                    {driver.branchName && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:5 }}>
                        <span style={{
                          fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20,
                          background:'rgba(22,119,255,0.1)', color:'#1677ff',
                          border:'1px solid rgba(22,119,255,0.2)',
                          display:'flex', alignItems:'center', gap:4,
                        }}>
                          <BankFilled style={{ fontSize:10 }}/> {driver.branchName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ width:'100%', height:1, background:token.colorBorderSecondary }}/>

                  {/* Phone */}
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <PhoneOutlined style={{ color:'#52c41a', fontSize:14 }}/>
                    <a href={`tel:${driver.phoneNumber}`} style={{
                      fontSize:13, fontWeight:600, color:token.colorText,
                      fontFamily:'monospace', textDecoration:'none',
                    }}>
                      {driver.phoneNumber}
                    </a>
                  </div>

                  {/* Daily rate */}
                  <div style={{
                    width:'100%',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px', borderRadius:10,
                    background:'linear-gradient(135deg,rgba(250,140,22,0.08),rgba(250,219,20,0.08))',
                    border:'1px solid rgba(250,140,22,0.15)',
                    marginTop:'auto',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <CarFilled style={{ color:'#fa8c16', fontSize:16 }}/>
                      <span style={{ fontSize:13, color:token.colorTextSecondary }}>Kunlik stavka</span>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontWeight:800, fontSize:17, color:'#fa8c16', lineHeight:1 }}>
                        {fmt(driver.dailyRate)}
                      </span>
                      <span style={{ fontSize:11, color:token.colorTextTertiary, marginLeft:3 }}>so'm</span>
                    </div>
                  </div>
                </div>

                {/* Admin edit button */}
                {canEdit && (
                  <div style={{
                    padding:'10px 18px',
                    borderTop:`1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                  }}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      block
                      onClick={() => { setEditing(driver); setModalOpen(true) }}
                      style={{ color:'#fa8c16', fontWeight:600, borderRadius:8 }}
                    >
                      Tahrirlash
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <DriverFormModal
        open={modalOpen}
        driver={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchData() }}
      />
    </div>
  )
}
