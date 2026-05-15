import { useState, useEffect, useCallback } from 'react'
import {
  Button, Modal, Form, Input, InputNumber,
  Select, message, Spin, Grid, theme,
} from 'antd'
import {
  WarningFilled, PlusOutlined, EditOutlined,
  ExclamationCircleFilled, ClockCircleFilled,
  CheckCircleFilled, CloseCircleFilled, SyncOutlined,
  FileTextOutlined, UserOutlined, CalendarOutlined, DollarCircleFilled,
} from '@ant-design/icons'
import { damageReportsApi } from '@/api/damageReportsApi'
import type { DamageReportDto, DamageStatus } from '@/types/damageReports'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'
import { format } from 'date-fns'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('ru-RU')

const STATUS_CFG: Record<DamageStatus, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode
}> = {
  Reported:    { label: 'Xabar berilgan',    color: '#f5222d', bg: 'rgba(245,34,45,0.1)',   border: 'rgba(245,34,45,0.25)',   icon: <ExclamationCircleFilled style={{ fontSize: 11 }}/> },
  UnderReview: { label: "Ko'rib chiqilmoqda", color: '#fa8c16', bg: 'rgba(250,140,22,0.1)',  border: 'rgba(250,140,22,0.25)',  icon: <ClockCircleFilled       style={{ fontSize: 11 }}/> },
  Repaired:    { label: "Ta'mirlangan",       color: '#1677ff', bg: 'rgba(22,119,255,0.1)',  border: 'rgba(22,119,255,0.25)',  icon: <SyncOutlined            style={{ fontSize: 11 }}/> },
  Closed:      { label: 'Yopilgan',           color: '#8c8c8c', bg: 'rgba(140,140,140,0.1)', border: 'rgba(140,140,140,0.2)',  icon: <CloseCircleFilled       style={{ fontSize: 11 }}/> },
}

const PALETTE = [
  '#cf1322', '#c41d7f', '#096dd9', '#08979c', '#389e0d', '#d46b08',
]
const cardPalette = (id: number) => PALETTE[id % PALETTE.length]

