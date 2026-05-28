import { useState, useEffect, useCallback } from 'react'
import {
  Button, Spin, theme, Grid, message, Tabs,
  InputNumber, Empty, Alert, Tag, Modal, Pagination,
} from 'antd'
import {
  DollarCircleFilled, CheckOutlined, EyeOutlined, PlusOutlined,
  ClockCircleFilled, CheckCircleFilled, SearchOutlined,
  CarFilled, CalendarFilled, ReloadOutlined, FileImageOutlined,
  HistoryOutlined, RollbackOutlined,
} from '@ant-design/icons'
import { paymentsApi } from '@/api/paymentsApi'
import { getApiError } from '@/utils/apiError'
import type {
  PendingPaymentDto, PaymentDto, PaymentStatus, PaymentHistoryDto,
} from '@/types/payments'
import { format } from 'date-fns'
import { Input } from 'antd'
import RentalDetailDrawer from '@/pages/rentals/components/RentalDetailDrawer'
import CreatePaymentModal from './components/CreatePaymentModal'

// ── Config ────────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  Cash:         '💵 Naqd pul',
  CreditCard:   '💳 Kredit karta',
  DebitCard:    '💳 Debit karta',
  BankTransfer: "🏦 Bank o'tkazmasi",
  Online:       '🌐 Onlayn',
  Click:        '⚡ CLICK',
  Payme:        '📱 Payme',
}

const STATUS_CFG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  Pending:  { label: "Kutilmoqda", color: '#fa8c16', bg: 'rgba(250,140,22,0.12)'  },
  Paid:     { label: "To'langan",  color: '#52c41a', bg: 'rgba(82,196,26,0.12)'   },
  Failed:   { label: "Xato",       color: '#ff4d4f', bg: 'rgba(255,77,79,0.12)'   },
  Refunded: { label: "Qaytarildi", color: '#722ed1', bg: 'rgba(114,46,209,0.12)'  },
}

const fmt = (n: number) => n.toLocaleString('ru-RU')
const HIST_PAGE_SIZE = 10

