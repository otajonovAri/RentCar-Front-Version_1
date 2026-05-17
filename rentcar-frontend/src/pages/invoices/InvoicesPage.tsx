import { useState } from 'react'
import { Button, Input, theme, Grid, Spin, message } from 'antd'
import {
  FileTextFilled, SearchOutlined, PlusOutlined,
  CalendarFilled, DollarCircleFilled, CheckCircleFilled,
  ClockCircleFilled, StopOutlined, EditOutlined,
} from '@ant-design/icons'
import { invoicesApi } from '@/api/invoicesApi'
import type { InvoiceDto, InvoiceStatus } from '@/types/invoices'
import { format } from 'date-fns'

const fmt = (n: number) => n.toLocaleString('ru-RU')

const STATUS_CFG: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  Draft:   { label: 'Qoralama',    color: '#8c8c8c', bg: 'rgba(140,140,140,0.1)', icon: <EditOutlined       style={{ fontSize:12 }}/> },
  Issued:  { label: 'Yuborilgan',  color: '#1677ff', bg: 'rgba(22,119,255,0.1)',  icon: <ClockCircleFilled  style={{ fontSize:12 }}/> },
  Paid:    { label: "To'langan",   color: '#52c41a', bg: 'rgba(82,196,26,0.1)',   icon: <CheckCircleFilled  style={{ fontSize:12 }}/> },
  Overdue: { label: 'Muddati o\'tgan', color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)',  icon: <ClockCircleFilled  style={{ fontSize:12 }}/> },
  Voided:  { label: 'Bekor qilingan', color: '#595959', bg: 'rgba(89,89,89,0.1)', icon: <StopOutlined       style={{ fontSize:12 }}/> },
}

