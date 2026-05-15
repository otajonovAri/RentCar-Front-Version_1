import { useState, useEffect, useCallback } from 'react'
import { Button, message, theme, Spin, Grid, Pagination } from 'antd'
import {
  BellFilled, CheckOutlined, CheckCircleFilled,
  InfoCircleFilled, WarningFilled, CloseCircleFilled,
} from '@ant-design/icons'
import { notificationsApi } from '@/api/notificationsApi'
import type { NotificationDto } from '@/types/notifications'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useAuthStore } from '@/store/authStore'
import { format, isToday, isYesterday } from 'date-fns'
import { uz } from 'date-fns/locale'

// Notification type → icon + color
function getTypeCfg(type: string): { icon: React.ReactNode; color: string; bg: string } {
  const t = (type ?? '').toLowerCase()
  if (t.includes('error') || t.includes('cancel') || t.includes('fail') || t.includes('jarima'))
    return { icon: <CloseCircleFilled style={{ fontSize:20 }}/>, color:'#ff4d4f', bg:'rgba(255,77,79,0.1)'  }
  if (t.includes('warn') || t.includes('pending') || t.includes('kutilmoqda'))
    return { icon: <WarningFilled     style={{ fontSize:20 }}/>, color:'#fa8c16', bg:'rgba(250,140,22,0.1)' }
  if (t.includes('success') || t.includes('paid') || t.includes('approved') || t.includes('active'))
    return { icon: <CheckCircleFilled style={{ fontSize:20 }}/>, color:'#52c41a', bg:'rgba(82,196,26,0.1)'  }
  return   { icon: <InfoCircleFilled  style={{ fontSize:20 }}/>, color:'#1677ff', bg:'rgba(22,119,255,0.1)' }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d))     return `Bugun, ${format(d,'HH:mm')}`
  if (isYesterday(d)) return `Kecha, ${format(d,'HH:mm')}`
  return format(d, 'd MMM yyyy, HH:mm', { locale: uz })
}