// ── Main Component ────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { token } = theme.useToken()
  const screens   = Grid.useBreakpoint()
  const isMobile  = !screens.md

  // ── Pending ───────────────────────────────────────────────────────────────
  const [pending,        setPending]        = useState<PendingPaymentDto[]>([])
  const [loading,        setLoading]        = useState(false)
  const [approveId,      setApproveId]      = useState<number | null>(null)
  const [detailId,       setDetailId]       = useState<number | null>(null)
  const [createOpen,     setCreateOpen]     = useState(false)

  // ── Rental lookup ─────────────────────────────────────────────────────────
  const [lookupId,       setLookupId]       = useState<number | null>(null)
  const [lookupLoading,  setLookupLoading]  = useState(false)
  const [lookupResult,   setLookupResult]   = useState<PaymentDto | null>(null)
  const [lookupError,    setLookupError]    = useState<string | null>(null)
  const [lookupSearched, setLookupSearched] = useState(false)

  // ── History ───────────────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState('pending')
  const [histStatus,    setHistStatus]    = useState<PaymentStatus | undefined>()
  const [histPage,      setHistPage]      = useState(1)
  const [histData,      setHistData]      = useState<PaymentHistoryDto[]>([])
  const [histTotal,     setHistTotal]     = useState(0)
  const [histLoading,   setHistLoading]   = useState(false)

  // ── Refund ────────────────────────────────────────────────────────────────
  const [refundId,      setRefundId]      = useState<number | null>(null)
  const [refundLoading, setRefundLoading] = useState(false)

  // ── Fetch functions ───────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentsApi.getPending()
      setPending(res.data)
    } catch {
      message.error("Ma'lumotlarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async (page: number, status?: PaymentStatus) => {
    setHistLoading(true)
    try {
      const res = await paymentsApi.getAll({ page, pageSize: HIST_PAGE_SIZE, status })
      setHistData(res.data.items)
      setHistTotal(res.data.totalCount)
    } catch {
      message.error("To'lov tarixini yuklashda xatolik")
    } finally {
      setHistLoading(false)
    }
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (paymentId: number) => {
    setApproveId(paymentId)
    try {
      await paymentsApi.approve(paymentId)
      message.success("✅ To'lov tasdiqlandi, ijara faollashtirildi!")
      fetchPending()
      if (activeTab === 'history') fetchHistory(histPage, histStatus)
    } catch (err) {
      message.error(getApiError(err, 'Tasdiqlashda xatolik'))
    } finally {
      setApproveId(null)
    }
  }

  // ── Refund ────────────────────────────────────────────────────────────────
  const handleRefund = async (paymentId: number, reason: string) => {
    setRefundLoading(true)
    try {
      await paymentsApi.refund(paymentId, { reason })
      message.success("✅ To'lov qaytarildi!")
      setRefundId(null)
      fetchHistory(histPage, histStatus)
    } catch (err) {
      message.error(getApiError(err, "Qaytarishda xatolik"))
    } finally {
      setRefundLoading(false)
    }
  }

  // ── Rental lookup ─────────────────────────────────────────────────────────
  const handleLookup = async () => {
    if (!lookupId) return
    setLookupLoading(true)
    setLookupResult(null)
    setLookupError(null)
    setLookupSearched(true)
    try {
      const res = await paymentsApi.getByRental(lookupId)
      setLookupResult(res.data)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setLookupError(
        status === 404
          ? "Bu ijara uchun to'lov topilmadi"
          : getApiError(err, 'Xatolik yuz berdi'),
      )
    } finally {
      setLookupLoading(false)
    }
  }

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    if (key === 'history') {
      setHistPage(1)
      fetchHistory(1, histStatus)
    }
  }

  const totalAmount = pending.reduce((s, p) => s + p.amount, 0)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: isMobile ? 80 : 48 }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#0a1628 0%,#0d2d57 50%,#1677ff 100%)',
        padding:      isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position:     'relative',
        overflow:     'hidden',
      }}>
        {[
          { s: 200, t: -70, r: -50, o: .07 },
          { s: 130, t:  30, r: 120, o: .05 },
          { s:  90, b: -30, l:  60, o: .08 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', background: '#fff',
            width: c.s, height: c.s, opacity: c.o,
            top:    (c as { t?: number }).t,
            right:  (c as { r?: number }).r,
            bottom: (c as { b?: number }).b,
            left:   (c as { l?: number }).l,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display:       'flex',
            alignItems:    isMobile ? 'flex-start' : 'center',
            gap:           16,
            marginBottom:  20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <DollarCircleFilled style={{ fontSize: 28, color: '#fff' }} />
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                To'lovlar
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {pending.length} ta kutilayotgan to'lov
                {totalAmount > 0 && ` · ${fmt(totalAmount)} so'm`}
              </p>
            </div>

            {!isMobile && (
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: "Kutmoqda",   val: `${pending.length} ta`,     color: '#fadb14' },
                  { label: "Jami summa", val: `${fmt(totalAmount)} so'm`, color: '#95f985' },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '8px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.2)', fontSize: 13,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: i === 0 ? 20 : 14, lineHeight: 1, color: s.color }}>
                      {s.val}
                    </div>
                    <div style={{ fontSize: 10, opacity: .7, color: '#fff' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Button
                icon={<ReloadOutlined />}
                size="large"
                loading={loading}
                onClick={fetchPending}
                style={{
                  background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 10,
                }}
              />
              <Button
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setCreateOpen(true)}
                style={{
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: '#fff', borderRadius: 10, fontWeight: 600,
                }}
              >
                {!isMobile && "To'lov qo'shish"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        size={isMobile ? 'middle' : 'large'}
        style={{
          background:   token.colorBgContainer,
          borderRadius: 16,
          padding:      isMobile ? '0 12px 16px' : '0 24px 24px',
          border:       `1.5px solid ${token.colorBorderSecondary}`,
          boxShadow:    '0 2px 8px rgba(0,0,0,0.04)',
        }}
        items={[
          {
            key: 'pending',
            label: (
              <span>
                <ClockCircleFilled style={{ color: '#fa8c16', marginRight: 6 }} />
                Kutilayotgan
                {pending.length > 0 && (
                  <span style={{
                    marginLeft: 6, background: '#fa8c16', color: '#fff',
                    borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 7px',
                  }}>
                    {pending.length}
                  </span>
                )}
              </span>
            ),
            children: (
              <PendingTab
                pending={pending}
                loading={loading}
                approveId={approveId}
                isMobile={isMobile}
                token={token}
                onApprove={handleApprove}
                onViewRental={setDetailId}
              />
            ),
          },
          {
            key: 'lookup',
            label: (
              <span>
                <SearchOutlined style={{ marginRight: 6 }} />
                Ijara bo'yicha
              </span>
            ),
            children: (
              <LookupTab
                isMobile={isMobile}
                token={token}
                lookupId={lookupId}
                lookupLoading={lookupLoading}
                lookupResult={lookupResult}
                lookupError={lookupError}
                lookupSearched={lookupSearched}
                onIdChange={(v) => {
                  setLookupId(v)
                  setLookupResult(null)
                  setLookupError(null)
                  setLookupSearched(false)
                }}
                onSearch={handleLookup}
                onViewRental={setDetailId}
                onCreatePayment={() => setCreateOpen(true)}
              />
            ),
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined style={{ marginRight: 6 }} />
                Tarix
              </span>
            ),
            children: (
              <HistoryTab
                data={histData}
                loading={histLoading}
                total={histTotal}
                page={histPage}
                pageSize={HIST_PAGE_SIZE}
                statusFilter={histStatus}
                isMobile={isMobile}
                token={token}
                onStatusChange={(s) => {
                  setHistStatus(s)
                  setHistPage(1)
                  fetchHistory(1, s)
                }}
                onPageChange={(p) => {
                  setHistPage(p)
                  fetchHistory(p, histStatus)
                }}
                onRefund={setRefundId}
                onViewRental={setDetailId}
              />
            ),
          },
        ]}
      />

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <CreatePaymentModal
        open={createOpen}
        initialRentalId={lookupId ?? undefined}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); fetchPending() }}
      />

      <RentalDetailDrawer
        rentalId={detailId}
        onClose={() => setDetailId(null)}
        onSuccess={fetchPending}
      />

      <RefundModal
        paymentId={refundId}
        loading={refundLoading}
        onClose={() => setRefundId(null)}
        onConfirm={handleRefund}
      />
    </div>
  )
}

