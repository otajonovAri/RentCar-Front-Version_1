import { useEffect, useState } from 'react'
import {
  Drawer, Button, Space, Modal, Form, Input,
  DatePicker, message, Divider, Tag, notification, Radio, Alert, theme,
} from 'antd'
import {
  CheckOutlined, CloseOutlined, PlayCircleOutlined, DollarOutlined,
  CarFilled, CarOutlined, FileImageOutlined, WarningOutlined,
  CalendarFilled, ClockCircleFilled, EnvironmentOutlined,
  TeamOutlined, TagsOutlined, CheckCircleFilled,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { rentalsApi } from '@/api/rentalsApi'
import { paymentsApi } from '@/api/paymentsApi'
import type { RentalDto } from '@/types/rentals'
import type { PaymentDto, PaymentMethod } from '@/types/payments'
import StatusBadge from '@/components/shared/StatusBadge'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/useIsMobile'
import { getApiError } from '@/utils/apiError'

// ── To'lov usullari (Payme — alohida katta tugma, bu yerda yo'q) ─────────────
const OTHER_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash',         label: '💵 Naqd pul' },
  { value: 'CreditCard',   label: '💳 Kredit karta' },
  { value: 'DebitCard',    label: '💳 Debit karta' },
  { value: 'BankTransfer', label: "🏦 Bank o'tkazma" },
  { value: 'Online',       label: '🌐 Onlayn' },
]

// To'lov tarixida label ko'rsatish uchun (CLICK/Payme ham bor)
const ALL_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash:         'Naqd pul',
  CreditCard:   'Kredit karta (POS)',
  DebitCard:    'Debit karta (POS)',
  BankTransfer: "Bank o'tkazmasi",
  Online:       'Onlayn',
  Click:        'CLICK',
  Payme:        'Payme',
}

// ── Payme konfiguratsiyasi ────────────────────────────────────────────────────
const PAYME_CONFIG = {
  web:       'https://payme.uz/',
  android:   'intent://payme.uz#Intent;scheme=https;package=uz.paycom;end',
  ios:       'payme://',
  logoLight: 'https://turonbank.uz/bitrix/templates/main/images/cards/payments/payme.png',
  logoDark:  'https://pr.uz/wp-content/uploads/2024/05/photo_2024-05-14_20-27-31.jpg',
  color:     '#00bcd4',
  bg:        '#00bcd4',
}

function openPayme() {
  const cfg      = PAYME_CONFIG
  const isIos    = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const deepLink = isIos ? cfg.ios : cfg.android
  const fallback = setTimeout(() => window.open(cfg.web, '_blank'), 1500)
  const hidden   = document.createElement('iframe')
  hidden.style.display = 'none'
  hidden.src = deepLink
  document.body.appendChild(hidden)
  setTimeout(() => { document.body.removeChild(hidden); clearTimeout(fallback) }, 2000)
}

interface Props {
  rentalId: number | null
  onClose:  () => void
  onSuccess: () => void
}

