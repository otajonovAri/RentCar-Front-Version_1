import { useState, useEffect, useCallback } from 'react'
import { Spin, Empty, Grid, theme as antTheme } from 'antd'
import {
  FileTextFilled, CalendarFilled, WarningFilled,
  DollarCircleFilled, CarFilled,
} from '@ant-design/icons'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { usersApi } from '@/api/usersApi'
import type { UserFullHistoryDto } from '@/types/users'

const { useBreakpoint } = Grid
const fmt = (n: number) => n.toLocaleString('ru-RU')

// ── Status pill ───────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  Active:     { color: '#16a34a', bg: 'rgba(22,164,74,0.12)',  label: 'Aktiv'        },
  Completed:  { color: '#2563eb', bg: 'rgba(37,99,235,0.12)',  label: 'Yakunlangan'  },
  Pending:    { color: '#ea580c', bg: 'rgba(234,88,12,0.12)',  label: 'Kutilmoqda'   },
  Cancelled:  { color: '#e11d48', bg: 'rgba(225,29,72,0.12)',  label: 'Bekor'        },
  Confirmed:  { color: '#16a34a', bg: 'rgba(22,164,74,0.12)',  label: 'Tasdiqlangan' },
  Paid:       { color: '#16a34a', bg: 'rgba(22,164,74,0.12)',  label: "To'langan"    },
  Unpaid:     { color: '#e11d48', bg: 'rgba(225,29,72,0.12)',  label: "To'lanmagan"  },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: status }
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          4,
      padding:      '3px 8px',
      borderRadius: 20,
      fontSize:     10,
      fontWeight:   700,
      background:   cfg.bg,
      color:        cfg.color,
      whiteSpace:   'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: cfg.color, flexShrink: 0,
        display: 'inline-block',
      }} />
      {cfg.label}
    </span>
  )
}

