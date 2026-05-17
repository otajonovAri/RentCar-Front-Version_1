import { useState, useEffect, useCallback } from 'react'
import {
  Button, Input, Modal, Form, InputNumber, Select,
  DatePicker, Switch, Spin, Pagination, Popconfirm,
  Grid, theme, message, Row, Col,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, PercentageOutlined, TagsFilled,
  CheckCircleFilled, CloseCircleFilled, GiftFilled,
  CalendarFilled, FireFilled, DollarCircleFilled,
} from '@ant-design/icons'
import { promotionsApi } from '@/api/promotionsApi'
import type { PromotionDto } from '@/types/promotions'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'
import { format } from 'date-fns'
import dayjs from 'dayjs'

const fmt = (n: number) => n.toLocaleString('ru-RU')

function isExpired(validTo: string) {
  return new Date(validTo) < new Date()
}
function daysLeft(validTo: string) {
  const diff = Math.ceil((new Date(validTo).getTime() - Date.now()) / 86400000)
  return diff
}

export default function PromotionsPage() {
  const { token }   = theme.useToken()
  const screens     = Grid.useBreakpoint()
  const isMobile    = !screens.md
  const { hasRole } = useAuthStore()
  const canEdit     = hasRole(['Admin', 'SuperAdmin'])

  const [data,       setData]       = useState<PromotionDto[]>([])
  const [loading,    setLoading]    = useState(false)
  const [activeOnly, setActiveOnly] = useState(false)
  const [search,     setSearch]     = useState('')
  const [hovered,    setHovered]    = useState<number | null>(null)

  // Validate
  const [checkCode,    setCheckCode]    = useState('')
  const [checkResult,  setCheckResult]  = useState<PromotionDto | null>(null)
  const [checkError,   setCheckError]   = useState('')
  const [checkLoading, setCheckLoading] = useState(false)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<PromotionDto | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [form] = Form.useForm()

  // Pagination (client-side on filtered list)
  const [page, setPage] = useState(1)
  const pageSize = 12

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await promotionsApi.getAll(activeOnly || undefined)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [search, activeOnly])

  // Filtered + paginated
  const filtered = data.filter(p =>
    !search || p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )
  const total    = filtered.length
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Stats
  const activeCount  = data.filter(p => p.isActive).length
  const expiredCount = data.filter(p => isExpired(p.validTo)).length
  const pctCount     = data.filter(p => p.discountType === 'Percentage').length
  const fixCount     = data.filter(p => p.discountType === 'FixedAmount').length

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit   = (p: PromotionDto) => {
    setEditing(p)
    form.setFieldsValue({
      code:            p.code,
      description:     p.description,
      discountType:    p.discountType,
      discountValue:   p.discountValue,
      minRentalAmount: p.minRentalAmount,
      validFrom:       dayjs(p.validFrom),
      validTo:         dayjs(p.validTo),
      maxUses:         p.maxUses,
      isActive:        p.isActive,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      const payload = {
        ...values,
        validFrom: format(values.validFrom.toDate(), "yyyy-MM-dd'T'HH:mm:ss"),
        validTo:   format(values.validTo.toDate(),   "yyyy-MM-dd'T'HH:mm:ss"),
        isActive:  values.isActive ?? true,
      }
      if (editing) {
        await promotionsApi.update(editing.id, payload)
        message.success('✅ Promokod yangilandi')
      } else {
        await promotionsApi.create(payload)
        message.success('✅ Promokod yaratildi')
      }
      setModalOpen(false); form.resetFields(); fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await promotionsApi.delete(id)
      message.success("🗑️ Promokod o'chirildi")
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, "O'chirishda xatolik"))
    }
  }

  const handleCheck = async () => {
    const code = checkCode.trim().toUpperCase()
    if (!code) return
    setCheckLoading(true); setCheckResult(null); setCheckError('')
    try {
      const res = await promotionsApi.validate(code)
      setCheckResult(res.data)
    } catch {
      setCheckError("Promokod yaroqsiz yoki muddati o'tgan")
    } finally {
      setCheckLoading(false)
    }
  }

  const cols = isMobile ? 1 : !screens.lg ? 2 : 3

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#1a003d 0%,#531dab 55%,#eb2f96 100%)',
        padding:      isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position:     'relative',
        overflow:     'hidden',
      }}>
        {[{s:220,t:-80,r:-60,o:.07},{s:140,t:40,r:130,o:.05},{s:100,b:-40,l:50,o:.07}].map((c,i)=>(
          <div key={i} style={{
            position:'absolute', borderRadius:'50%', background:'#fff',
            width:c.s, height:c.s, opacity:c.o,
            top:c.t, right:c.r, bottom:c.b, left:c.l,
          }}/>
        ))}

        <div style={{ position:'relative', zIndex:1 }}>
          {/* Title row */}
          <div style={{
            display:'flex', alignItems: isMobile ? 'flex-start' : 'center',
            gap:16, marginBottom:20, flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{
              width:56, height:56, borderRadius:14, flexShrink:0,
              background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)',
              border:'1px solid rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <TagsFilled style={{ fontSize:28, color:'#fff' }}/>
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:isMobile?22:28, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Promokodlar
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {data.length} ta promokod · {activeCount} ta faol
              </p>
            </div>

            {/* Stats */}
            {!isMobile && (
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { label:'Faol',    val:activeCount,  color:'#95f985' },
                  { label:"Muddati o'tgan", val:expiredCount, color:'#ff7875' },
                  { label:'Foiz',    val:pctCount,     color:'#ffe58f' },
                  { label:'Summa',   val:fixCount,     color:'#b5f5ec' },
                ].map((s,i)=>(
                  <div key={i} style={{
                    padding:'7px 14px', borderRadius:12,
                    background:'rgba(255,255,255,0.12)',
                    backdropFilter:'blur(6px)',
                    border:'1px solid rgba(255,255,255,0.2)',
                    textAlign:'center',
                  }}>
                    <div style={{ fontWeight:800, fontSize:18, color:s.color, lineHeight:1 }}>{s.val}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {canEdit && (
              <Button
                icon={<PlusOutlined/>}
                size="large"
                onClick={openCreate}
                style={{
                  background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)',
                  border:'1px solid rgba(255,255,255,0.35)', color:'#fff',
                  borderRadius:10, fontWeight:600, flexShrink:0,
                }}
              >
                {isMobile ? '' : 'Promokod yaratish'}
              </Button>
            )}
          </div>

          {/* Search + toggle row */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <Input
              prefix={<SearchOutlined style={{ color:'rgba(255,255,255,0.6)' }}/>}
              placeholder="Kod yoki tavsif bo'yicha qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
              size="large"
              style={{
                flex:1, minWidth:180, borderRadius:12,
                background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
                border:'1px solid rgba(255,255,255,0.3)',
                color:'#fff', fontSize:14,
              }}
            />
            {/* Active toggle chip */}
            <button
              onClick={() => setActiveOnly(v => !v)}
              style={{
                display:'inline-flex', alignItems:'center', gap:7,
                padding:'10px 16px', borderRadius:12, cursor:'pointer',
                background: activeOnly ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)',
                border:`1.5px solid ${activeOnly ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                color:'#fff', fontWeight: activeOnly ? 700 : 500, fontSize:13,
                transition:'all 0.15s', flexShrink:0,
              }}
            >
              <CheckCircleFilled style={{ fontSize:14, color: activeOnly ? '#95f985' : 'rgba(255,255,255,0.6)' }}/>
              Faqat faollar
            </button>
          </div>
        </div>
      </div>

      {/* ── Promokod tekshirish ── */}
      <div style={{
        marginBottom:24, padding: isMobile ? '16px' : '20px 24px',
        borderRadius:16,
        background: token.colorBgContainer,
        border:`1.5px solid ${token.colorBorderSecondary}`,
        boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:'linear-gradient(135deg,#531dab,#eb2f96)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <SearchOutlined style={{ color:'#fff', fontSize:14 }}/>
          </div>
          <span style={{ fontWeight:700, fontSize:14, color:token.colorText }}>
            Promokodni tekshirish
          </span>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <Input
            placeholder="SUMMER10, NEWYEAR20..."
            value={checkCode}
            onChange={e => {
              setCheckCode(e.target.value.toUpperCase())
              setCheckResult(null); setCheckError('')
            }}
            onPressEnter={handleCheck}
            allowClear
            onClear={() => { setCheckResult(null); setCheckError('') }}
            size="large"
            style={{
              flex:1, borderRadius:10,
              fontFamily:'monospace', fontWeight:700, letterSpacing:1,
            }}
          />
          <Button
            type="primary"
            size="large"
            loading={checkLoading}
            onClick={handleCheck}
            style={{
              borderRadius:10, fontWeight:700, flexShrink:0,
              background:'linear-gradient(135deg,#531dab,#eb2f96)',
              border:'none',
            }}
          >
            Tekshirish
          </Button>
        </div>

        {/* Result */}
        {checkResult && (
          <div style={{
            marginTop:12, padding:'14px 16px', borderRadius:12,
            background:'rgba(82,196,26,0.08)',
            border:'1.5px solid rgba(82,196,26,0.3)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <CheckCircleFilled style={{ color:'#52c41a', fontSize:18 }}/>
              <span style={{
                fontFamily:'monospace', fontWeight:900, fontSize:16,
                color:'#52c41a', letterSpacing:1,
              }}>
                {checkResult.code}
              </span>
              <span style={{
                padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                background: checkResult.discountType === 'Percentage'
                  ? 'rgba(114,46,209,0.12)' : 'rgba(250,140,22,0.12)',
                color: checkResult.discountType === 'Percentage' ? '#722ed1' : '#fa8c16',
                border: `1px solid ${checkResult.discountType === 'Percentage' ? '#722ed1' : '#fa8c16'}30`,
              }}>
                {checkResult.discountType === 'Percentage'
                  ? `${checkResult.discountValue}% chegirma`
                  : `${fmt(checkResult.discountValue)} so'm chegirma`}
              </span>
            </div>
            <div style={{ fontSize:12, color:token.colorTextSecondary, display:'flex', flexWrap:'wrap', gap:12 }}>
              {checkResult.description && <span>📝 {checkResult.description}</span>}
              {checkResult.minRentalAmount > 0 && <span>💰 Min: {fmt(checkResult.minRentalAmount)} so'm</span>}
              <span>📅 {format(new Date(checkResult.validFrom),'dd.MM.yyyy')} → {format(new Date(checkResult.validTo),'dd.MM.yyyy')}</span>
              {checkResult.maxUses > 0 && <span>🔢 {checkResult.usedCount}/{checkResult.maxUses} marta</span>}
            </div>
          </div>
        )}
        {checkError && (
          <div style={{
            marginTop:12, padding:'12px 16px', borderRadius:12,
            background:'rgba(255,77,79,0.08)',
            border:'1.5px solid rgba(255,77,79,0.25)',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <CloseCircleFilled style={{ color:'#ff4d4f', fontSize:16 }}/>
            <span style={{ color:'#ff4d4f', fontWeight:600, fontSize:13 }}>{checkError}</span>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:80, gap:16 }}>
          <Spin size="large"/>
          <span style={{ color:token.colorTextTertiary, fontSize:13 }}>Promokodlar yuklanmoqda...</span>
        </div>
      ) : pageItems.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🎁</div>
          <div style={{ fontSize:18, fontWeight:700, color:token.colorText, marginBottom:6 }}>
            Promokod topilmadi
          </div>
          <div style={{ fontSize:13, color:token.colorTextTertiary }}>
            {search || activeOnly ? 'Bu filtr bo\'yicha natija yo\'q' : "Hali promokod yaratilmagan"}
          </div>
          {(search || activeOnly) && (
            <button
              onClick={() => { setSearch(''); setActiveOnly(false) }}
              style={{
                marginTop:12, padding:'8px 20px', borderRadius:20,
                background:'linear-gradient(135deg,#531dab,#eb2f96)',
                border:'none', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13,
              }}
            >
              Filterni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontSize:13, color:token.colorTextSecondary }}>
              <strong style={{ color:token.colorText }}>{total}</strong> ta promokod
            </span>
          </div>

          {/* Cards grid */}
          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${cols},1fr)`,
            gap: isMobile ? 14 : 18,
            marginBottom:24,
          }}>
            {pageItems.map(promo => {
              const isHov     = hovered === promo.id
              const expired   = isExpired(promo.validTo)
              const days      = daysLeft(promo.validTo)
              const isPct     = promo.discountType === 'Percentage'
              const usagePct  = promo.maxUses > 0 ? Math.round((promo.usedCount / promo.maxUses) * 100) : 0
              const accentColor = promo.isActive && !expired ? '#531dab' : '#8c8c8c'
              const accentGrad  = promo.isActive && !expired
                ? 'linear-gradient(135deg,#531dab,#eb2f96)'
                : 'linear-gradient(135deg,#8c8c8c,#bfbfbf)'

              return (
                <div
                  key={promo.id}
                  onMouseEnter={() => setHovered(promo.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background:    token.colorBgContainer,
                    borderRadius:  16,
                    border:        `1.5px solid ${isHov ? accentColor : token.colorBorderSecondary}`,
                    overflow:      'hidden',
                    transform:     isHov ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow:     isHov
                      ? `0 16px 40px ${accentColor}22, 0 4px 12px rgba(0,0,0,0.08)`
                      : '0 2px 8px rgba(0,0,0,0.05)',
                    transition:    'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    display:       'flex', flexDirection:'column',
                    opacity:       !promo.isActive || expired ? 0.7 : 1,
                  }}
                >
                  {/* Top gradient bar */}
                  <div style={{ height:4, background:accentGrad }}/>

                  {/* Header */}
                  <div style={{
                    padding:'14px 16px 10px',
                    background: isHov ? `${accentColor}08` : 'transparent',
                    transition:'background 0.2s',
                    borderBottom:`1px solid ${token.colorBorderSecondary}`,
                  }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                      {/* Code badge */}
                      <div style={{
                        fontFamily:'monospace', fontWeight:900, fontSize:isMobile?14:16,
                        letterSpacing:1.5, color:'#fff',
                        padding:'4px 12px', borderRadius:8,
                        background:accentGrad,
                        boxShadow: isHov ? `0 4px 14px ${accentColor}50` : 'none',
                        transition:'box-shadow 0.2s',
                      }}>
                        {promo.code}
                      </div>

                      {/* Status */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                        <div style={{
                          display:'inline-flex', alignItems:'center', gap:4,
                          padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700,
                          background: promo.isActive && !expired ? 'rgba(82,196,26,0.1)' : 'rgba(140,140,140,0.1)',
                          color: promo.isActive && !expired ? '#52c41a' : '#8c8c8c',
                          border:`1px solid ${promo.isActive && !expired ? 'rgba(82,196,26,0.3)' : 'rgba(140,140,140,0.2)'}`,
                        }}>
                          {promo.isActive && !expired
                            ? <><CheckCircleFilled style={{ fontSize:9 }}/> Faol</>
                            : <><CloseCircleFilled style={{ fontSize:9 }}/> {expired ? "Muddati o'tgan" : 'Nofaol'}</>
                          }
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {promo.description && (
                      <div style={{
                        marginTop:8, fontSize:12,
                        color:token.colorTextSecondary, lineHeight:1.4,
                      }}>
                        {promo.description}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding:'12px 16px', flex:1, display:'flex', flexDirection:'column', gap:9 }}>

                    {/* Discount */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{
                        width:32, height:32, borderRadius:8, flexShrink:0,
                        background: isPct ? 'rgba(114,46,209,0.1)' : 'rgba(250,140,22,0.1)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        {isPct
                          ? <PercentageOutlined style={{ color:'#722ed1', fontSize:15 }}/>
                          : <DollarCircleFilled style={{ color:'#fa8c16', fontSize:15 }}/>
                        }
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:token.colorTextTertiary }}>Chegirma</div>
                        <div style={{ fontWeight:800, fontSize:15, color: isPct ? '#722ed1' : '#fa8c16' }}>
                          {isPct ? `${promo.discountValue}%` : `${fmt(promo.discountValue)} so'm`}
                        </div>
                      </div>
                      {promo.minRentalAmount > 0 && (
                        <div style={{ marginLeft:'auto', textAlign:'right' }}>
                          <div style={{ fontSize:10, color:token.colorTextTertiary }}>Min summa</div>
                          <div style={{ fontSize:12, fontWeight:600, color:token.colorTextSecondary }}>
                            {fmt(promo.minRentalAmount)} so'm
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <CalendarFilled style={{ color:'#1677ff', fontSize:12, flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:token.colorTextSecondary }}>
                        {format(new Date(promo.validFrom),'dd.MM.yyyy')}
                        {' → '}
                        {format(new Date(promo.validTo),'dd.MM.yyyy')}
                      </span>
                      {!expired && days <= 7 && days > 0 && (
                        <span style={{
                          marginLeft:'auto', fontSize:10, fontWeight:700,
                          color:'#fa8c16', padding:'1px 6px', borderRadius:20,
                          background:'rgba(250,140,22,0.1)',
                        }}>
                          🔥 {days} kun qoldi
                        </span>
                      )}
                    </div>

                    {/* Usage bar */}
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:10, color:token.colorTextTertiary }}>Foydalanish</span>
                        <span style={{ fontSize:10, fontWeight:700, color:token.colorTextSecondary }}>
                          {promo.usedCount} {promo.maxUses > 0 ? `/ ${promo.maxUses}` : '(cheksiz)'}
                        </span>
                      </div>
                      {promo.maxUses > 0 && (
                        <div style={{
                          height:5, borderRadius:10,
                          background:token.colorFillSecondary, overflow:'hidden',
                        }}>
                          <div style={{
                            height:'100%', borderRadius:10,
                            width:`${Math.min(usagePct,100)}%`,
                            background: usagePct >= 100
                              ? '#ff4d4f'
                              : usagePct >= 75
                                ? '#fa8c16'
                                : accentGrad,
                            transition:'width 0.3s',
                          }}/>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  {canEdit && (
                    <div style={{
                      padding:'8px 12px',
                      borderTop:`1px solid ${token.colorBorderSecondary}`,
                      background:token.colorFillAlter,
                      display:'flex', gap:8,
                    }}>
                      <button
                        onClick={() => openEdit(promo)}
                        style={{
                          flex:1, padding:'6px 0', borderRadius:8, cursor:'pointer',
                          background: isHov ? `${accentColor}10` : 'transparent',
                          border:`1px solid ${isHov ? accentColor : token.colorBorderSecondary}`,
                          color: isHov ? accentColor : token.colorTextSecondary,
                          fontWeight:600, fontSize:12,
                          display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                          transition:'all 0.15s',
                        }}
                      >
                        <EditOutlined/> Tahrirlash
                      </button>
                      <Popconfirm
                        title="Promokodni o'chirish"
                        description="Bu amalni bekor qilib bo'lmaydi."
                        onConfirm={() => handleDelete(promo.id)}
                        okText="Ha, o'chir"
                        cancelText="Bekor"
                        okButtonProps={{ danger:true }}
                      >
                        <button style={{
                          padding:'6px 10px', borderRadius:8, cursor:'pointer',
                          background:'transparent',
                          border:`1px solid ${token.colorBorderSecondary}`,
                          color:'#ff4d4f', fontSize:12,
                          display:'flex', alignItems:'center',
                          transition:'all 0.15s',
                        }}>
                          <DeleteOutlined/>
                        </button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <Pagination
                current={page} pageSize={pageSize} total={total}
                onChange={setPage} showTotal={t => `Jami ${t} ta`} responsive
              />
            </div>
          )}
        </>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        title={
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:'linear-gradient(135deg,#531dab,#eb2f96)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <GiftFilled style={{ color:'#fff', fontSize:15 }}/>
            </div>
            <span style={{ fontWeight:700 }}>
              {editing ? 'Promokodni tahrirlash' : 'Yangi promokod yaratish'}
            </span>
          </div>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Saqlash"
        cancelText="Bekor"
        okButtonProps={{ style:{ borderRadius:8, fontWeight:700 } }}
        width={isMobile ? '95vw' : 540}
        forceRender
        afterClose={() => form.resetFields()}
      >
        <Form form={form} layout="vertical" style={{ marginTop:16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={<span style={{ fontWeight:600 }}>🏷️ Promokod</span>}
                rules={[{ required:true, message:'Majburiy' }]}
                normalize={v => (v ?? '').toUpperCase()}
              >
                <Input
                  placeholder="SUMMER10"
                  size="large"
                  style={{ borderRadius:8, fontFamily:'monospace', fontWeight:700, letterSpacing:1 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" label={<span style={{ fontWeight:600 }}>📝 Tavsif (ixtiyoriy)</span>}>
                <Input placeholder="Yozgi chegirma" size="large" style={{ borderRadius:8 }}/>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="discountType"
                label={<span style={{ fontWeight:600 }}>💸 Chegirma turi</span>}
                rules={[{ required:true, message:'Tanlang' }]}
              >
                <Select placeholder="Tanlang" size="large" style={{ borderRadius:8 }}>
                  <Select.Option value="Percentage">
                    <PercentageOutlined/> Foiz (%)
                  </Select.Option>
                  <Select.Option value="FixedAmount">
                    <DollarCircleFilled/> Belgilangan summa
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountValue"
                label={<span style={{ fontWeight:600 }}>🔢 Qiymat</span>}
                rules={[{ required:true, message:'Majburiy' }, { type:'number', min:1 }]}
              >
                <InputNumber min={0} style={{ width:'100%', borderRadius:8 }} size="large" placeholder="10"/>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="minRentalAmount" label={<span style={{ fontWeight:600 }}>💰 Minimal ijara summasi, so'm (ixtiyoriy)</span>}>
            <InputNumber
              min={0} step={50000}
              style={{ width:'100%', borderRadius:8 }} size="large"
              placeholder="500 000"
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={v => Number(v!.replace(/\s/g, '')) as unknown as 0}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="validFrom" label={<span style={{ fontWeight:600 }}>📅 Boshlanish</span>} rules={[{ required:true }]}>
                <DatePicker style={{ width:'100%', borderRadius:8 }} size="large" format="DD.MM.YYYY"/>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validTo" label={<span style={{ fontWeight:600 }}>📅 Tugash</span>} rules={[{ required:true }]}>
                <DatePicker style={{ width:'100%', borderRadius:8 }} size="large" format="DD.MM.YYYY"/>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="maxUses" label={<span style={{ fontWeight:600 }}>🔢 Maksimal foydalanish (ixtiyoriy, bo'sh = cheksiz)</span>}>
            <InputNumber min={1} style={{ width:'100%', borderRadius:8 }} size="large" placeholder="100"/>
          </Form.Item>

          <Form.Item name="isActive" label={<span style={{ fontWeight:600 }}>⚡ Holat</span>} valuePropName="checked" initialValue={true}>
            <Switch checkedChildren={<><FireFilled/> Faol</>} unCheckedChildren="Nofaol"/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