const STATUSES: (DamageStatus | 'all')[] = ['all', 'Reported', 'UnderReview', 'Repaired', 'Closed']

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DamageReportsPage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md
  const { hasRole, userId } = useAuthStore()
  const isManager = hasRole(['Manager', 'Admin', 'SuperAdmin'])

  const [data,          setData]          = useState<PaginatedResponse<DamageReportDto> | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [statusFilter,  setStatusFilter]  = useState<DamageStatus | undefined>()
  const [createOpen,    setCreateOpen]    = useState(false)
  const [updateRecord,  setUpdateRecord]  = useState<DamageReportDto | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [hovered,       setHovered]       = useState<number | null>(null)
  const [createForm] = Form.useForm()
  const [updateForm] = Form.useForm()
  const { page, pageSize, onChange, reset } = usePagination(12)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await damageReportsApi.getAll({ page, pageSize, status: statusFilter })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    const values = await createForm.validateFields()
    setActionLoading(true)
    try {
      await damageReportsApi.create({ ...values, reportedByUserId: userId! })
      message.success('✅ Zarar hisoboti yaratildi')
      setCreateOpen(false)
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally { setActionLoading(false) }
  }

  const handleUpdate = async () => {
    const values = await updateForm.validateFields()
    setActionLoading(true)
    try {
      await damageReportsApi.update(updateRecord!.id, values)
      message.success('✅ Holat yangilandi')
      setUpdateRecord(null)
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally { setActionLoading(false) }
  }

  const items   = data?.items ?? []
  const total   = data?.totalCount ?? 0
  const reported    = items.filter(i => i.status === 'Reported').length
  const underReview = items.filter(i => i.status === 'UnderReview').length
  const repaired    = items.filter(i => i.status === 'Repaired').length

  const gridCols = isMobile ? '1fr' : !screens.lg ? 'repeat(2,1fr)' : screens.xl ? 'repeat(3,1fr)' : 'repeat(2,1fr)'

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg,#1a0000 0%,#820014 55%,#cf1322 100%)',
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
              <WarningFilled style={{ fontSize: 28, color: '#fff' }}/>
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Zarar Hisobotlari
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {total} ta hisobot
                {reported > 0 && ` · ${reported} ta yangi`}
                {underReview > 0 && ` · ${underReview} ta ko'rib chiqilmoqda`}
              </p>
            </div>

            {/* Stats chips (desktop) */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'Yangi',           val: reported,    color: '#ffb3b3' },
                  { label: "Ko'rib chiqish",  val: underReview, color: '#ffd591' },
                  { label: "Ta'mirlangan",    val: repaired,    color: '#91caff' },
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
                {isMobile ? '' : 'Hisobot yaratish'}
              </Button>
            )}
          </div>

          {/* Status filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUSES.map(s => {
              const cfg    = s === 'all' ? null : STATUS_CFG[s as DamageStatus]
              const active = s === 'all' ? !statusFilter : statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s === 'all' ? undefined : s as DamageStatus); reset() }}
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
                    ? <><WarningFilled style={{ fontSize: 11 }}/> Barchasi</>
                    : <>{cfg?.icon} {cfg?.label}</>
                  }
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
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Zarar hisobotlari yuklanmoqda...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Zarar hisoboti topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {statusFilter
              ? 'Bu holat bo\'yicha natija yo\'q'
              : 'Hali zarar hisoboti qo\'shilmagan'}
          </div>
          {statusFilter && (
            <button
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
                background: 'linear-gradient(135deg,#820014,#cf1322)',
                border: 'none', color: '#fff', fontWeight: 600, fontSize: 13,
              }}
              onClick={() => { setStatusFilter(undefined); reset() }}
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
            {items.map(rep => {
              const statusCfg = STATUS_CFG[rep.status]
              const topColor  = cardPalette(rep.id)
              const isHov     = hovered === rep.id

              return (
                <div
                  key={rep.id}
                  onMouseEnter={() => setHovered(rep.id)}
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
                    opacity: rep.status === 'Closed' ? 0.7 : 1,
                  }}
                >
                  {/* Colored top bar */}
                  <div style={{ height: 4, background: topColor }}/>

                  <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        {/* ID badge */}
                        <div style={{ marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                            background: 'rgba(207,19,34,0.1)', color: '#cf1322',
                            border: '1px solid rgba(207,19,34,0.2)',
                            fontFamily: 'monospace',
                          }}>
                            #{rep.id} Ko'rik #{rep.inspectionId}
                          </span>
                        </div>
                        {/* Status chip */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          color: statusCfg.color, background: statusCfg.bg,
                          border: `1px solid ${statusCfg.border}`,
                        }}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </div>

                      {isManager && (
                        <Button
                          size="small"
                          icon={<EditOutlined/>}
                          onClick={() => setUpdateRecord(rep)}
                          style={{
                            borderRadius: 8, flexShrink: 0,
                            borderColor: isHov ? topColor : undefined,
                            color: isHov ? topColor : undefined,
                          }}
                        />
                      )}
                    </div>

                    {/* Description — big, 2 lines max */}
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: isHov ? topColor : token.colorText,
                      lineHeight: 1.5, transition: 'color 0.18s',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      <WarningFilled style={{ color: '#cf1322', marginRight: 5, fontSize: 13 }}/>
                      {rep.description}
                    </div>

                    <div style={{ height: 1, background: token.colorBorderSecondary }}/>

                    {/* Info rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {/* Estimated cost */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <DollarCircleFilled style={{ fontSize: 11 }}/> Taxminiy xarajat
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#cf1322' }}>
                          {fmt(rep.estimatedRepairCost)} so'm
                        </span>
                      </div>

                      {/* Actual cost */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircleFilled style={{ fontSize: 11, color: rep.actualRepairCost ? '#52c41a' : token.colorTextTertiary }}/> Haqiqiy xarajat
                        </span>
                        {rep.actualRepairCost ? (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#52c41a' }}>
                            {fmt(rep.actualRepairCost)} so'm
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: token.colorTextTertiary }}>—</span>
                        )}
                      </div>

                      {/* Reporter */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <UserOutlined style={{ fontSize: 11 }}/> Xabar bergan
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                          {rep.reportedByName}
                        </span>
                      </div>

                      {/* Date */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarOutlined style={{ fontSize: 11 }}/> Sana
                        </span>
                        <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                          {format(new Date(rep.createdAt), 'dd.MM.yyyy HH:mm')}
                        </span>
                      </div>

                      {/* Repaired date (if present) */}
                      {rep.repairedDate && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircleFilled style={{ fontSize: 11, color: '#1677ff' }}/> Ta'mirlandi
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>
                            {format(new Date(rep.repairedDate), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes block */}
                    {rep.notes && (
                      <div style={{
                        padding: '7px 10px', borderRadius: 8, fontSize: 11,
                        background: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        color: token.colorTextSecondary, lineHeight: 1.5,
                      }}>
                        <FileTextOutlined style={{ marginRight: 5 }}/>
                        {rep.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer — edit button (manager only) */}
                  {isManager && (
                    <div style={{
                      borderTop: `1px solid ${token.colorBorderSecondary}`,
                      background: token.colorFillAlter,
                    }}>
                      <Button
                        type="text"
                        icon={<EditOutlined/>}
                        block
                        onClick={() => setUpdateRecord(rep)}
                        style={{
                          color: isHov ? topColor : token.colorTextSecondary,
                          fontWeight: 600, borderRadius: 0, height: 40,
                          transition: 'color 0.18s',
                        }}
                      >
                        Holatni yangilash
                      </Button>
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
                      ? 'linear-gradient(135deg,#820014,#cf1322)'
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
              background: 'linear-gradient(135deg,#820014,#cf1322)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <WarningFilled style={{ color: '#fff', fontSize: 14 }}/>
            </div>
            <span style={{ fontWeight: 700 }}>Yangi zarar hisoboti</span>
          </div>
        }
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => setCreateOpen(false)}
        confirmLoading={actionLoading}
        okText="Saqlash"
        cancelText="Bekor"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700, background: '#cf1322', border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={isMobile ? '95vw' : 460}
        forceRender
        afterClose={() => createForm.resetFields()}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="inspectionId"
            label={<span style={{ fontWeight: 600 }}>🔍 Ko'rik ID</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} size="large" placeholder="1"/>
          </Form.Item>
          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 600 }}>📝 Zarar tavsifi</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <Input.TextArea
              rows={3} style={{ borderRadius: 8 }}
              placeholder="Chap eshikda chuqurcha, old bufer tirilgan..."
            />
          </Form.Item>
          <Form.Item
            name="estimatedRepairCost"
            label={<span style={{ fontWeight: 600 }}>💰 Taxminiy xarajat (so'm)</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <InputNumber
              min={0} step={10000}
              style={{ width: '100%', borderRadius: 8 }} size="large"
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              placeholder="0"
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label={<span style={{ fontWeight: 600 }}>📋 Izoh (ixtiyoriy)</span>}
          >
            <Input.TextArea rows={2} style={{ borderRadius: 8 }} placeholder="Qo'shimcha ma'lumot..."/>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── UPDATE MODAL ─────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#096dd9,#1677ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <EditOutlined style={{ color: '#fff', fontSize: 14 }}/>
            </div>
            <span style={{ fontWeight: 700 }}>Holatni yangilash</span>
          </div>
        }
        open={!!updateRecord}
        onOk={handleUpdate}
        onCancel={() => setUpdateRecord(null)}
        confirmLoading={actionLoading}
        okText="Yangilash"
        cancelText="Bekor"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700, background: '#1677ff', border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={isMobile ? '95vw' : 440}
        forceRender
        afterClose={() => updateForm.resetFields()}
      >
        {/* Preview block */}
        {updateRecord && (
          <div style={{
            padding: '12px 14px', borderRadius: 10, marginTop: 8, marginBottom: 16,
            background: 'rgba(207,19,34,0.05)', border: '1px solid rgba(207,19,34,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: 'linear-gradient(135deg,#820014,#cf1322)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <WarningFilled style={{ color: '#fff', fontSize: 14 }}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: 13, lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {updateRecord.description}
                </div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 3 }}>
                  Ko'rik #{updateRecord.inspectionId} · {updateRecord.reportedByName}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: '#8c8c8c' }}>Taxminiy</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#cf1322' }}>
                  {fmt(updateRecord.estimatedRepairCost)} so'm
                </div>
              </div>
            </div>
          </div>
        )}

        <Form
          form={updateForm}
          layout="vertical"
          initialValues={{ status: updateRecord?.status }}
        >
          <Form.Item
            name="status"
            label={<span style={{ fontWeight: 600 }}>📊 Yangi holat</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <Select size="large" style={{ borderRadius: 8 }} placeholder="Holatni tanlang">
              {(['Reported', 'UnderReview', 'Repaired', 'Closed'] as DamageStatus[]).map(s => (
                <Select.Option key={s} value={s}>
                  <span style={{ color: STATUS_CFG[s].color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {STATUS_CFG[s].icon} {STATUS_CFG[s].label}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="actualRepairCost"
            label={<span style={{ fontWeight: 600 }}>💰 Haqiqiy ta'mir xarajati (so'm)</span>}
          >
            <InputNumber
              min={0} step={10000}
              style={{ width: '100%', borderRadius: 8 }} size="large"
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              placeholder="Ixtiyoriy"
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label={<span style={{ fontWeight: 600 }}>📝 Izoh (ixtiyoriy)</span>}
          >
            <Input.TextArea rows={2} style={{ borderRadius: 8 }} placeholder="Qo'shimcha ma'lumot..."/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
