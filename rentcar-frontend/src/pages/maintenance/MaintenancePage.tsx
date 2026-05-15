import { useState, useEffect, useCallback } from 'react'
import {
  Button, Modal, Form, Input, InputNumber, DatePicker,
  Select, message, Spin, Grid, theme, Popconfirm,
} from 'antd'
import {
  ToolFilled, PlusOutlined, CheckOutlined,
  ClockCircleFilled, SyncOutlined, CheckCircleFilled, CloseCircleFilled,
  CarFilled, CalendarOutlined, DollarCircleFilled, SettingOutlined,
} from '@ant-design/icons'
import { maintenanceApi } from '@/api/maintenanceApi'
import type { MaintenanceDto, MaintenanceType, MaintenanceStatus } from '@/types/maintenance'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'
import { format } from 'date-fns'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('ru-RU')

const STATUS_CFG: Record<MaintenanceStatus, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode
}> = {
  Scheduled:  { label: 'Rejalashtirilgan', color: '#fa8c16', bg: 'rgba(250,140,22,0.1)',  border: 'rgba(250,140,22,0.25)',  icon: <ClockCircleFilled  style={{ fontSize: 11 }}/> },
  InProgress: { label: 'Jarayonda',        color: '#1677ff', bg: 'rgba(22,119,255,0.1)',  border: 'rgba(22,119,255,0.25)',  icon: <SyncOutlined       style={{ fontSize: 11 }}/> },
  Completed:  { label: 'Yakunlangan',      color: '#52c41a', bg: 'rgba(82,196,26,0.1)',   border: 'rgba(82,196,26,0.25)',   icon: <CheckCircleFilled  style={{ fontSize: 11 }}/> },
  Cancelled:  { label: 'Bekor qilingan',   color: '#8c8c8c', bg: 'rgba(140,140,140,0.1)', border: 'rgba(140,140,140,0.2)',  icon: <CloseCircleFilled  style={{ fontSize: 11 }}/> },
}

const TYPE_CFG: Record<MaintenanceType, { label: string; color: string; bg: string }> = {
  Routine:    { label: 'Muntazam',    color: '#13c2c2', bg: 'rgba(19,194,194,0.1)'  },
  Repair:     { label: "Ta'mirlash", color: '#fa8c16', bg: 'rgba(250,140,22,0.1)'  },
  Emergency:  { label: 'Favqulodda', color: '#f5222d', bg: 'rgba(245,34,45,0.1)'   },
  Inspection: { label: "Ko'rik",     color: '#722ed1', bg: 'rgba(114,46,209,0.1)'  },
}

const PALETTE = [
  '#d46b08', '#c41d7f', '#096dd9', '#08979c', '#389e0d', '#cf1322',
]
const cardPalette = (id: number) => PALETTE[id % PALETTE.length]