export default function RentalDetailDrawer({ rentalId, onClose, onSuccess }: Props) {
  const isMobile   = useIsMobile()
  const isDark     = useThemeStore((s) => s.isDark)
  const navigate   = useNavigate()
  const { token }  = theme.useToken()
  const [notifApi, notifCtx] = notification.useNotification()

  const [rental,        setRental]        = useState<RentalDto | null>(null)
  const [payment,       setPayment]       = useState<PaymentDto | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [completeOpen,  setCompleteOpen]  = useState(false)
  const [cancelOpen,    setCancelOpen]    = useState(false)
  const [payOpen,       setPayOpen]       = useState(false)
  const [activateOpen,  setActivateOpen]  = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [proofUrl,       setProofUrl]       = useState('')
  const [actionLoading,  setActionLoading]  = useState(false)

  // Karta to'lovi uchun isbot talab qilinadimi?
  const needsProof = selectedMethod === 'CreditCard' || selectedMethod === 'DebitCard'

  const { hasRole } = useAuthStore()
  const isManager   = hasRole(['Manager', 'Admin', 'SuperAdmin'])

  // ── Ma'lumotlarni yuklash ───────────────────────────────────────────────────
  const loadData = async (id: number) => {
    setLoading(true)
    try {
      const rentalRes = await rentalsApi.getById(id)
      setRental(rentalRes.data)
      try {
        const payRes = await paymentsApi.getByRental(id)
        setPayment(payRes.data)
      } catch {
        setPayment(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (rentalId) loadData(rentalId)
    else { setRental(null); setPayment(null) }
  }, [rentalId])

  // ── Ijarani topshirish (to'lov + faollashtirish) ───────────────────────────
  const handleActivateConfirm = async () => {
    if (!rentalId || !selectedMethod) return
    // To'lov allaqachon yuborilganmi?
    if (payment) {
      notifApi.warning({
        message: "To'lov allaqachon yuborilgan",
        description: payment.status === 'Pending'
          ? "Admin tasdiqlashini kuting. Tasdiqlangandan so'ng ijara faollashtiriladi."
          : "Bu ijara uchun to'lov allaqachon amalga oshirilgan.",
        duration: 6,
      })
      setActivateOpen(false)
      return
    }
    setActionLoading(true)
    // Karta to'lovi uchun isbot majburiy
    if (needsProof && !proofUrl.trim()) {
      notifApi.error({ message: "Karta to'lovi uchun chek yoki isbot URLini kiriting" })
      setActionLoading(false)
      return
    }
    try {
      const isPayme = selectedMethod === 'Payme'
      await paymentsApi.create({
        rentalId,
        method:           selectedMethod,
        transactionId:    proofUrl.trim() || null,
        requiresApproval: !isPayme,   // Payme emas → admin tasdiqlashi kerak
      })

      const closeAndReset = () => {
        setActivateOpen(false)
        setSelectedMethod(null)
        setProofUrl('')
        onSuccess()
        onClose()
      }

      if (isPayme) {
        // Payme orqali — darhol faollashtirish
        await rentalsApi.activate(rentalId)
        closeAndReset()
        notifApi.success({
          message: '✅ Ijara faollashtirildi!',
          description: `Ijara #${rentalId} — Payme orqali to'lov qabul qilindi va ijara boshlandi.`,
          duration: 5,
          icon: <CarOutlined style={{ color: '#52c41a' }} />,
          btn: (
            <Button size="small" type="primary" onClick={() => navigate('/rentals')}>
              Ijaralarni ko'rish
            </Button>
          ),
        })
        setTimeout(() => navigate('/rentals'), 800)
      } else {
        // Boshqa usul — admin tasdiqlashini kutish
        closeAndReset()
        notifApi.info({
          message: "⏳ To'lov ma'lumotlari yuborildi",
          description: `${ALL_METHOD_LABELS[selectedMethod]} orqali to'lov so'rovi adminga yuborildi. Tasdiqlangandan so'ng ijara faollashtiriladi.`,
          duration: 8,
          icon: <CarOutlined style={{ color: '#1677ff' }} />,
          btn: (
            <Button size="small" onClick={() => navigate('/rentals')}>
              Ijaralarni ko'rish
            </Button>
          ),
        })
        setTimeout(() => navigate('/rentals'), 800)
      }
    } catch (err) {
      notifApi.error({ message: getApiError(err, 'Xatolik yuz berdi') })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Admin: pending to'lovni tasdiqlash + ijarani faollashtirish ───────────
  const handleAdminApprove = async () => {
    if (!payment) return
    setActionLoading(true)
    try {
      await paymentsApi.approve(payment.id)
      notifApi.success({ message: "✅ To'lov tasdiqlandi va ijara faollashtirildi!" })
      loadData(rentalId!)
      onSuccess()
    } catch (err) {
      notifApi.error({ message: getApiError(err, 'Tasdiqlashda xatolik yuz berdi') })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Yakunlash ───────────────────────────────────────────────────────────────
  const handleComplete = async (values: {
    actualReturnDate: Dayjs
    carCondition?: string
    damageNotes?: string
    notes?: string
  }) => {
    if (!rentalId) return
    setActionLoading(true)
    try {
      // Mashina holati + shikast eslatmalarini notes ga birlashtirish
      const conditionLabel: Record<string, string> = {
        excellent: "A'lo",
        good:      'Yaxshi',
        fair:      "O'rtacha",
        poor:      'Nuqsonli / Shikastlangan',
      }
      const parts: string[] = []
      if (values.carCondition)
        parts.push(`Mashina holati: ${conditionLabel[values.carCondition] ?? values.carCondition}`)
      if (values.damageNotes?.trim())
        parts.push(`Shikast/eslatma: ${values.damageNotes.trim()}`)
      if (values.notes?.trim())
        parts.push(values.notes.trim())

      await rentalsApi.complete(rentalId, {
        actualReturnDate: values.actualReturnDate.toISOString(),
        notes: parts.length ? parts.join(' | ') : null,
      })
      message.success('Ijara muvaffaqiyatli yakunlandi')
      setCompleteOpen(false)
      loadData(rentalId)
      onSuccess()
    } catch {
      message.error('Yakunlashda xatolik')
    } finally {
      setActionLoading(false)
    }
  }

  // ── Bekor qilish ────────────────────────────────────────────────────────────
  const handleCancel = async (values: { reason: string }) => {
    if (!rentalId) return
    setActionLoading(true)
    try {
      await rentalsApi.cancel(rentalId, { reason: values.reason })
      message.success('Ijara bekor qilindi')
      setCancelOpen(false)
      loadData(rentalId)
      onSuccess()
    } catch {
      message.error('Bekor qilishda xatolik')
    } finally {
      setActionLoading(false)
    }
  }

  // ── Alohida to'lov (Active rentals uchun) ──────────────────────────────────
  const handlePay = async (values: { method: PaymentMethod; transactionId?: string }) => {
    if (!rentalId) return
    setActionLoading(true)
    try {
      await paymentsApi.create({
        rentalId,
        method: values.method,
        transactionId: values.transactionId ?? null,
      })
      message.success("To'lov muvaffaqiyatli amalga oshirildi")
      setPayOpen(false)
      loadData(rentalId)
      onSuccess()
    } catch (err: unknown) {
      message.error(getApiError(err, "To'lovda xatolik"))
    } finally {
      setActionLoading(false)
    }
  }

  const canBeCancelled = rental && rental.status !== 'Completed' && rental.status !== 'Cancelled'
  // "To'lov qabul qilish" faqat Active + to'lovsiz (Pending uchun topshirish modal ishlatiladi)
  const showPayBtn = !payment && rental?.status === 'Active'

  // Amal tugmalari — mobile da body ichida, desktop da extra da ko'rsatiladi
  const actionButtons = rental ? (
    <Space wrap size={8}>
      {/* Topshirish — faqat mijoz (client), payment yo'q bo'lgandagina */}
      {!isManager && rental.status === 'Pending' && !payment && (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => { setSelectedMethod(null); setActivateOpen(true) }}
          size="middle"
        >
          Ijarani topshirish
        </Button>
      )}
      {isManager && rental.status === 'Active' && (
        <Button
          icon={<CheckOutlined />}
          onClick={() => setCompleteOpen(true)}
          size="middle"
        >
          Yakunlash
        </Button>
      )}
      {showPayBtn && (
        <Button
          icon={<DollarOutlined />}
          onClick={() => setPayOpen(true)}
          style={{ borderColor: '#52c41a', color: '#52c41a' }}
          size="middle"
        >
          To'lov qabul qilish
        </Button>
      )}
      {canBeCancelled && (
        <Button
          danger
          icon={<CloseOutlined />}
          onClick={() => setCancelOpen(true)}
          size="middle"
        >
          Bekor qilish
        </Button>
      )}
    </Space>
  ) : null

  return (
    <>
      {notifCtx}
      {/* ═══ Asosiy Drawer ══════════════════════════════════════════════════ */}
      <Drawer
        title={rental ? `Ijara #${rental.id}` : 'Ijara tafsilotlari'}
        open={!!rentalId}
        onClose={onClose}
        width={isMobile ? '100vw' : 580}
        loading={loading}
        extra={!isMobile ? actionButtons : undefined}
      >
        {rental && (
          <>
            {/* ── Hero: Mijoz + holat ─────────────────────────────────────── */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              padding:      '14px 16px',
              background:   token.colorFillAlter,
              borderRadius: 12,
              marginBottom: 16,
              border:       `1px solid ${token.colorBorderSecondary}`,
            }}>
              <div style={{
                width:          44,
                height:         44,
                borderRadius:   '50%',
                background:     'linear-gradient(135deg,#1677ff,#6366f1)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          '#fff',
                fontWeight:     700,
                fontSize:       18,
                flexShrink:     0,
              }}>
                {rental.customerName?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: token.colorText, marginBottom: 2 }}>
                  {rental.customerName}
                </div>
                <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                  Ijara #{rental.id}
                </div>
              </div>
              <StatusBadge status={rental.status} />
            </div>

            {/* ── Mashina info ─────────────────────────────────────────────── */}
            <SectionTitle icon={<CarFilled style={{ color: '#1677ff' }} />} title="Mashina" />
            <InfoGrid cols={isMobile ? 1 : 2} token={token}>
              <InfoCell label="Mashina" value={`${rental.carBrand} ${rental.carModel}`} token={token} />
              <InfoCell label="Davlat raqami" value={rental.licensePlate} mono token={token} />
            </InfoGrid>

            {/* ── Ijara muddati ─────────────────────────────────────────────── */}
            <SectionTitle icon={<CalendarFilled style={{ color: '#52c41a' }} />} title="Muddat" />
            <InfoGrid cols={isMobile ? 1 : 3} token={token}>
              <InfoCell label="Boshlanish"  value={format(new Date(rental.startDate), 'dd.MM.yyyy')} token={token} />
              <InfoCell label="Tugash"      value={format(new Date(rental.endDate),   'dd.MM.yyyy')} token={token} />
              <InfoCell label="Kun soni"    value={`${rental.totalDays} kun`} highlight token={token} />
            </InfoGrid>

            {/* ── Filial ───────────────────────────────────────────────────── */}
            <SectionTitle icon={<EnvironmentOutlined style={{ color: '#fa8c16' }} />} title="Filial" />
            <InfoGrid cols={isMobile ? 1 : 2} token={token}>
              <InfoCell label="Qabul filiali"    value={rental.pickupBranch}       token={token} />
              <InfoCell label="Qaytarish filiali" value={rental.returnBranch ?? '—'} token={token} />
            </InfoGrid>

            {/* ── Qo'shimcha ───────────────────────────────────────────────── */}
            {(rental.driverName || rental.promotionCode || rental.actualReturnDate || rental.notes) && (
              <>
                <SectionTitle icon={<TeamOutlined style={{ color: '#722ed1' }} />} title="Qo'shimcha" />
                <InfoGrid cols={1} token={token}>
                  {rental.driverName && (
                    <InfoCell label="Haydovchi" value={rental.driverName} token={token} />
                  )}
                  {rental.promotionCode && (
                    <InfoCell
                      label="Promokod"
                      value={<Tag color="blue" icon={<TagsOutlined />}>{rental.promotionCode}</Tag>}
                      token={token}
                    />
                  )}
                  {rental.actualReturnDate && (
                    <InfoCell
                      label="Haqiqiy qaytarish"
                      value={format(new Date(rental.actualReturnDate), 'dd.MM.yyyy HH:mm')}
                      token={token}
                    />
                  )}
                  {rental.notes && (
                    <InfoCell label="Izoh" value={rental.notes} token={token} />
                  )}
                </InfoGrid>
              </>
            )}

            {/* ── Moliyaviy ────────────────────────────────────────────────── */}
            <SectionTitle icon={<DollarOutlined style={{ color: '#13c2c2' }} />} title="Moliyaviy" />
            <div style={{
              borderRadius: 12,
              overflow:     'hidden',
              border:       `1px solid ${token.colorBorderSecondary}`,
              marginBottom: 16,
            }}>
              {[
                { label: "Asosiy summa",   value: `${rental.baseAmount.toLocaleString()} so'm`,  color: token.colorText },
                { label: "Qo'shimchalar",  value: `${rental.addonAmount.toLocaleString()} so'm`, color: token.colorText },
                { label: "Chegirma",       value: `-${rental.discountAmount.toLocaleString()} so'm`, color: '#ff4d4f' },
              ].map((row, i) => (
                <div key={i} style={{
                  display:       'flex',
                  justifyContent:'space-between',
                  alignItems:    'center',
                  padding:       '10px 16px',
                  background:    token.colorBgContainer,
                  borderBottom:  `1px solid ${token.colorBorderSecondary}`,
                }}>
                  <span style={{ fontSize: 13, color: token.colorTextSecondary }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.color }}>{row.value}</span>
                </div>
              ))}
              {/* Jami — ajratilgan qator */}
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                padding:        '14px 16px',
                background:     token.colorPrimaryBg,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: token.colorPrimary }}>
                  Jami summa
                </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: token.colorPrimary }}>
                  {rental.totalAmount.toLocaleString()} so'm
                </span>
              </div>
            </div>

            {/* ── Mijoz: to'lov kutilmoqda banneri ────────────────────────── */}
            {!isManager && rental.status === 'Pending' && payment?.status === 'Pending' && (
              <div style={{
                marginBottom: 16,
                padding: '14px 16px',
                background: isDark ? '#001a2c' : '#e6f4ff',
                border: '1.5px solid #1677ff',
                borderRadius: 12,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <ClockCircleFilled style={{ color: '#1677ff', fontSize: 18, marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1677ff', marginBottom: 4 }}>
                    To'lov ma'lumotlari yuborildi
                  </div>
                  <div style={{ fontSize: 13, color: token.colorTextSecondary }}>
                    Admin tasdiqlashini kuting. Tasdiqlangandan so'ng ijara avtomatik faollashtiriladi.
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color="blue">{ALL_METHOD_LABELS[payment.method]}</Tag>
                    <Tag color="geekblue" style={{ fontWeight: 700 }}>
                      {payment.amount.toLocaleString()} so'm
                    </Tag>
                  </div>
                </div>
              </div>
            )}

            {/* ── To'lov ma'lumotlari ──────────────────────────────────────── */}
            {payment && (
              <>
                {/* Admin: Pending to'lovni tasdiqlash banneri */}
                {isManager && payment.status === 'Pending' && (
                  <div style={{
                    marginBottom: 16,
                    padding:      '16px',
                    background:   isDark ? '#2d1f00' : '#fff7e6',
                    border:       '1.5px solid #ffa940',
                    borderRadius: 12,
                  }}>
                    <div style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          8,
                      fontWeight:   700,
                      fontSize:     14,
                      color:        '#d46b08',
                      marginBottom: 12,
                    }}>
                      <WarningOutlined />
                      Mijoz to'lov so'rovi — tasdiqlanmagan
                    </div>
                    <div style={{
                      display:      'flex',
                      gap:          8,
                      flexWrap:     'wrap',
                      marginBottom: payment.transactionId ? 12 : 16,
                    }}>
                      <Tag color="orange" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20 }}>
                        {ALL_METHOD_LABELS[payment.method]}
                      </Tag>
                      <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>
                        {payment.amount.toLocaleString()} so'm
                      </Tag>
                    </div>
                    {payment.transactionId && (
                      <div style={{
                        marginBottom: 12,
                        padding:      '10px 12px',
                        background:   isDark ? '#1a1500' : '#fffbe6',
                        border:       '1px solid #ffe58f',
                        borderRadius: 8,
                        fontSize:     12,
                        wordBreak:    'break-all',
                      }}>
                        <div style={{ color: token.colorTextTertiary, marginBottom: 4, fontWeight: 600 }}>
                          <FileImageOutlined /> Mijoz isboti (chek / URL):
                        </div>
                        {payment.transactionId.startsWith('http') ? (
                          <a href={payment.transactionId} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#1677ff', fontWeight: 600 }}>
                            🔗 {payment.transactionId}
                          </a>
                        ) : (
                          <Tag style={{ marginTop: 2 }}>{payment.transactionId}</Tag>
                        )}
                      </div>
                    )}
                    <div style={{
                      display:       'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap:           8,
                    }}>
                      <Button
                        type="primary"
                        icon={<CheckCircleFilled />}
                        loading={actionLoading}
                        block={isMobile}
                        style={{
                          flex:        isMobile ? undefined : 1,
                          background:  '#52c41a',
                          borderColor: '#52c41a',
                          borderRadius: 8,
                          height:      40,
                        }}
                        onClick={handleAdminApprove}
                      >
                        Tasdiqlash — Ijarani boshlash
                      </Button>
                      {canBeCancelled && (
                        <Button
                          danger
                          icon={<CloseOutlined />}
                          block={isMobile}
                          style={{ borderRadius: 8, height: 40 }}
                          onClick={() => setCancelOpen(true)}
                        >
                          Rad etish
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* To'lov kartasi */}
                <SectionTitle icon={<ClockCircleFilled style={{ color: '#52c41a' }} />} title="To'lov" />
                <div style={{
                  borderRadius: 12,
                  border:       `1px solid ${token.colorBorderSecondary}`,
                  overflow:     'hidden',
                  marginBottom: 16,
                }}>
                  {[
                    { label: "To'lov usuli", value: ALL_METHOD_LABELS[payment.method] ?? payment.method },
                    { label: "Holat",        value: <StatusBadge status={payment.status} /> },
                    { label: "Summa",        value: <span style={{ color: '#52c41a', fontWeight: 700 }}>{payment.amount.toLocaleString()} so'm</span> },
                    { label: "Sana",         value: format(new Date(payment.createdAt), 'dd.MM.yyyy HH:mm') },
                    ...(payment.transactionId && payment.status !== 'Pending' ? [{
                      label: "Tranzaksiya / Isbot",
                      value: payment.transactionId.startsWith('http')
                        ? <a href={payment.transactionId} target="_blank" rel="noopener noreferrer">🔗 {payment.transactionId}</a>
                        : <Tag>{payment.transactionId}</Tag>
                    }] : []),
                  ].map((row, i, arr) => (
                    <div key={i} style={{
                      display:       'flex',
                      justifyContent:'space-between',
                      alignItems:    'center',
                      padding:       '11px 16px',
                      background:    token.colorBgContainer,
                      borderBottom:  i < arr.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                      gap:           12,
                      flexWrap:      'wrap',
                    }}>
                      <span style={{ fontSize: 12, color: token.colorTextSecondary, flexShrink: 0 }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: token.colorText, textAlign: 'right', wordBreak: 'break-all' }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!payment && rental.status !== 'Cancelled' && (
              <Alert
                type="warning"
                showIcon
                message="Bu ijara uchun hali to'lov amalga oshirilmagan"
                style={{ borderRadius: 10, marginBottom: 16 }}
              />
            )}

            {/* ── Mobile amal tugmalari ────────────────────────────────────── */}
            {isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                {!isManager && rental.status === 'Pending' && (
                  <Button type="primary" block size="large" icon={<PlayCircleOutlined />}
                    style={{ borderRadius: 10, height: 46 }}
                    onClick={() => { setSelectedMethod(null); setActivateOpen(true) }}>
                    Ijarani topshirish
                  </Button>
                )}
                {isManager && rental.status === 'Active' && (
                  <Button block size="large" icon={<CheckOutlined />}
                    style={{ borderRadius: 10, height: 46 }}
                    onClick={() => setCompleteOpen(true)}>
                    Yakunlash
                  </Button>
                )}
                {showPayBtn && (
                  <Button block size="large" icon={<DollarOutlined />}
                    style={{ borderColor: '#52c41a', color: '#52c41a', borderRadius: 10, height: 46 }}
                    onClick={() => setPayOpen(true)}>
                    To'lov qabul qilish
                  </Button>
                )}
                {canBeCancelled && (
                  <Button danger block size="large" icon={<CloseOutlined />}
                    style={{ borderRadius: 10, height: 46 }}
                    onClick={() => setCancelOpen(true)}>
                    Bekor qilish
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* ═══ Ijarani topshirish modali (Pending → Active + to'lov) ══════════ */}
      <Modal
        title={
          <Space>
            <PlayCircleOutlined style={{ color: '#1677ff' }} />
            <span>Ijarani topshirish</span>
          </Space>
        }
        open={activateOpen}
        onCancel={() => { setActivateOpen(false); setSelectedMethod(null) }}
        footer={null}
        width={460}
        destroyOnHidden
      >
        {/* Summa banner */}
        {rental && (
          <div style={{
            marginBottom: 20, padding: '12px 16px',
            background: '#e6f4ff', border: '1px solid #91caff',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 13, color: '#555' }}>
              <strong>{rental.customerName}</strong> — Ijara #{rental.id}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1677ff', marginTop: 2 }}>
              {rental.totalAmount.toLocaleString()} so'm
            </div>
          </div>
        )}

        {/* ── Payme — katta karta tugma ── */}
        <div style={{ marginBottom: 12 }}>
          {(() => {
            const isSelected = selectedMethod === 'Payme'
            const logo       = isDark ? PAYME_CONFIG.logoDark : PAYME_CONFIG.logoLight
            return (
              <div
                onClick={() => setSelectedMethod('Payme')}
                style={{
                  borderRadius:   14,
                  border:         `2.5px solid ${isSelected ? PAYME_CONFIG.color : 'transparent'}`,
                  background:     PAYME_CONFIG.bg,
                  cursor:         'pointer',
                  overflow:       'hidden',
                  position:       'relative',
                  boxShadow:      isSelected
                    ? `0 0 0 3px ${PAYME_CONFIG.color}40`
                    : '0 2px 8px rgba(0,0,0,0.12)',
                  transition:     'all 0.18s',
                  aspectRatio:    '21/6',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={logo}
                  alt="Payme"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }}
                  onError={e => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                    const parent = el.parentElement
                    if (parent) {
                      const span = document.createElement('span')
                      span.textContent = 'Payme'
                      span.style.cssText = 'color:#fff;font-weight:800;font-size:22px'
                      parent.appendChild(span)
                    }
                  }}
                />
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}>
                    <CheckOutlined style={{ color: PAYME_CONFIG.color, fontSize: 13 }} />
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Payme tanlanganda — ilovani ochish tugmasi */}
        {selectedMethod === 'Payme' && (
          <div style={{
            marginBottom:   12,
            padding:        '10px 14px',
            background:     `${PAYME_CONFIG.color}12`,
            border:         `1px solid ${PAYME_CONFIG.color}50`,
            borderRadius:   10,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            10,
          }}>
            <span style={{ fontSize: 13, color: '#555' }}>
              Payme ilovasini ochib to'lovni amalga oshiring
            </span>
            <Button
              size="small"
              style={{
                background:   PAYME_CONFIG.color,
                borderColor:  PAYME_CONFIG.color,
                color:        '#fff',
                fontWeight:   700,
                borderRadius: 8,
                flexShrink:   0,
              }}
              onClick={openPayme}
            >
              📱 Ochish
            </Button>
          </div>
        )}

        {/* ── Boshqa to'lov usullari — chip tugmalar (admin tasdiqlaydi) ── */}
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6, marginTop: 4 }}>
          Yoki boshqa usul (admin tasdiqlanishini kutadi):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {OTHER_METHODS.map(({ value, label }) => {
            const isSelected = selectedMethod === value
            return (
              <div
                key={value}
                onClick={() => setSelectedMethod(value)}
                style={{
                  padding:      '7px 14px',
                  borderRadius: 20,
                  border:       `1.5px solid ${isSelected ? '#1677ff' : '#d9d9d9'}`,
                  background:   isSelected ? '#e6f4ff' : 'transparent',
                  cursor:       'pointer',
                  fontSize:     13,
                  fontWeight:   isSelected ? 600 : 400,
                  color:        isSelected ? '#1677ff' : '#555',
                  transition:   'all 0.15s',
                  userSelect:   'none',
                }}
              >
                {label}
              </div>
            )
          })}
        </div>

        {/* ── Karta to'lovi uchun isbot (majburiy) ── */}
        {needsProof && (
          <div style={{
            marginBottom: 16,
            padding:      '14px 16px',
            background:   '#fff7e6',
            border:       '1px solid #ffd591',
            borderRadius: 10,
          }}>
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              marginBottom: 10,
              fontWeight:   600,
              fontSize:     13,
              color:        '#d46b08',
            }}>
              <FileImageOutlined />
              Karta to'lovi uchun chek / isbot talab qilinadi
            </div>
            <Input
              size="large"
              placeholder="Chek URL, rasm URL yoki tranzaksiya raqami..."
              prefix={<FileImageOutlined style={{ color: '#bbb' }} />}
              value={proofUrl}
              onChange={e => setProofUrl(e.target.value)}
              style={{ borderRadius: 8 }}
            />
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 6 }}>
              Masalan: https://... (rasm linki) yoki tranzaksiya ID raqami
            </div>
          </div>
        )}

        {/* ── Boshqa usul tanlanganda — admin haqida ogohlantirish ── */}
        {selectedMethod && selectedMethod !== 'Payme' && (
          <Alert
            type="info"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 12, borderRadius: 8, fontSize: 12 }}
            message="Admin tasdiqlashi kerak"
            description={`So'rov adminga yuboriladi. ${ALL_METHOD_LABELS[selectedMethod]} to'lovini admin ko'rib chiqqach, ijara faollashtiriladi.`}
          />
        )}

        {/* Tasdiqlash */}
        <Button
          type="primary"
          block
          size="large"
          disabled={!selectedMethod || (needsProof && !proofUrl.trim())}
          loading={actionLoading}
          icon={<CheckOutlined />}
          onClick={handleActivateConfirm}
          style={{ borderRadius: 10, height: 48, fontWeight: 700, fontSize: 15 }}
        >
          {!selectedMethod
            ? "To'lov usulini tanlang"
            : selectedMethod === 'Payme'
              ? '✅ Payme orqali tasdiqlash'
              : `📋 So'rov yuborish — ${ALL_METHOD_LABELS[selectedMethod]}`}
        </Button>
      </Modal>

      {/* ═══ Yakunlash modali ═══════════════════════════════════════════════ */}
      <Modal
        title={
          <Space>
            <CheckOutlined style={{ color: '#52c41a' }} />
            <span>Ijarani yakunlash — mashina qabul qilish</span>
          </Space>
        }
        open={completeOpen}
        onCancel={() => setCompleteOpen(false)}
        footer={null}
        width={480}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleComplete}>
          {/* Qaytarish sanasi */}
          <Form.Item
            name="actualReturnDate"
            label="Haqiqiy qaytarish sanasi va vaqti"
            rules={[{ required: true, message: 'Sana kiritish shart' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              format="DD.MM.YYYY HH:mm"
              placeholder="Sana va vaqtni tanlang"
            />
          </Form.Item>

          <Divider style={{ margin: '8px 0 12px' }}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              Mashina holati feedback (ixtiyoriy)
            </span>
          </Divider>

          {/* Mashina umumiy holati */}
          <Form.Item
            name="carCondition"
            label="Mashina qaytarilgan holati"
          >
            <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Radio.Button
                  value="excellent"
                  style={{ textAlign: 'center', borderRadius: 8 }}
                >
                  ⭐ A'lo
                </Radio.Button>
                <Radio.Button
                  value="good"
                  style={{ textAlign: 'center', borderRadius: 8 }}
                >
                  👍 Yaxshi
                </Radio.Button>
                <Radio.Button
                  value="fair"
                  style={{ textAlign: 'center', borderRadius: 8 }}
                >
                  😐 O'rtacha
                </Radio.Button>
                <Radio.Button
                  value="poor"
                  style={{ textAlign: 'center', borderRadius: 8 }}
                >
                  ⚠️ Nuqsonli
                </Radio.Button>
              </div>
            </Radio.Group>
          </Form.Item>

          {/* Shikast yoki nuqson tavsifi */}
          <Form.Item
            name="damageNotes"
            label="Shikast / nuqson tavsifi"
          >
            <Input.TextArea
              rows={2}
              placeholder="Masalan: chap eshikda tirnalish, yoqilg'i to'liq emas, g'ildirak holati..."
            />
          </Form.Item>

          {/* Qo'shimcha izoh */}
          <Form.Item name="notes" label="Qo'shimcha izoh">
            <Input.TextArea
              rows={2}
              placeholder="Boshqa muhim ma'lumotlar..."
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={actionLoading}
            block
            size="large"
            icon={<CheckOutlined />}
            style={{ borderRadius: 8, height: 44 }}
          >
            ✅ Ijarani yakunlash
          </Button>
        </Form>
      </Modal>

      {/* ═══ Bekor qilish modali ════════════════════════════════════════════ */}
      <Modal
        title="Ijarani bekor qilish"
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={handleCancel}>
          <Form.Item
            name="reason"
            label="Bekor qilish sababi"
            rules={[{ required: true, message: 'Sabab kiritish majburiy' }, { min: 5 }]}
          >
            <Input.TextArea rows={4} placeholder="Masalan: Mijoz so'rovi bo'yicha..." />
          </Form.Item>
          <Button danger htmlType="submit" loading={actionLoading} block icon={<CloseOutlined />}>
            Ijarani bekor qilish
          </Button>
        </Form>
      </Modal>

      {/* ═══ Alohida to'lov modali (Active rentals) ═════════════════════════ */}
      <Modal
        title="To'lov qabul qilish"
        open={payOpen}
        onCancel={() => setPayOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {rental && (
          <div style={{
            marginBottom: 16, padding: '10px 14px',
            background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8,
          }}>
            <strong>Ijara #{rental.id}</strong> — {rental.customerName}
            <br />
            <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 16 }}>
              {rental.totalAmount.toLocaleString()} so'm
            </span>
          </div>
        )}
        <Form layout="vertical" onFinish={handlePay}>
          <Form.Item
            name="method"
            label="To'lov usuli"
            rules={[{ required: true, message: "To'lov usulini tanlang" }]}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[...OTHER_METHODS,
                { value: 'Click' as PaymentMethod, label: 'CLICK' },
                { value: 'Payme' as PaymentMethod, label: 'Payme' },
              ].map(({ value, label }) => (
                <Form.Item key={value} noStyle shouldUpdate>
                  {({ setFieldValue, getFieldValue }) => {
                    const isSelected = getFieldValue('method') === value
                    return (
                      <div
                        onClick={() => setFieldValue('method', value)}
                        style={{
                          padding:      '7px 14px',
                          borderRadius: 20,
                          border:       `1.5px solid ${isSelected ? '#1677ff' : '#d9d9d9'}`,
                          background:   isSelected ? '#e6f4ff' : 'transparent',
                          cursor:       'pointer',
                          fontSize:     13,
                          fontWeight:   isSelected ? 600 : 400,
                          color:        isSelected ? '#1677ff' : '#555',
                          transition:   'all 0.15s',
                          userSelect:   'none',
                        }}
                      >
                        {label}
                      </div>
                    )
                  }}
                </Form.Item>
              ))}
            </div>
          </Form.Item>
          <Form.Item name="transactionId" label="Tranzaksiya ID (ixtiyoriy)">
            <Input placeholder="TXN123456789" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={actionLoading}
            block
            icon={<DollarOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            To'lovni tasdiqlash
          </Button>
        </Form>
      </Modal>
    </>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{
      display:     'flex',
      alignItems:  'center',
      gap:         6,
      fontSize:    12,
      fontWeight:  600,
      color:       '#8c8c8c',
      marginBottom: 6,
      marginTop:   14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {icon}
      {title}
    </div>
  )
}

interface InfoGridProps {
  cols:     number
  token:    ReturnType<typeof theme.useToken>['token']
  children: React.ReactNode
}
function InfoGrid({ cols, token, children }: InfoGridProps) {
  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap:                 1,
      background:          token.colorBorderSecondary,
      border:              `1px solid ${token.colorBorderSecondary}`,
      borderRadius:        12,
      overflow:            'hidden',
      marginBottom:        0,
    }}>
      {children}
    </div>
  )
}

interface InfoCellProps {
  label:     string
  value:     React.ReactNode
  mono?:     boolean
  highlight?: boolean
  token:     ReturnType<typeof theme.useToken>['token']
}
function InfoCell({ label, value, mono, highlight, token }: InfoCellProps) {
  return (
    <div style={{
      padding:    '10px 14px',
      background: token.colorBgContainer,
    }}>
      <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{
        fontSize:    13,
        fontWeight:  highlight ? 700 : 600,
        color:       highlight ? token.colorPrimary : token.colorText,
        fontFamily:  mono ? 'monospace' : undefined,
        wordBreak:   'break-word',
      }}>
        {value}
      </div>
    </div>
  )
}