// ── Stat card — vertical, mobile-first ───────────────────────────────────────
function StatCard({ emoji, label, value, color, isDark }: {
  emoji: string; label: string; value: string | number; color: string; isDark: boolean
}) {
  return (
    <div style={{
      background:    isDark ? '#1e293b' : '#fff',
      borderRadius:  16,
      padding:       '14px',
      border:        `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      boxShadow:     isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.05)',
      display:       'flex',
      flexDirection: 'column',
      gap:           5,
    }}>
      <div style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, marginTop: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', fontWeight: 500, lineHeight: 1.3 }}>
        {label}
      </div>
    </div>
  )
}

// ── Row item ──────────────────────────────────────────────────────────────────
function ActivityRow({ icon, title, date, amount, status, gradient, isDark }: {
  icon:      React.ReactNode
  title:     string
  date:      string
  amount:    string
  status?:   string
  gradient:  string
  isDark:    boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>

      {/* Icon bubble */}
      <div style={{
        width:          38,
        height:         38,
        borderRadius:   11,
        flexShrink:     0,
        background:     gradient,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       16,
        color:          '#fff',
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight:   600,
          fontSize:     13,
          color:        isDark ? '#f1f5f9' : '#1e293b',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {title}
        </div>
        <div style={{
          fontSize:     11,
          color:        isDark ? '#64748b' : '#94a3b8',
          marginTop:    2,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {date}
        </div>
      </div>

      {/* Amount + status */}
      <div style={{ textAlign: 'right', flexShrink: 0, maxWidth: 110 }}>
        <div style={{
          fontWeight:   700,
          fontSize:     12,
          color:        isDark ? '#f1f5f9' : '#1e293b',
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {amount}
        </div>
        {status && (
          <div style={{ marginTop: 4 }}>
            <StatusPill status={status} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section box ───────────────────────────────────────────────────────────────
function SectionBox({ title, icon, count, children, isDark }: {
  title: string; icon: React.ReactNode; count?: number
  children: React.ReactNode; isDark: boolean
}) {
  const { token } = antTheme.useToken()
  return (
    <div style={{
      background:   isDark ? '#1e293b' : '#fff',
      borderRadius: 20,
      padding:      '16px',
      border:       `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      boxShadow:    isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#f1f5f9' : '#1e293b' }}>
          {title}
        </span>
        {!!count && (
          <span style={{
            background: token.colorPrimary, color: '#fff',
            fontSize: 10, fontWeight: 700,
            borderRadius: 20, padding: '1px 7px',
          }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Divider between rows ──────────────────────────────────────────────────────
function Divider({ isDark }: { isDark: boolean }) {
  return <div style={{ height: 1, background: isDark ? '#334155' : '#f1f5f9', margin: '0 2px' }} />
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function MyActivityPage() {
  const screens    = useBreakpoint()
  const isMobile   = !screens.md
  const isDark     = useThemeStore(s => s.isDark)
  const { userId, fullName, email } = useAuthStore()

  const [history,   setHistory]   = useState<UserFullHistoryDto | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<'rentals' | 'reservations' | 'fines' | 'payments'>('rentals')

  const fetchHistory = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await usersApi.getFullHistory(userId)
      setHistory(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  const gap              = isMobile ? 12 : 16
  const totalRentals     = history?.totalRentals      ?? 0
  const completedRentals = history?.completedRentals  ?? 0
  const totalSpent       = history?.totalSpent        ?? 0
  const totalFines       = history?.totalFines        ?? 0
  const totalRes         = history?.totalReservations ?? 0
  const paymentsLen      = history?.payments?.length  ?? 0

  const tabs: { key: typeof activeTab; label: string; count: number }[] = [
    { key: 'rentals',      label: 'Ijaralar',  count: totalRentals },
    { key: 'reservations', label: 'Bronlar',   count: totalRes     },
    { key: 'fines',        label: 'Jarimalar', count: totalFines   },
    { key: 'payments',     label: "To'lovlar", count: paymentsLen  },
  ]

  return (
    <div style={{ paddingBottom: isMobile ? 90 : 32, maxWidth: 900, margin: '0 auto' }}>

      {/* ── Hero ── */}
      <div style={{
        background:   'linear-gradient(135deg,#1e40af 0%,#4f46e5 60%,#7c3aed 100%)',
        borderRadius: 20,
        padding:      isMobile ? '18px 16px' : '24px 28px',
        marginBottom: gap,
        position:     'relative',
        overflow:     'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
            📋 Faoliyat tarixi
          </div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 18 : 22, lineHeight: 1.2 }}>
            {history?.fullName ?? fullName ?? '—'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 }}>
            {history?.email ?? email ?? ''}
          </div>
        </div>
      </div>

      {/* ── Stats 2×2 ── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)',
        gap,
        marginBottom:        gap,
      }}>
        <StatCard emoji="🚗" label="Jami ijaralar"   value={totalRentals}     color="#2563eb" isDark={isDark} />
        <StatCard emoji="✅" label="Yakunlangan"     value={completedRentals} color="#16a34a" isDark={isDark} />
        <StatCard emoji="💰" label="Sarflangan so'm" value={fmt(totalSpent)}  color="#7c3aed" isDark={isDark} />
        <StatCard emoji="⚠️" label="Jarimalar"       value={totalFines}       color="#e11d48" isDark={isDark} />
      </div>

      {/* ── Tabs (scrollable, hidden scrollbar) ── */}
      <div
        className="activity-tab-bar"
        style={{
          display:       'flex',
          gap:           6,
          marginBottom:  gap,
          overflowX:     'auto',
          paddingBottom: 4,
        }}
      >
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          6,
              padding:      '8px 14px',
              borderRadius: 20,
              whiteSpace:   'nowrap',
              flexShrink:   0,
              border:       activeTab === t.key
                ? '1.5px solid #2563eb'
                : `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              background:   activeTab === t.key
                ? (isDark ? 'rgba(37,99,235,0.2)' : '#eff6ff')
                : (isDark ? '#1e293b' : '#fff'),
              color:        activeTab === t.key ? '#2563eb' : (isDark ? '#94a3b8' : '#64748b'),
              fontWeight:   activeTab === t.key ? 700 : 500,
              fontSize:     13,
              cursor:       'pointer',
              transition:   'all 0.15s',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                background:   activeTab === t.key ? '#2563eb' : (isDark ? '#334155' : '#f1f5f9'),
                color:        activeTab === t.key ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
                borderRadius: 10,
                fontSize:     10,
                fontWeight:   700,
                padding:      '1px 6px',
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Ijaralar ── */}
      {activeTab === 'rentals' && (
        <SectionBox
          title="Ijaralar"
          icon={<FileTextFilled style={{ color: '#2563eb' }} />}
          count={totalRentals}
          isDark={isDark}
        >
          {!history?.rentals?.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ijaralar yo'q" style={{ marginTop: 12 }} />
          ) : history.rentals.map((r, i) => (
            <div key={r.id}>
              <ActivityRow
                isDark={isDark}
                icon={<CarFilled />}
                gradient="linear-gradient(135deg,#2563eb,#1d4ed8)"
                title={`${r.carBrand} ${r.carModel} · ${r.licensePlate}`}
                date={`${format(new Date(r.startDate), 'dd.MM.yy')} – ${format(new Date(r.endDate), 'dd.MM.yy')} · ${r.totalDays} kun`}
                amount={`${fmt(r.totalAmount)} so'm`}
                status={r.status}
              />
              {i < history.rentals.length - 1 && <Divider isDark={isDark} />}
            </div>
          ))}
        </SectionBox>
      )}

      {/* ── Bronlar ── */}
      {activeTab === 'reservations' && (
        <SectionBox
          title="Bronlar"
          icon={<CalendarFilled style={{ color: '#7c3aed' }} />}
          count={totalRes}
          isDark={isDark}
        >
          {!history?.reservations?.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bronlar yo'q" style={{ marginTop: 12 }} />
          ) : history.reservations.map((r, i) => (
            <div key={r.id}>
              <ActivityRow
                isDark={isDark}
                icon={<CalendarFilled />}
                gradient="linear-gradient(135deg,#7c3aed,#6d28d9)"
                title={`${r.carBrand} ${r.carModel} · ${r.licensePlate}`}
                date={`${format(new Date(r.startDate), 'dd.MM.yy')} – ${format(new Date(r.endDate), 'dd.MM.yy')} · ${r.totalDays} kun`}
                amount={r.estimatedAmount ? `${fmt(r.estimatedAmount)} so'm` : '—'}
                status={r.status}
              />
              {i < history.reservations.length - 1 && <Divider isDark={isDark} />}
            </div>
          ))}
        </SectionBox>
      )}

      {/* ── Jarimalar ── */}
      {activeTab === 'fines' && (
        <SectionBox
          title="Jarimalar"
          icon={<WarningFilled style={{ color: '#e11d48' }} />}
          count={totalFines}
          isDark={isDark}
        >
          {!history?.fines?.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Jarimalar yo'q" style={{ marginTop: 12 }} />
          ) : history.fines.map((f, i) => (
            <div key={f.id}>
              <ActivityRow
                isDark={isDark}
                icon={<WarningFilled />}
                gradient="linear-gradient(135deg,#e11d48,#be123c)"
                title={f.description}
                date={format(new Date(f.issuedDate), 'dd.MM.yyyy')}
                amount={`${fmt(f.amount)} so'm`}
                status={f.status}
              />
              {i < history.fines.length - 1 && <Divider isDark={isDark} />}
            </div>
          ))}
        </SectionBox>
      )}

      {/* ── To'lovlar ── */}
      {activeTab === 'payments' && (
        <SectionBox
          title="To'lovlar"
          icon={<DollarCircleFilled style={{ color: '#16a34a' }} />}
          count={paymentsLen}
          isDark={isDark}
        >
          {!history?.payments?.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="To'lovlar yo'q" style={{ marginTop: 12 }} />
          ) : history.payments.map((p, i) => (
            <div key={p.id}>
              <ActivityRow
                isDark={isDark}
                icon={<DollarCircleFilled />}
                gradient="linear-gradient(135deg,#16a34a,#15803d)"
                title={`${p.paymentMethod} · Ijara #${p.rentalId}`}
                date={format(new Date(p.paidAt), 'dd.MM.yyyy HH:mm')}
                amount={`${fmt(p.amount)} so'm`}
                status={p.status}
              />
              {i < history.payments!.length - 1 && <Divider isDark={isDark} />}
            </div>
          ))}
        </SectionBox>
      )}
    </div>
  )
}