export default function InvoicesPage() {
  const { token } = theme.useToken()
  const screens   = Grid.useBreakpoint()
  const isMobile  = !screens.md

  const [rentalIdInput,  setRentalIdInput]  = useState('')
  const [searchedId,     setSearchedId]     = useState<number | null>(null)
  const [invoice,        setInvoice]        = useState<InvoiceDto | null>(null)
  const [loading,        setLoading]        = useState(false)
  const [notFound,       setNotFound]       = useState(false)
  const [createLoading,  setCreateLoading]  = useState(false)
  const [taxPercent,     setTaxPercent]     = useState('12')
  const [notes,          setNotes]          = useState('')

  const handleSearch = async () => {
    const id = parseInt(rentalIdInput, 10)
    if (!id || id < 1) return
    setLoading(true)
    setNotFound(false)
    setInvoice(null)
    setSearchedId(id)
    try {
      const res = await invoicesApi.getByRental(id)
      setInvoice(res.data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!searchedId) return
    const tax = parseFloat(taxPercent)
    if (isNaN(tax) || tax < 0 || tax > 100) {
      message.warning("Soliq foizi 0–100 orasida bo'lishi kerak")
      return
    }
    setCreateLoading(true)
    try {
      const res = await invoicesApi.create({ rentalId: searchedId, taxPercent: tax, notes: notes || null })
      setInvoice(res.data)
      setNotFound(false)
      message.success('✅ Hisob-faktura muvaffaqiyatli yaratildi!')
    } catch {
      message.error('Yaratishda xatolik yuz berdi')
    } finally {
      setCreateLoading(false)
    }
  }

  const cfg = invoice ? STATUS_CFG[invoice.status] : null
  const taxPct = invoice && invoice.subTotal > 0
    ? ((invoice.taxAmount / invoice.subTotal) * 100).toFixed(1)
    : '0'

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#003a3a 0%,#13c2c2 55%,#1677ff 100%)',
        padding:      isMobile ? '28px 20px 30px' : '40px 40px 38px',
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
          {/* Title row */}
          <div style={{
            display:'flex', alignItems:isMobile?'flex-start':'center',
            gap:16, marginBottom:24,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{
              width:56, height:56, borderRadius:14,
              background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)',
              border:'1px solid rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <FileTextFilled style={{ fontSize:28, color:'#fff' }}/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:isMobile?22:28, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Hisob-Fakturalar
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                Ijara ID bo'yicha fakturani toping yoki yarating
              </p>
            </div>
          </div>

          {/* ── Search bar ── */}
          <div style={{
            background:   'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            border:       '1px solid rgba(255,255,255,0.25)',
            borderRadius: 14,
            padding:      '16px 18px',
          }}>
            <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.8)', marginBottom:10 }}>
              🔍 Ijara raqami bo'yicha qidirish
            </div>
            <div style={{ display:'flex', gap:10, flexDirection: isMobile ? 'column' : 'row' }}>
              <Input
                placeholder="Masalan: 42"
                value={rentalIdInput}
                onChange={e => setRentalIdInput(e.target.value.replace(/\D/g,''))}
                onPressEnter={handleSearch}
                prefix={<span style={{ color:'rgba(255,255,255,0.5)', fontWeight:700, fontSize:13 }}>#</span>}
                size="large"
                style={{
                  flex:1,
                  background:'rgba(255,255,255,0.15)',
                  border:'1px solid rgba(255,255,255,0.2)',
                  borderRadius:10, color:'#fff',
                  fontSize:16, fontWeight:600,
                }}
                styles={{ input: { background:'transparent', color:'#fff' } }}
              />
              <Button
                size="large"
                icon={<SearchOutlined/>}
                loading={loading}
                onClick={handleSearch}
                disabled={!rentalIdInput}
                style={{
                  background:'rgba(255,255,255,0.25)',
                  border:'1px solid rgba(255,255,255,0.4)',
                  color:'#fff', borderRadius:10, fontWeight:700,
                  minWidth: isMobile ? '100%' : 140,
                }}
              >
                Qidirish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── LOADING ───────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:60, gap:14 }}>
          <Spin size="large"/>
          <span style={{ color:token.colorTextTertiary, fontSize:13 }}>
            Ijara #{searchedId} uchun faktura qidirilmoqda...
          </span>
        </div>
      )}

      {/* ── INVOICE FOUND ─────────────────────────────────────────────────── */}
      {!loading && invoice && cfg && (
        <div style={{
          background:   token.colorBgContainer,
          borderRadius: 18,
          border:       `1.5px solid ${token.colorBorderSecondary}`,
          overflow:     'hidden',
          boxShadow:    '0 4px 24px rgba(0,0,0,0.07)',
        }}>
          {/* Invoice header bar */}
          <div style={{
            background:   'linear-gradient(135deg,#003a3a,#13c2c2)',
            padding:      isMobile ? '18px 18px 16px' : '22px 28px 20px',
            display:      'flex',
            alignItems:   isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap:          12,
          }}>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:4, fontWeight:500 }}>
                HISOB-FAKTURA
              </div>
              <div style={{ fontSize:isMobile?20:24, fontWeight:800, color:'#fff', letterSpacing:0.5 }}>
                {invoice.invoiceNumber}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 }}>
                Ijara #{invoice.rentalId} uchun
              </div>
            </div>
            <span style={{
              fontSize:12, fontWeight:700, padding:'6px 16px', borderRadius:20,
              display:'inline-flex', alignItems:'center', gap:6,
              backdropFilter:'blur(6px)',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          <div style={{ padding: isMobile ? '18px' : '24px 28px' }}>

            {/* Info grid */}
            <div style={{
              display:'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap:12, marginBottom:24,
            }}>
              {[
                {
                  icon: <CalendarFilled style={{ color:'#13c2c2', fontSize:16 }}/>,
                  label: 'Berilgan sana',
                  value: format(new Date(invoice.issueDate), 'dd.MM.yyyy'),
                },
                {
                  icon: <CalendarFilled style={{ color:'#ff4d4f', fontSize:16 }}/>,
                  label: "To'lov muddati",
                  value: format(new Date(invoice.dueDate), 'dd.MM.yyyy'),
                  warn: new Date(invoice.dueDate) < new Date() && invoice.status !== 'Paid',
                },
                {
                  icon: <FileTextFilled style={{ color:'#1677ff', fontSize:16 }}/>,
                  label: 'Holat',
                  value: cfg.label,
                  color: cfg.color,
                },
              ].map((item, i) => (
                <div key={i} style={{
                  padding:'14px 16px', borderRadius:12,
                  background: token.colorFillAlter,
                  border:`1px solid ${token.colorBorderSecondary}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    {item.icon}
                    <span style={{ fontSize:11, color:token.colorTextTertiary, fontWeight:500 }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize:15, fontWeight:700,
                    color: item.color ?? (item.warn ? '#ff4d4f' : token.colorText),
                  }}>
                    {item.value}
                    {item.warn && <span style={{ fontSize:11, marginLeft:6 }}>⚠️</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial breakdown */}
            <div style={{
              borderRadius:14,
              border:`1.5px solid rgba(19,194,194,0.2)`,
              overflow:'hidden',
              marginBottom: invoice.notes ? 20 : 0,
            }}>
              {/* Header */}
              <div style={{
                padding:'12px 18px',
                background:'linear-gradient(135deg,rgba(19,194,194,0.08),rgba(22,119,255,0.08))',
                borderBottom:`1px solid rgba(19,194,194,0.15)`,
                display:'flex', alignItems:'center', gap:8,
              }}>
                <DollarCircleFilled style={{ color:'#13c2c2', fontSize:16 }}/>
                <span style={{ fontWeight:700, fontSize:13, color:token.colorText }}>
                  Moliyaviy ma'lumotlar
                </span>
              </div>

              {/* Rows */}
              <div style={{ padding:'6px 0' }}>
                {[
                  { label:'Asosiy summa',       value: fmt(invoice.subTotal),  sub: '' },
                  { label:`Soliq (${taxPct}%)`, value: fmt(invoice.taxAmount), sub: '' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'11px 18px',
                    borderBottom:`1px solid ${token.colorBorderSecondary}`,
                  }}>
                    <span style={{ fontSize:13, color:token.colorTextSecondary }}>{row.label}</span>
                    <span style={{ fontSize:14, fontWeight:600, color:token.colorText, fontFamily:'monospace' }}>
                      {row.value} so'm
                    </span>
                  </div>
                ))}

                {/* Total row */}
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'14px 18px',
                  background:'linear-gradient(135deg,rgba(19,194,194,0.07),rgba(22,119,255,0.07))',
                }}>
                  <div>
                    <div style={{ fontSize:12, color:token.colorTextTertiary }}>Jami to'lov</div>
                    <div style={{ fontSize:11, color:token.colorTextTertiary }}>
                      (asosiy + soliq)
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:isMobile?22:26, fontWeight:900, color:'#13c2c2', lineHeight:1 }}>
                      {fmt(invoice.totalAmount)}
                    </div>
                    <div style={{ fontSize:12, color:token.colorTextTertiary }}>so'm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{
                padding:'14px 16px', borderRadius:12,
                background:token.colorFillAlter,
                border:`1px solid ${token.colorBorderSecondary}`,
              }}>
                <div style={{ fontSize:11, color:token.colorTextTertiary, marginBottom:6, fontWeight:500 }}>
                  📝 IZOH
                </div>
                <div style={{ fontSize:13, color:token.colorText, lineHeight:1.6 }}>
                  {invoice.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NOT FOUND + CREATE FORM ───────────────────────────────────────── */}
      {!loading && notFound && searchedId && (
        <div style={{
          background:   token.colorBgContainer,
          borderRadius: 18,
          border:       `1.5px solid rgba(19,194,194,0.3)`,
          overflow:     'hidden',
          boxShadow:    '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          {/* Not found header */}
          <div style={{
            padding:'18px 24px 16px',
            borderBottom:`1px solid ${token.colorBorderSecondary}`,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:44, height:44, borderRadius:12,
              background:'rgba(19,194,194,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <FileTextFilled style={{ fontSize:22, color:'#13c2c2' }}/>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:token.colorText }}>
                Ijara #{searchedId} uchun faktura topilmadi
              </div>
              <div style={{ fontSize:12, color:token.colorTextTertiary, marginTop:2 }}>
                Yangi hisob-faktura yaratishingiz mumkin
              </div>
            </div>
          </div>

          {/* Create form */}
          <div style={{ padding: isMobile ? '18px' : '24px 28px' }}>
            <div style={{
              display:'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)',
              gap:16, marginBottom:16,
            }}>
              {/* Tax percent */}
              <div>
                <div style={{
                  fontSize:12, fontWeight:600, color:token.colorTextSecondary,
                  marginBottom:8, display:'flex', alignItems:'center', gap:6,
                }}>
                  <DollarCircleFilled style={{ color:'#13c2c2' }}/>
                  Soliq foizi (%)
                </div>
                <div style={{ display:'flex', alignItems:'center' }}>
                  <Input
                    value={taxPercent}
                    onChange={e => setTaxPercent(e.target.value.replace(/[^\d.]/g,''))}
                    suffix="%"
                    size="large"
                    style={{ borderRadius:10, fontWeight:700, fontSize:16 }}
                    placeholder="12"
                  />
                </div>
                <div style={{ fontSize:11, color:token.colorTextTertiary, marginTop:4 }}>
                  Odatda 12% QQS qo'llaniladi
                </div>
              </div>

              {/* Notes */}
              <div>
                <div style={{
                  fontSize:12, fontWeight:600, color:token.colorTextSecondary,
                  marginBottom:8, display:'flex', alignItems:'center', gap:6,
                }}>
                  📝 Izoh (ixtiyoriy)
                </div>
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  size="large"
                  style={{ borderRadius:10 }}
                  placeholder="Qo'shimcha izoh..."
                />
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined/>}
              loading={createLoading}
              onClick={handleCreate}
              style={{
                width:'100%',
                borderRadius:10,
                fontWeight:700,
                fontSize:15,
                height:48,
                background:'linear-gradient(135deg,#13c2c2,#1677ff)',
                border:'none',
                boxShadow:'0 4px 16px rgba(19,194,194,0.3)',
              }}
            >
              Hisob-faktura yaratish — Ijara #{searchedId}
            </Button>
          </div>
        </div>
      )}

      {/* ── IDLE STATE (nothing searched yet) ────────────────────────────── */}
      {!loading && !invoice && !notFound && (
        <div style={{ textAlign:'center', padding:'50px 20px' }}>
          <div style={{
            width:80, height:80, borderRadius:'50%', margin:'0 auto 16px',
            background:'linear-gradient(135deg,rgba(19,194,194,0.1),rgba(22,119,255,0.1))',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <FileTextFilled style={{ fontSize:36, color:'#13c2c2', opacity:0.5 }}/>
          </div>
          <div style={{ fontSize:16, fontWeight:600, color:token.colorText, marginBottom:6 }}>
            Faktura qidirish
          </div>
          <div style={{ fontSize:13, color:token.colorTextTertiary, maxWidth:280, margin:'0 auto' }}>
            Yuqoridagi qidiruv maydoniga ijara raqamini kiriting va fakturani toping
          </div>
        </div>
      )}
    </div>
  )
}