// ── Pending Payments Tab ──────────────────────────────────────────────────────

interface PendingTabProps {
  pending:      PendingPaymentDto[]
  loading:      boolean
  approveId:    number | null
  isMobile:     boolean
  token:        ReturnType<typeof theme.useToken>['token']
  onApprove:    (id: number) => void
  onViewRental: (id: number) => void
}

function PendingTab({ pending, loading, approveId, isMobile, token, onApprove, onViewRental }: PendingTabProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
        <Spin size="large" />
        <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Yuklanmoqda...</span>
      </div>
    )
  }

  if (pending.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: token.colorTextSecondary }}>
            <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
            Barcha to'lovlar tasdiqlangan!
          </span>
        }
        style={{ padding: '48px 0' }}
      />
    )
  }

  const cols = isMobile ? 1 : typeof window !== 'undefined' && window.innerWidth < 1200 ? 2 : 3

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: token.colorTextSecondary }}>
        <strong style={{ color: token.colorText }}>{pending.length}</strong> ta to'lov tasdig'ini kutmoqda
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 12 : 16 }}>
        {pending.map(p => (
          <PendingCard
            key={p.paymentId}
            item={p}
            isMobile={isMobile}
            token={token}
            approving={approveId === p.paymentId}
            onApprove={() => onApprove(p.paymentId)}
            onViewRental={() => onViewRental(p.rentalId)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Pending Card ──────────────────────────────────────────────────────────────

interface PendingCardProps {
  item:         PendingPaymentDto
  isMobile:     boolean
  token:        ReturnType<typeof theme.useToken>['token']
  approving:    boolean
  onApprove:    () => void
  onViewRental: () => void
}

function PendingCard({ item, isMobile, token, approving, onApprove, onViewRental }: PendingCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   token.colorBgContainer,
        borderRadius: 14,
        border:       `1.5px solid ${hovered ? '#fa8c16' : token.colorBorderSecondary}`,
        overflow:     'hidden',
        transform:    hovered ? 'translateY(-2px)' : 'none',
        boxShadow:    hovered
          ? '0 12px 32px rgba(250,140,22,0.18), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{ height: 3, background: 'linear-gradient(90deg,#fa8c16,#ffd666)' }} />

      <div style={{ padding: isMobile ? '12px 13px 13px' : '14px 16px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <Tag color="blue" style={{ fontWeight: 700, fontSize: 12, borderRadius: 6 }}>
            #{item.rentalId}
          </Tag>
          <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {METHOD_LABELS[item.method] ?? item.method}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1677ff', whiteSpace: 'nowrap' }}>
            {fmt(item.amount)} so'm
          </span>
        </div>

        <div style={{
          padding: '7px 10px', borderRadius: 8,
          background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}`,
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: token.colorText }}>👤 {item.customerName}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CarFilled style={{ color: '#1677ff', fontSize: 12, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: token.colorTextSecondary, lineHeight: 1.4 }}>{item.carInfo}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarFilled style={{ color: '#8c8c8c', fontSize: 11, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: token.colorTextTertiary }}>
              {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm')}
            </span>
          </div>
        </div>

        {item.proofUrl && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 6,
            padding: '6px 10px', borderRadius: 8,
            background: 'rgba(22,119,255,0.05)', border: '1px solid rgba(22,119,255,0.15)',
            marginBottom: 10,
          }}>
            <FileImageOutlined style={{ color: '#1677ff', marginTop: 2, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 2 }}>To'lov isboti</div>
              {item.proofUrl.startsWith('http') ? (
                <a href={item.proofUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#1677ff', wordBreak: 'break-all' }}
                  onClick={e => e.stopPropagation()}
                >
                  🔗 Havolani ochish
                </a>
              ) : (
                <span style={{ fontSize: 11, color: token.colorTextSecondary }}>{item.proofUrl}</span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={onViewRental} style={{ flex: 1, borderRadius: 8 }}>
            Ijara
          </Button>
          <Button
            type="primary" size="small" icon={<CheckOutlined />}
            loading={approving} onClick={onApprove}
            style={{ flex: 2, borderRadius: 8, background: '#52c41a', borderColor: '#52c41a', fontWeight: 600 }}
          >
            {approving ? 'Tasdiqlanmoqda...' : 'Tasdiqlash'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Lookup Tab ────────────────────────────────────────────────────────────────

interface LookupTabProps {
  isMobile:       boolean
  token:          ReturnType<typeof theme.useToken>['token']
  lookupId:       number | null
  lookupLoading:  boolean
  lookupResult:   PaymentDto | null
  lookupError:    string | null
  lookupSearched: boolean
  onIdChange:     (v: number | null) => void
  onSearch:       () => void
  onViewRental:   (id: number) => void
  onCreatePayment:() => void
}

function LookupTab({
  isMobile, token, lookupId, lookupLoading, lookupResult,
  lookupError, lookupSearched, onIdChange, onSearch, onViewRental, onCreatePayment,
}: LookupTabProps) {
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: token.colorText, marginBottom: 8 }}>
          Ijara ID bo'yicha to'lov topish
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <InputNumber
            min={1} value={lookupId} onChange={onIdChange}
            placeholder="Ijara ID kiriting..." size="large"
            style={{ flex: 1 }} onPressEnter={onSearch}
          />
          <Button
            type="primary" size="large" icon={<SearchOutlined />}
            loading={lookupLoading} onClick={onSearch} disabled={!lookupId}
            style={{ borderRadius: 8, minWidth: 100 }}
          >
            Qidirish
          </Button>
        </div>
      </div>

      {lookupLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      )}

      {!lookupLoading && lookupError && (
        <Alert
          type={lookupError.includes('topilmadi') ? 'info' : 'error'}
          message={lookupError}
          style={{ borderRadius: 10, marginBottom: 16 }}
          action={
            lookupError.includes('topilmadi') && lookupId ? (
              <Button size="small" type="primary" onClick={onCreatePayment}>
                To'lov qo'shish
              </Button>
            ) : undefined
          }
        />
      )}

      {!lookupLoading && lookupResult && (
        <PaymentResultCard
          payment={lookupResult}
          token={token}
          isMobile={isMobile}
          onViewRental={() => onViewRental(lookupResult.rentalId)}
        />
      )}

      {!lookupLoading && !lookupSearched && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: token.colorTextTertiary, fontSize: 13 }}>
          <SearchOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block', opacity: .3 }} />
          Ijara ID kiriting va "Qidirish" tugmasini bosing
        </div>
      )}
    </div>
  )
}

// ── Payment Result Card ───────────────────────────────────────────────────────

interface PaymentResultCardProps {
  payment:      PaymentDto
  token:        ReturnType<typeof theme.useToken>['token']
  isMobile:     boolean
  onViewRental: () => void
}

function PaymentResultCard({ payment, token, onViewRental }: PaymentResultCardProps) {
  const cfg = STATUS_CFG[payment.status]

  return (
    <div style={{
      background: token.colorBgContainer,
      border: `1.5px solid ${cfg.color}50`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: `0 4px 16px ${cfg.color}20`,
    }}>
      <div style={{ height: 4, background: cfg.color }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1677ff' }}>
            {fmt(payment.amount)} so'm
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
          }}>
            {cfg.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 14 }}>
          {[
            { label: "To'lov ID",    val: `#${payment.id}` },
            { label: "Ijara ID",     val: `#${payment.rentalId}` },
            { label: "To'lov usuli", val: METHOD_LABELS[payment.method] ?? payment.method },
            { label: 'Sana',         val: format(new Date(payment.createdAt), 'dd.MM.yyyy HH:mm') },
            ...(payment.transactionId
              ? [{ label: 'Tranzaksiya ID', val: payment.transactionId }]
              : []),
          ].map((row, i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 1 }}>{row.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: token.colorText }}>{row.val}</div>
            </div>
          ))}
        </div>

        <Button icon={<EyeOutlined />} onClick={onViewRental} block style={{ borderRadius: 8 }}>
          Ijarani ko'rish
        </Button>
      </div>
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

interface HistoryTabProps {
  data:           PaymentHistoryDto[]
  loading:        boolean
  total:          number
  page:           number
  pageSize:       number
  statusFilter:   PaymentStatus | undefined
  isMobile:       boolean
  token:          ReturnType<typeof theme.useToken>['token']
  onStatusChange: (s: PaymentStatus | undefined) => void
  onPageChange:   (p: number) => void
  onRefund:       (id: number) => void
  onViewRental:   (id: number) => void
}

const HIST_STATUSES: Array<{ key: PaymentStatus | undefined; label: string; color: string }> = [
  { key: undefined,    label: 'Barchasi',   color: '#1677ff' },
  { key: 'Pending',    label: 'Kutilmoqda', color: '#fa8c16' },
  { key: 'Paid',       label: "To'langan",  color: '#52c41a' },
  { key: 'Refunded',   label: 'Qaytarildi', color: '#722ed1' },
  { key: 'Failed',     label: 'Xato',       color: '#ff4d4f' },
]

function HistoryTab({
  data, loading, total, page, pageSize, statusFilter,
  isMobile, token, onStatusChange, onPageChange, onRefund, onViewRental,
}: HistoryTabProps) {
  return (
    <div>
      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {HIST_STATUSES.map(s => {
          const active = statusFilter === s.key
          return (
            <button
              key={s.key ?? 'all'}
              onClick={() => onStatusChange(s.key)}
              style={{
                padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${active ? s.color : token.colorBorderSecondary}`,
                background: active ? `${s.color}18` : 'transparent',
                color: active ? s.color : token.colorTextSecondary,
                fontWeight: active ? 700 : 500, fontSize: 12,
                transition: 'all 0.18s',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large" />
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Yuklanmoqda...</span>
        </div>
      ) : data.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: token.colorTextSecondary }}>To'lovlar topilmadi</span>}
          style={{ padding: '48px 0' }}
        />
      ) : (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, color: token.colorTextSecondary }}>
            Jami: <strong style={{ color: token.colorText }}>{total}</strong> ta to'lov
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? 12 : 16,
            marginBottom: 24,
          }}>
            {data.map(p => (
              <HistoryCard
                key={p.paymentId}
                item={p}
                isMobile={isMobile}
                token={token}
                onRefund={() => onRefund(p.paymentId)}
                onViewRental={() => onViewRental(p.rentalId)}
              />
            ))}
          </div>

          {total > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={onPageChange}
                showSizeChanger={false}
                showTotal={(t, r) => `${r[0]}–${r[1]} / ${t} ta`}
                size={isMobile ? 'small' : 'default'}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── History Card ──────────────────────────────────────────────────────────────

interface HistoryCardProps {
  item:         PaymentHistoryDto
  isMobile:     boolean
  token:        ReturnType<typeof theme.useToken>['token']
  onRefund:     () => void
  onViewRental: () => void
}

function HistoryCard({ item, isMobile, token, onRefund, onViewRental }: HistoryCardProps) {
  const cfg = STATUS_CFG[item.status]
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   token.colorBgContainer,
        borderRadius: 14,
        border:       `1.5px solid ${hovered ? cfg.color + '80' : token.colorBorderSecondary}`,
        overflow:     'hidden',
        transform:    hovered ? 'translateY(-2px)' : 'none',
        boxShadow:    hovered ? `0 8px 24px ${cfg.color}20` : '0 2px 8px rgba(0,0,0,0.04)',
        transition:   'all 0.2s',
      }}
    >
      {/* Top status bar */}
      <div style={{ height: 3, background: cfg.color }} />

      <div style={{ padding: isMobile ? '12px 13px' : '14px 16px' }}>
        {/* Amount + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1677ff' }}>
            {fmt(item.amount)} so'm
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
          }}>
            {cfg.label}
          </span>
        </div>

        {/* Method + rental ID */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <Tag color="blue" style={{ fontWeight: 600, fontSize: 11, borderRadius: 6 }}>
            #{item.rentalId}
          </Tag>
          <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {METHOD_LABELS[item.method] ?? item.method}
          </span>
        </div>

        {/* Customer + car */}
        <div style={{
          padding: '7px 10px', borderRadius: 8, marginBottom: 8,
          background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: token.colorText }}>👤 {item.customerName}</div>
          <div style={{ fontSize: 11, color: token.colorTextSecondary, marginTop: 2 }}>🚗 {item.carInfo}</div>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarFilled style={{ fontSize: 10, color: '#8c8c8c' }} />
            <span style={{ fontSize: 11, color: token.colorTextTertiary }}>
              {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm')}
            </span>
          </div>
          {item.paidAt && (
            <div style={{ fontSize: 11, color: '#52c41a' }}>
              ✓ To'landi: {format(new Date(item.paidAt), 'dd.MM.yyyy HH:mm')}
            </div>
          )}
          {item.refundedAt && (
            <div style={{ fontSize: 11, color: '#722ed1' }}>
              ↩ Qaytarildi: {format(new Date(item.refundedAt), 'dd.MM.yyyy HH:mm')}
            </div>
          )}
          {item.refundReason && (
            <div style={{ fontSize: 11, color: '#722ed1', fontStyle: 'italic', marginTop: 2 }}>
              "{item.refundReason}"
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={onViewRental} style={{ flex: 1, borderRadius: 8 }}>
            Ijara
          </Button>
          {item.status === 'Paid' && (
            <Button
              size="small" danger icon={<RollbackOutlined />}
              onClick={onRefund}
              style={{ flex: 1, borderRadius: 8 }}
            >
              Qaytarish
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Refund Modal ──────────────────────────────────────────────────────────────

interface RefundModalProps {
  paymentId: number | null
  loading:   boolean
  onClose:   () => void
  onConfirm: (paymentId: number, reason: string) => void
}

function RefundModal({ paymentId, loading, onClose, onConfirm }: RefundModalProps) {
  const [reason, setReason] = useState('')

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Modal
      open={!!paymentId}
      title={
        <span>
          <RollbackOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          To'lovni qaytarish
        </span>
      }
      onCancel={handleClose}
      footer={null}
      width={440}
      centered
      destroyOnClose
    >
      <div style={{ padding: '8px 0' }}>
        <div style={{ marginBottom: 12, fontSize: 13, color: '#8c8c8c' }}>
          To'lov <strong>#{paymentId}</strong> ni qaytarishning sababini yozing.
        </div>
        <Input.TextArea
          rows={4}
          placeholder="Qaytarish sababi..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={500}
          showCount
          style={{ borderRadius: 8 }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <Button onClick={handleClose}>Bekor</Button>
          <Button
            danger
            loading={loading}
            disabled={!reason.trim()}
            onClick={() => paymentId && onConfirm(paymentId, reason.trim())}
          >
            Qaytarish
          </Button>
        </div>
      </div>
    </Modal>
  )
}
