import { useState, useEffect, useCallback } from 'react'
import { Spin, Empty, Grid, theme } from 'antd'
import {
  FileTextFilled, CalendarFilled, WarningFilled,
  DollarCircleFilled, CheckCircleFilled, ClockCircleFilled,
  CloseCircleFilled, CarFilled,
} from '@ant-design/icons'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { usersApi } from '@/api/usersApi'
import type { UserFullHistoryDto } from '@/types/users'

const { useBreakpoint } = Grid
const fmt = (n: number) => n.toLocaleString('ru-RU')

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  Active:     { color: '#16a34a', bg: 'rgba(22,164,74,0.1)',   label: 'Aktiv',       icon: <CheckCircleFilled /> },
  Completed:  { color: '#2563eb', bg: 'rgba(37,99,235,0.1)',   label: 'Yakunlangan', icon: <CheckCircleFilled /> },
  Pending:    { color: '#ea580c', bg: 'rgba(234,88,12,0.1)',   label: 'Kutilmoqda',  icon: <ClockCircleFilled /> },
  Cancelled:  { color: '#e11d48', bg: 'rgba(225,29,72,0.1)',   label: 'Bekor',       icon: <CloseCircleFilled /> },
  Confirmed:  { color: '#16a34a', bg: 'rgba(22,164,74,0.1)',   label: 'Tasdiqlangan',icon: <CheckCircleFilled /> },
  Paid:       { color: '#16a34a', bg: 'rgba(22,164,74,0.1)',   label: "To'langan",   icon: <CheckCircleFilled /> },
  Unpaid:     { color: '#e11d48', bg: 'rgba(225,29,72,0.1)',   label: "To'lanmagan", icon: <CloseCircleFilled /> },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: status, icon: null }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, gradient, isDark }: {
  icon: React.ReactNode; label: string; value: React.ReactNode
  sub?: string; gradient: string; isDark: boolean
}) {
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      borderRadius: 16, padding: '16px',
      border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: gradient, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20, color: '#fff',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: isDark ? '#f1f5f9' : '#1e293b' }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8', marginTop: 1 }}>{sub}</div>}
        <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

// ── Row item ──────────────────────────────────────────────────────────────────
function ActivityRow({ icon, title, sub, right, rightSub, status, gradient }: {
  icon: React.ReactNode; title: string; sub: string
  right: string; rightSub?: string; status?: string; gradient: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: gradient, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 17, color: '#fff',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{right}</div>
        {rightSub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{rightSub}</div>}
        {status && <div style={{ marginTop: 3 }}><StatusPill status={status} /></div>}
      </div>
    </div>
  )
}