export default function NotificationsPage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md
  const { userId } = useAuthStore()

  const [data,       setData]       = useState<PaginatedResponse<NotificationDto> | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const { page, pageSize, onChange, reset } = usePagination(12)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await notificationsApi.getAll({ userId, page, pageSize, unreadOnly })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [userId, page, pageSize, unreadOnly])

  useEffect(() => { fetchData() }, [fetchData])

  const handleMarkRead = async (id: number) => {
    await notificationsApi.markRead(id)
    fetchData()
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead()
      message.success("Barchasi o'qilgan deb belgilandi ✓")
      fetchData()
    } finally {
      setMarkingAll(false)
    }
  }

  const items      = data?.items ?? []
  const total      = data?.totalCount ?? 0
  const unreadCnt  = items.filter(n => !n.isRead).length

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#1a0a3d 0%,#722ed1 55%,#eb2f96 100%)',
        padding:      isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position:     'relative',
        overflow:     'hidden',
      }}>
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
              flexShrink:0, position:'relative',
            }}>
              <BellFilled style={{ fontSize:28, color:'#fff' }}/>
              {unreadCnt > 0 && (
                <div style={{
                  position:'absolute', top:-6, right:-6,
                  background:'#ff4d4f', color:'#fff',
                  borderRadius:20, minWidth:18, height:18,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10, fontWeight:700, padding:'0 4px',
                  border:'2px solid rgba(255,255,255,0.3)',
                }}>
                  {unreadCnt}
                </div>
              )}
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:isMobile?22:28, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Bildirishnomalar
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {total} ta bildirishnoma
                {unreadCnt > 0 && ` · ${unreadCnt} ta o'qilmagan`}
              </p>
            </div>

            {/* Stats chips desktop */}
            {!isMobile && (
              <div style={{ display:'flex', gap:10 }}>
                <div style={{
                  padding:'8px 16px', borderRadius:12,
                  background:'rgba(255,255,255,0.12)',
                  backdropFilter:'blur(6px)',
                  border:'1px solid rgba(255,255,255,0.2)',
                  color:'#fff', fontSize:13,
                }}>
                  <div style={{ fontWeight:700, fontSize:18, lineHeight:1, color:'#ffb3f0' }}>{unreadCnt}</div>
                  <div style={{ fontSize:10, opacity:.7 }}>O'qilmagan</div>
                </div>
                <div style={{
                  padding:'8px 16px', borderRadius:12,
                  background:'rgba(255,255,255,0.12)',
                  backdropFilter:'blur(6px)',
                  border:'1px solid rgba(255,255,255,0.2)',
                  color:'#fff', fontSize:13,
                }}>
                  <div style={{ fontWeight:700, fontSize:18, lineHeight:1, color:'#d3f985' }}>{total - unreadCnt}</div>
                  <div style={{ fontSize:10, opacity:.7 }}>O'qilgan</div>
                </div>
              </div>
            )}

            {/* Mark all read */}
            {unreadCnt > 0 && (
              <Button
                icon={<CheckOutlined/>}
                size="large"
                loading={markingAll}
                onClick={handleMarkAllRead}
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
                {isMobile ? '' : "Barchasini o'qildi"}
              </Button>
            )}
          </div>

          {/* Filter chips */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              { label:'Barchasi',       val:false },
              { label:"O'qilmaganlar", val:true  },
            ].map(f => {
              const active = unreadOnly === f.val
              return (
                <button
                  key={String(f.val)}
                  onClick={() => { setUnreadOnly(f.val); reset() }}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    padding:'6px 16px', borderRadius:50,
                    border:`1.5px solid ${active ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                    background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    backdropFilter:'blur(6px)',
                    color:'#fff', cursor:'pointer',
                    fontWeight: active ? 700 : 500, fontSize:12,
                    transition:'all 0.18s',
                    boxShadow: active ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {f.label}
                  {f.val && unreadCnt > 0 && (
                    <span style={{
                      background:'#ff4d4f', color:'#fff',
                      borderRadius:20, minWidth:16, height:16,
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:700, padding:'0 4px',
                    }}>
                      {unreadCnt}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:80, gap:16 }}>
          <Spin size="large"/>
          <span style={{ color:token.colorTextTertiary, fontSize:13 }}>Yuklanmoqda...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{
            width:80, height:80, borderRadius:'50%', margin:'0 auto 16px',
            background:'linear-gradient(135deg,rgba(114,46,209,0.1),rgba(235,47,150,0.1))',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <BellFilled style={{ fontSize:36, color:'#722ed1', opacity:0.4 }}/>
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:token.colorText, marginBottom:6 }}>
            {unreadOnly ? "O'qilmagan bildirishnoma yo'q" : "Bildirishnoma yo'q"}
          </div>
          <div style={{ fontSize:13, color:token.colorTextTertiary }}>
            {unreadOnly ? 'Barcha bildirishnomalar o\'qilgan' : 'Hali bildirishnoma kelmagan'}
          </div>
          {unreadOnly && (
            <button
              style={{
                marginTop:12, padding:'8px 20px', borderRadius:20,
                background:'linear-gradient(135deg,#722ed1,#eb2f96)',
                border:'none', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13,
              }}
              onClick={() => { setUnreadOnly(false); reset() }}
            >
              Barchasini ko'rish
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
            {items.map(notif => {
              const cfg = getTypeCfg(notif.type)
              return (
                <div
                  key={notif.id}
                  style={{
                    background:   token.colorBgContainer,
                    borderRadius: 14,
                    border:       `1.5px solid ${!notif.isRead ? '#722ed1' : token.colorBorderSecondary}`,
                    overflow:     'hidden',
                    display:      'flex',
                    transition:   'box-shadow 0.2s',
                    boxShadow:    !notif.isRead
                      ? '0 4px 20px rgba(114,46,209,0.1)'
                      : '0 1px 4px rgba(0,0,0,0.04)',
                    opacity:      notif.isRead ? 0.75 : 1,
                  }}
                >
                  {/* Left accent bar */}
                  <div style={{
                    width:4, flexShrink:0,
                    background: !notif.isRead
                      ? 'linear-gradient(180deg,#722ed1,#eb2f96)'
                      : token.colorBorderSecondary,
                  }}/>

                  {/* Icon */}
                  <div style={{
                    width:52, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    padding:'16px 0',
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:10,
                      background: cfg.bg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color: cfg.color,
                    }}>
                      {cfg.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, padding:'14px 14px 14px 10px', minWidth:0 }}>
                    <div style={{
                      display:'flex', alignItems:'flex-start',
                      justifyContent:'space-between', gap:8, marginBottom:4,
                    }}>
                      <span style={{
                        fontWeight: notif.isRead ? 500 : 700,
                        fontSize:   14,
                        color:      token.colorText,
                        lineHeight: 1.3,
                        flex:       1,
                      }}>
                        {notif.isRead ? '' : '🔵 '}{notif.title}
                      </span>
                      <span style={{
                        fontSize:   11,
                        color:      token.colorTextTertiary,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginTop:  1,
                      }}>
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>

                    <p style={{
                      margin:     0,
                      fontSize:   13,
                      color:      token.colorTextSecondary,
                      lineHeight: 1.5,
                    }}>
                      {notif.body}
                    </p>

                    {/* Footer: type tag + mark read */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
                      <span style={{
                        fontSize:10, fontWeight:600,
                        padding:'2px 8px', borderRadius:20,
                        background: cfg.bg, color: cfg.color,
                        border:`1px solid ${cfg.color}30`,
                        fontFamily:'monospace',
                      }}>
                        {notif.type}
                      </span>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          style={{
                            display:'inline-flex', alignItems:'center', gap:4,
                            padding:'4px 12px', borderRadius:20,
                            background:'rgba(114,46,209,0.08)',
                            border:'1px solid rgba(114,46,209,0.2)',
                            color:'#722ed1', cursor:'pointer',
                            fontSize:11, fontWeight:600,
                            transition:'all 0.15s',
                          }}
                        >
                          <CheckOutlined style={{ fontSize:10 }}/> O'qildi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={onChange}
                showSizeChanger
                showTotal={t => `Jami ${t} ta`}
                responsive
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