const STATUSES: (MaintenanceStatus | 'all')[] = ['all', 'Scheduled', 'InProgress', 'Completed', 'Cancelled']
const TYPES: (MaintenanceType | 'all')[] = ['all', 'Routine', 'Repair', 'Emergency', 'Inspection']

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md
  const { hasRole } = useAuthStore()
  const isManager = hasRole(['Manager', 'Admin', 'SuperAdmin'])

  const [data,             setData]             = useState<PaginatedResponse<MaintenanceDto> | null>(null)
  const [loading,          setLoading]          = useState(false)
  const [statusFilter,     setStatusFilter]     = useState<MaintenanceStatus | undefined>()
  const [typeFilter,       setTypeFilter]       = useState<MaintenanceType | undefined>()
  const [createOpen,       setCreateOpen]       = useState(false)
  const [completingRecord, setCompletingRecord] = useState<MaintenanceDto | null>(null)
  const [actionLoading,    setActionLoading]    = useState(false)
  const [hovered,          setHovered]          = useState<number | null>(null)
  const [createForm] = Form.useForm()
  const [completeForm] = Form.useForm()
  const { page, pageSize, onChange, reset } = usePagination(12)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await maintenanceApi.getAll({ page, pageSize, status: statusFilter, type: typeFilter })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    const values = await createForm.validateFields()
    setActionLoading(true)
    try {
      const payload = {
        ...values,
        scheduledDate: format(
          (values.scheduledDate as { toDate: () => Date }).toDate(),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        ),
      }
      await maintenanceApi.create(payload)
      message.success("✅ Texnik xizmat rejaga qo'shildi")
      setCreateOpen(false)
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally { setActionLoading(false) }
  }

  const handleComplete = async () => {
    const values = await completeForm.validateFields()
    setActionLoading(true)
    try {
      await maintenanceApi.complete(completingRecord!.id, values.actualCost)
      message.success('✅ Texnik xizmat yakunlandi')
      setCompletingRecord(null)
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally { setActionLoading(false) }
  }

  const items      = data?.items ?? []
  const total      = data?.totalCount ?? 0
  const scheduled  = items.filter(i => i.status === 'Scheduled').length
  const inProgress = items.filter(i => i.status === 'InProgress').length
  const completed  = items.filter(i => i.status === 'Completed').length

  const gridCols = isMobile ? '1fr' : !screens.lg ? 'repeat(2,1fr)' : screens.xl ? 'repeat(3,1fr)' : 'repeat(2,1fr)'

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg,#1a0a00 0%,#7c3d00 55%,#d46b08 100%)',
        padding: isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        {[
          { s: 220, t: -80, r: -60, o: .07 },
          { s: 140, t: 20,  r: 140, o: .05 },
          { s: 100, b: -40, l: 80,  o: .07 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', background: '#fff',
            width: c.s, height: c.s, opacity: c.o,
            top: c.t, right: c.r, bottom: c.b, left: c.l,
          }}/>
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            gap: 16, marginBottom: 20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Icon box */}
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ToolFilled style={{ fontSize: 28, color: '#fff' }}/>
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Texnik Xizmat
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {total} ta yozuv
                {scheduled > 0 && ` · ${scheduled} ta rejalashtirilgan`}
                {inProgress > 0 && ` · ${inProgress} ta jarayonda`}
              </p>
            </div>

            {/* Stats chips (desktop) */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'Rejalashtirilgan', val: scheduled,  color: '#ffd591' },
                  { label: 'Jarayonda',        val: inProgress, color: '#91caff' },
                  { label: 'Yakunlangan',      val: completed,  color: '#95f985' },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '8px 16px', borderRadius: 12, textAlign: 'center',
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {isManager && (
              <Button
                icon={<PlusOutlined/>}
                size="large"
                onClick={() => setCreateOpen(true)}
                style={{
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.35)', color: '#fff',
                  borderRadius: 10, fontWeight: 600, flexShrink: 0,
                }}
              >
                {isMobile ? '' : 'Rejalashtirish'}
              </Button>
            )}
          </div>

          {/* Status filter chips — row 1 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {STATUSES.map(s => {
              const cfg    = s === 'all' ? null : STATUS_CFG[s as MaintenanceStatus]
              const active = s === 'all' ? !statusFilter : statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s === 'all' ? undefined : s as MaintenanceStatus); reset() }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 50, cursor: 'pointer',
                    border: `1.5px solid ${active ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                    background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(6px)',
                    color: '#fff', fontWeight: active ? 700 : 500, fontSize: 12,
                    transition: 'all 0.18s',
                    boxShadow: active ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {s === 'all'
                    ? <><ToolFilled style={{ fontSize: 11 }}/> Barchasi</>
                    : <>{cfg?.icon} {cfg?.label}</>
                  }
                </button>
              )
            })}
          </div>

          {/* Type filter chips — row 2 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPES.map(t => {
              const cfg    = t === 'all' ? null : TYPE_CFG[t as MaintenanceType]
              const active = t === 'all' ? !typeFilter : typeFilter === t
              return (
                <button
                  key={t}
                  onClick={() => { setTypeFilter(t === 'all' ? undefined : t as MaintenanceType); reset() }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 50, cursor: 'pointer',
                    border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.85)', fontWeight: active ? 700 : 400, fontSize: 11,
                    transition: 'all 0.18s',
                  }}
                >
                  <SettingOutlined style={{ fontSize: 10 }}/>
                  {t === 'all' ? 'Barcha turlar' : cfg?.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large"/>
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Yuklanmoqda...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Texnik xizmat topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {statusFilter || typeFilter
              ? 'Bu filtr bo\'yicha natija yo\'q'
              : 'Hali texnik xizmat qo\'shilmagan'}
          </div>
          {(statusFilter || typeFilter) && (
            <button
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
                background: 'linear-gradient(135deg,#7c3d00,#d46b08)',
                border: 'none', color: '#fff', fontWeight: 600, fontSize: 13,
              }}
              onClick={() => { setStatusFilter(undefined); setTypeFilter(undefined); reset() }}
            >
              Filterni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
              <strong style={{ color: token.colorText }}>{total}</strong> ta natija
            </span>
            {total > pageSize && (
              <span style={{ fontSize: 12, color: token.colorTextTertiary }}>
                {page} / {Math.ceil(total / pageSize)} sahifa
              </span>
            )}
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 12 : 16 }}>
            {items.map(rec => {
              const statusCfg = STATUS_CFG[rec.status]
              const typeCfg   = TYPE_CFG[rec.type]
              const topColor  = cardPalette(rec.id)
              const isHov     = hovered === rec.id
              const canComplete = rec.status === 'Scheduled' || rec.status === 'InProgress'

              return (
                <div
                  key={rec.id}
                  onMouseEnter={() => setHovered(rec.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: token.colorBgContainer,
                    borderRadius: 16,
                    border: `1.5px solid ${isHov ? topColor : token.colorBorderSecondary}`,
                    overflow: 'hidden',
                    transform: isHov ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow: isHov
                      ? `0 12px 30px ${topColor}28, 0 3px 8px rgba(0,0,0,0.07)`
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    display: 'flex', flexDirection: 'column',
                    opacity: rec.status === 'Cancelled' ? 0.65 : 1,
                  }}
                >
                  {/* Colored top bar */}
                  <div style={{ height: 4, background: topColor }}/>

                  <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Car plate badge */}
                        <div style={{ marginBottom: 5 }}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 12, fontWeight: 800,
                            padding: '2px 10px', borderRadius: 6,
                            background: 'rgba(212,107,8,0.1)', color: '#d46b08',
                            border: '1px solid rgba(212,107,8,0.25)',
                            letterSpacing: 1,
                          }}>
                            <CarFilled style={{ marginRight: 4, fontSize: 10 }}/>{rec.carPlate}
                          </span>
                        </div>
                        {/* Title */}
                        <div style={{
                          fontWeight: 700, fontSize: 14, color: isHov ? topColor : token.colorText,
                          transition: 'color 0.18s', lineHeight: 1.3,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {rec.title}
                        </div>
                        {/* Type badge */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          marginTop: 4, fontSize: 10, fontWeight: 700,
                          padding: '1px 8px', borderRadius: 20,
                          background: typeCfg.bg, color: typeCfg.color,
                          border: `1px solid ${typeCfg.color}40`,
                        }}>
                          <SettingOutlined style={{ fontSize: 9 }}/> {typeCfg.label}
                        </span>
                      </div>

                      {/* Status chip top-right */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        color: statusCfg.color, background: statusCfg.bg,
                        border: `1px solid ${statusCfg.border}`,
                      }}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    </div>

                    <div style={{ height: 1, background: token.colorBorderSecondary }}/>

                    {/* Info rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {/* Service provider */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <SettingOutlined style={{ fontSize: 11 }}/> Servis markazi
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                          {rec.serviceProvider}
                        </span>
                      </div>

                      {/* Scheduled date */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarOutlined style={{ fontSize: 11 }}/> Reja sanasi
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                          {format(new Date(rec.scheduledDate), 'dd.MM.yyyy HH:mm')}
                        </span>
                      </div>

                      {/* Mileage */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CarFilled style={{ fontSize: 11 }}/> Probeg
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                          {fmt(rec.mileageAtService)} km
                        </span>
                      </div>

                      {/* Cost — big, amber */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <DollarCircleFilled style={{ fontSize: 11 }}/> Xarajat
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#d46b08' }}>
                          {fmt(rec.cost)} <span style={{ fontSize: 11, fontWeight: 500 }}>so'm</span>
                        </span>
                      </div>

                      {/* Completed date (if present) */}
                      {rec.completedDate && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircleFilled style={{ fontSize: 11, color: '#52c41a' }}/> Yakunlandi
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#52c41a' }}>
                            {format(new Date(rec.completedDate), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes block */}
                    {rec.notes && (
                      <div style={{
                        padding: '7px 10px', borderRadius: 8, fontSize: 11,
                        background: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        color: token.colorTextSecondary, lineHeight: 1.5,
                      }}>
                        📝 {rec.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer — complete button (manager only) */}
                  {isManager && canComplete && (
                    <div style={{
                      borderTop: `1px solid ${token.colorBorderSecondary}`,
                      background: token.colorFillAlter,
                    }}>
                      <Popconfirm
                        title="Texnik xizmatni yakunlash"
                        description="Haqiqiy xarajatni kiritish uchun modal ochiladi."
                        onConfirm={() => setCompletingRecord(rec)}
                        okText="Davom etish"
                        cancelText="Bekor"
                        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
                      >
                        <Button
                          type="text"
                          icon={<CheckOutlined/>}
                          block
                          style={{
                            color: '#52c41a', fontWeight: 600, borderRadius: 0,
                            height: 40,
                          }}
                        >
                          Yakunlash
                        </Button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28, gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => onChange(p, pageSize)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                    border: page === p ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                    background: page === p
                      ? 'linear-gradient(135deg,#7c3d00,#d46b08)'
                      : token.colorBgContainer,
                    color: page === p ? '#fff' : token.colorText,
                    fontWeight: page === p ? 700 : 400, fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CREATE MODAL ─────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#7c3d00,#d46b08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ToolFilled style={{ color: '#fff', fontSize: 14 }}/>
            </div>
            <span style={{ fontWeight: 700 }}>Texnik xizmat rejalashtirish</span>
          </div>
        }
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => setCreateOpen(false)}
        confirmLoading={actionLoading}
        okText="Rejalashtirish"
        cancelText="Bekor"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700, background: '#d46b08', border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={isMobile ? '95vw' : 480}
        forceRender
        afterClose={() => createForm.resetFields()}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="carId"
            label={<span style={{ fontWeight: 600 }}>🚗 Mashina ID</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} size="large" placeholder="1"/>
          </Form.Item>
          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 600 }}>📋 Nomi</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <Input size="large" style={{ borderRadius: 8 }} placeholder="Moy almashtirish"/>
          </Form.Item>
          <Form.Item
            name="type"
            label={<span style={{ fontWeight: 600 }}>🔧 Tur</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <Select size="large" style={{ borderRadius: 8 }} placeholder="Turni tanlang">
              {(['Routine', 'Repair', 'Emergency', 'Inspection'] as MaintenanceType[]).map(t => (
                <Select.Option key={t} value={t}>
                  <span style={{ color: TYPE_CFG[t].color, fontWeight: 600 }}>{TYPE_CFG[t].label}</span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="scheduledDate"
            label={<span style={{ fontWeight: 600 }}>📅 Reja sanasi</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <DatePicker showTime style={{ width: '100%', borderRadius: 8 }} size="large"/>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="cost"
              label={<span style={{ fontWeight: 600 }}>💰 Xarajat (so'm)</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber
                min={0} step={10000}
                style={{ width: '100%', borderRadius: 8 }} size="large"
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
            <Form.Item
              name="mileageAtService"
              label={<span style={{ fontWeight: 600 }}>🛣 Probeg (km)</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber min={0} style={{ width: '100%', borderRadius: 8 }} size="large"/>
            </Form.Item>
          </div>
          <Form.Item
            name="serviceProvider"
            label={<span style={{ fontWeight: 600 }}>🏢 Servis markazi</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <Input size="large" style={{ borderRadius: 8 }} placeholder="Avto-Servis Markaz"/>
          </Form.Item>
          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 600 }}>📝 Tavsif (ixtiyoriy)</span>}
          >
            <Input.TextArea rows={2} style={{ borderRadius: 8 }} placeholder="Qo'shimcha ma'lumot..."/>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── COMPLETE MODAL ───────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#389e0d,#52c41a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckOutlined style={{ color: '#fff', fontSize: 14 }}/>
            </div>
            <span style={{ fontWeight: 700 }}>Texnik xizmatni yakunlash</span>
          </div>
        }
        open={!!completingRecord}
        onOk={handleComplete}
        onCancel={() => setCompletingRecord(null)}
        confirmLoading={actionLoading}
        okText="✅ Yakunlash"
        cancelText="Bekor"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700, background: '#52c41a', border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={isMobile ? '95vw' : 420}
        forceRender
        afterClose={() => completeForm.resetFields()}
      >
        {/* Preview block */}
        {completingRecord && (
          <div style={{
            padding: '12px 14px', borderRadius: 10, marginTop: 8, marginBottom: 16,
            background: 'rgba(212,107,8,0.06)', border: '1px solid rgba(212,107,8,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#7c3d00,#d46b08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CarFilled style={{ color: '#fff', fontSize: 16 }}/>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{completingRecord.title}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#d46b08' }}>
                    {completingRecord.carPlate}
                  </span>
                  {' · '}{TYPE_CFG[completingRecord.type].label}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>Reja xarajat</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#d46b08' }}>
                  {fmt(completingRecord.cost)} so'm
                </div>
              </div>
            </div>
          </div>
        )}

        <Form form={completeForm} layout="vertical">
          <Form.Item
            name="actualCost"
            label={<span style={{ fontWeight: 600 }}>💰 Haqiqiy xarajat (so'm)</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <InputNumber
              min={0} step={10000}
              style={{ width: '100%', borderRadius: 8 }} size="large"
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              placeholder="0"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