// ── Section box ───────────────────────────────────────────────────────────────
function SectionBox({ title, icon, count, children, isDark, empty }: {
  title: string; icon: React.ReactNode; count?: number
  children: React.ReactNode; isDark: boolean; empty?: boolean
}) {
  const { token } = theme.useToken()
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      borderRadius: 20, padding: '18px',
      border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: empty ? 16 : 4 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: isDark ? '#f1f5f9' : '#1e293b' }}>{title}</span>
        {count !== undefined && count > 0 && (
          <span style={{
            background: token.colorPrimary, color: '#fff',
            fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '1px 8px',
          }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function MyActivityPage() {
  const screens  = useBreakpoint()
  const isMobile = !screens.md
  const isDark   = useThemeStore(s => s.isDark)
  const { userId } = useAuthStore()

  const [history,  setHistory]  = useState<UserFullHistoryDto | null>(null)
  const [loading,  setLoading]  = useState(true)

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

  if (!history) return null

  const gap = isMobile ? 12 : 16
  const tabs: { key: typeof activeTab; label: string; count: number }[] = [
    { key: 'rentals',      label: 'Ijaralar',    count: history.totalRentals },
    { key: 'reservations', label: 'Bronlar',     count: history.totalReservations },
    { key: 'fines',        label: 'Jarimalar',   count: history.totalFines },
    { key: 'payments',     label: "To'lovlar",   count: history.payments?.length ?? 0 },
  ]

  return (
    <div style={{ paddingBottom: isMobile ? 90 : 32, maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{
        background:   'linear-gradient(135deg,#1e40af,#4f46e5)',
        borderRadius: 20, padding: isMobile ? '18px 16px' : '24px 28px',
        marginBottom: gap, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>
          📋 Faoliyat tarixi
        </div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 20 : 24 }}>
          {history.fullName}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
          {history.email}
        </div>
      </div>

      {/* ── Stats 2×2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap, marginBottom: gap }}>
        <StatCard isDark={isDark} icon={<FileTextFilled />}     label="Jami ijaralar"   value={history.totalRentals}     gradient="linear-gradient(135deg,#2563eb,#1d4ed8)" />
        <StatCard isDark={isDark} icon={<CheckCircleFilled />}  label="Yakunlangan"     value={history.completedRentals} gradient="linear-gradient(135deg,#16a34a,#15803d)" />
        <StatCard isDark={isDark} icon={<DollarCircleFilled />} label="Jami to'langan"  value={`${fmt(history.totalSpent)}`} sub="so'm" gradient="linear-gradient(135deg,#7c3aed,#6d28d9)" />
        <StatCard isDark={isDark} icon={<WarningFilled />}      label="Jarimalar"       value={history.totalFines}       gradient="linear-gradient(135deg,#e11d48,#be123c)" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: gap, overflowX: 'auto', paddingBottom: 2 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
              border: activeTab === t.key ? '1.5px solid #2563eb' : `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              background: activeTab === t.key ? (isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff') : (isDark ? '#1e293b' : '#fff'),
              color: activeTab === t.key ? '#2563eb' : (isDark ? '#94a3b8' : '#64748b'),
              fontWeight: activeTab === t.key ? 700 : 500, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                background: activeTab === t.key ? '#2563eb' : (isDark ? '#334155' : '#e2e8f0'),
                color: activeTab === t.key ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
                borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 7px',
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {/* Ijaralar */}
      {activeTab === 'rentals' && (
        <SectionBox title="Ijaralar" icon={<FileTextFilled style={{ color: '#2563eb' }} />} count={history.totalRentals} isDark={isDark} empty={history.rentals.length === 0}>
          {history.rentals.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ijaralar yo'q" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {history.rentals.map((r, i) => (
                <div key={r.id} style={{ borderBottom: i < history.rentals.length - 1 ? `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` : 'none' }}>
                  <ActivityRow
                    icon={<CarFilled />}
                    gradient="linear-gradient(135deg,#2563eb,#1d4ed8)"
                    title={`${r.carBrand} ${r.carModel} · ${r.licensePlate}`}
                    sub={`${format(new Date(r.startDate), 'dd.MM.yyyy')} → ${format(new Date(r.endDate), 'dd.MM.yyyy')} · ${r.totalDays} kun · ${r.pickupBranch}`}
                    right={`${fmt(r.totalAmount)} so'm`}
                    status={r.status}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionBox>
      )}

      {/* Bronlar */}
      {activeTab === 'reservations' && (
        <SectionBox title="Bronlar" icon={<CalendarFilled style={{ color: '#7c3aed' }} />} count={history.totalReservations} isDark={isDark} empty={history.reservations.length === 0}>
          {history.reservations.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bronlar yo'q" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {history.reservations.map((r, i) => (
                <div key={r.id} style={{ borderBottom: i < history.reservations.length - 1 ? `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` : 'none' }}>
                  <ActivityRow
                    icon={<CalendarFilled />}
                    gradient="linear-gradient(135deg,#7c3aed,#6d28d9)"
                    title={`${r.carBrand} ${r.carModel} · ${r.licensePlate}`}
                    sub={`${format(new Date(r.startDate), 'dd.MM.yyyy')} → ${format(new Date(r.endDate), 'dd.MM.yyyy')} · ${r.totalDays} kun`}
                    right={r.estimatedAmount ? `${fmt(r.estimatedAmount)} so'm` : '—'}
                    status={r.status}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionBox>
      )}

      {/* Jarimalar */}
      {activeTab === 'fines' && (
        <SectionBox title="Jarimalar" icon={<WarningFilled style={{ color: '#e11d48' }} />} count={history.totalFines} isDark={isDark} empty={history.fines.length === 0}>
          {history.fines.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Jarimalar yo'q" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {history.fines.map((f, i) => (
                <div key={f.id} style={{ borderBottom: i < history.fines.length - 1 ? `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` : 'none' }}>
                  <ActivityRow
                    icon={<WarningFilled />}
                    gradient="linear-gradient(135deg,#e11d48,#be123c)"
                    title={f.description}
                    sub={`${format(new Date(f.issuedDate), 'dd.MM.yyyy')}${f.paidDate ? ` · To'langan: ${format(new Date(f.paidDate), 'dd.MM.yyyy')}` : ''}`}
                    right={`${fmt(f.amount)} so'm`}
                    status={f.status}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionBox>
      )}

      {/* To'lovlar */}
      {activeTab === 'payments' && (
        <SectionBox title="To'lovlar" icon={<DollarCircleFilled style={{ color: '#16a34a' }} />} count={history.payments?.length} isDark={isDark} empty={!history.payments?.length}>
          {!history.payments?.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="To'lovlar yo'q" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {history.payments.map((p, i) => (
                <div key={p.id} style={{ borderBottom: i < history.payments.length - 1 ? `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` : 'none' }}>
                  <ActivityRow
                    icon={<DollarCircleFilled />}
                    gradient="linear-gradient(135deg,#16a34a,#15803d)"
                    title={`Ijara #${p.rentalId} · ${p.paymentMethod}`}
                    sub={format(new Date(p.paidAt), 'dd.MM.yyyy HH:mm')}
                    right={`${fmt(p.amount)} so'm`}
                    status={p.status}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionBox>
      )}
    </div>
  )
}
