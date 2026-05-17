import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Spin, Button, theme, Modal, Alert, Space } from 'antd'
import {
  ArrowLeftOutlined, TeamOutlined, SettingOutlined,
  FireOutlined, DashboardOutlined, CarOutlined,
  ShoppingCartOutlined, CalendarOutlined,
  LoginOutlined, UserAddOutlined, ProfileOutlined, ExclamationCircleFilled,
} from '@ant-design/icons'
import { carsApi } from '@/api/carsApi'
import { pricingTiersApi } from '@/api/pricingTiersApi'
import { usersApi } from '@/api/usersApi'
import type { CarDetailDto } from '@/types/cars'
import type { PricingTierDto } from '@/types/pricingTiers'
import type { UserDto } from '@/types/users'
import { TRANSMISSION_LABEL } from '@/types/cars'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import RentalFormModal from '@/pages/rentals/components/RentalFormModal'
import ReservationFormModal from '@/pages/reservations/components/ReservationFormModal'

const PRIMARY_RED = '#e41b29'
const WA_LINK     = 'https://wa.me/998901234567'
const TG_LINK     = 'https://t.me/rentcar_uz'

const fmt = (n: number) => n.toLocaleString('ru-RU')

const TIER_ICONS  = ['🚀', '⭐', '🔥', '🌹']

// ── Icons ──────────────────────────────────────────────────────────────────────
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CarDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const { token } = theme.useToken()
  const isDark    = useThemeStore((s) => s.isDark)

  const { isAuthenticated, userId } = useAuthStore()

  const [car,        setCar]        = useState<CarDetailDto | null>(null)
  const [tiers,      setTiers]      = useState<PricingTierDto[]>([])
  const [loading,    setLoading]    = useState(true)
  const [currentImg, setCurrentImg] = useState(0)
  const [rentalOpen,      setRentalOpen]      = useState(false)
  const [reservationOpen, setReservationOpen] = useState(false)

  // Auth + profil modallari
  const [authModalOpen,    setAuthModalOpen]    = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileChecking,  setProfileChecking]  = useState(false)
  const [userProfile,      setUserProfile]      = useState<UserDto | null>(null)

  // Profil to'liqligi tekshirish (sahifa ochilganda, faqat auth bo'lsa)
  useEffect(() => {
    if (!isAuthenticated || !userId) return
    usersApi.getById(userId)
      .then(r => setUserProfile(r.data))
      .catch(() => {})
  }, [isAuthenticated, userId])

  /** Profil to'liq yoki yo'qligini aniqlash */
  const missingFields: string[] = []
  if (userProfile) {
    if (!userProfile.phoneNumber)   missingFields.push("Telefon raqam")
    if (!userProfile.dateOfBirth)   missingFields.push("Tug'ilgan sana")
    if (!userProfile.licenseNumber) missingFields.push("Haydovchilik guvohnomasi")
  }
  /** Ijara/Bron tugmasi bosilganda universal tekshiruv */
  const handleBookingClick = async (type: 'rental' | 'reservation') => {
    // 1. Autentifikatsiya tekshiruvi
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    // 2. Profil hali yuklanmagan bo'lsa — qayta yukla
    if (!userProfile) {
      setProfileChecking(true)
      try {
        const res = await usersApi.getById(userId!)
        setUserProfile(res.data)
        const missing: string[] = []
        if (!res.data.phoneNumber)   missing.push("Telefon raqam")
        if (!res.data.dateOfBirth)   missing.push("Tug'ilgan sana")
        if (!res.data.licenseNumber) missing.push("Haydovchilik guvohnomasi")
        if (missing.length > 0) { setProfileModalOpen(true); return }
      } finally {
        setProfileChecking(false)
      }
    }
    // 3. Profil to'liq emas
    if (missingFields.length > 0) {
      setProfileModalOpen(true)
      return
    }
    // 4. Hammasi ok — modalni ochamiz
    if (type === 'rental') setRentalOpen(true)
    else setReservationOpen(true)
  }

  useEffect(() => {
    if (!id) return
    const carId = parseInt(id)
    setLoading(true)
    setCurrentImg(0)
    Promise.all([
      carsApi.getById(carId),
      pricingTiersApi.getAll({ carId, activeOnly: true }).catch(() => ({ data: [] as PricingTierDto[] })),
    ]).then(([carRes, tiersRes]) => {
      setCar(carRes.data)
      setTiers(tiersRes.data ?? [])
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!car) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: token.colorTextTertiary }}>
        Avtomobil topilmadi
      </div>
    )
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const name = `${car.brand} ${car.model}`.toUpperCase()

  // Build images list from imageUrls string array
  const images = car.imageUrls ?? []

  const currentImageUrl = images[currentImg] ?? ''
  const deposit         = car.dailyRate * 10

  // Pricing tiers — use API tiers if available, else calculate from dailyRate
  const displayTiers: Array<{ id: number; label: string; rate: number }> =
    tiers.length > 0
      ? tiers.slice(0, 4).map(t => ({
          id:    t.id,
          label: t.name || `${t.minDays}–${t.maxDays ?? '∞'} kun`,
          rate:  t.dailyRate,
        }))
      : [
          { id: 1, label: '1–3 kun',   rate: car.dailyRate },
          { id: 2, label: '4–7 kun',   rate: Math.round(car.dailyRate * 0.95) },
          { id: 3, label: '8–14 kun',  rate: Math.round(car.dailyRate * 0.917) },
          { id: 4, label: '15–30 kun', rate: Math.round(car.dailyRate * 0.833) },
        ]

  // Specs
  const specs = [
    { icon: <TeamOutlined />,      label: "O'rinlar",    value: `${car.seatCount} ta` },
    { icon: <SettingOutlined />,   label: 'Uzatmalar',   value: TRANSMISSION_LABEL[car.transmissionType] },
    { icon: <FireOutlined />,      label: "Yoqilg'i",    value: car.fuelType },
    { icon: <CarOutlined />,       label: 'Toifasi',     value: car.category },
    { icon: <DashboardOutlined />, label: 'Filial',      value: car.branchName },
    { icon: <CarOutlined />,       label: 'Yil',         value: String(car.year) },
  ]

  const cardStyle: React.CSSProperties = {
    background:   token.colorBgContainer,
    borderRadius: 14,
    padding:      isMobile ? 16 : 24,
    boxShadow:    `0 2px 14px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'}`,
    border:       `1px solid ${token.colorBorderSecondary}`,
  }

  // Spec box: dark regardless of theme, slightly lighter in dark mode for contrast
  const specBoxBg = isDark ? '#2a2a2a' : '#2d2d2d'

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* ── Back / Breadcrumb ─────────────────────────────────────── */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ padding: '0 8px', color: token.colorTextSecondary }}
        >
          Orqaga
        </Button>
        <span style={{ color: token.colorBorderSecondary }}>/</span>
        <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Avtomobil</span>
        <span style={{ color: token.colorBorderSecondary }}>/</span>
        <span style={{ color: token.colorText, fontSize: 13 }}>{name}</span>
      </div>

      {/* ── TOP SECTION ────────────────────────────────────────────── */}
      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>

        {/* Gallery */}
        <Col xs={24} md={12}>
          <div style={cardStyle}>
            {/* Main image */}
            <div style={{
              background:     token.colorFillSecondary,
              borderRadius:   10,
              height:         isMobile ? 220 : 300,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              overflow:       'hidden',
              marginBottom:   14,
            }}>
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span style={{ fontSize: 64 }}>🚗</span>
              )}
            </div>

            {/* Thumbnail dots / thumbs */}
            {images.length > 1 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentImg(idx)}
                    style={{
                      width:        52,
                      height:       38,
                      borderRadius: 6,
                      overflow:     'hidden',
                      border:       `2px solid ${currentImg === idx ? PRIMARY_RED : 'transparent'}`,
                      cursor:       'pointer',
                      background:   token.colorFillSecondary,
                    }}
                  >
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                    background: i === 0 ? PRIMARY_RED : token.colorFillSecondary,
                  }} />
                ))}
              </div>
            )}
          </div>
        </Col>

        {/* Car info */}
        <Col xs={24} md={12}>
          <div style={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Brand logo + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              {car.brandLogoUrl && (
                <img
                  src={car.brandLogoUrl}
                  alt={car.brand}
                  style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <h1 style={{
                fontSize:      isMobile ? 20 : 26,
                fontWeight:    800,
                letterSpacing: 0.4,
                margin:        0,
                color:         token.colorText,
              }}>
                {name}
              </h1>
            </div>
            <p style={{ color: PRIMARY_RED, fontSize: 13, marginBottom: 22 }}>
              Yoki shunga o'xshash avtomobil ⓘ
            </p>

            {/* Feature badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {/* Always-shown */}
              <span style={badgeStyle(token)}>
                <SettingOutlined style={{ color: PRIMARY_RED }} />
                {TRANSMISSION_LABEL[car.transmissionType]}
              </span>
              <span style={badgeStyle(token)}>
                <TeamOutlined style={{ color: PRIMARY_RED }} />
                {car.seatCount} ta o'rin
              </span>
              <span style={badgeStyle(token)}>
                <FireOutlined style={{ color: PRIMARY_RED }} />
                {car.fuelType}
              </span>
              {/* Dynamic features */}
              {car.features.map((f, i) => (
                <span key={i} style={badgeStyle(token)}>✦ {f}</span>
              ))}
            </div>

            {/* Price */}
            <div style={{
              display:     'flex',
              gap:         32,
              marginBottom: 28,
              flexWrap:    'wrap',
            }}>
              <div>
                <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 2 }}>Kuniga:</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: token.colorText }}>
                  {fmt(car.dailyRate)} so'm
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 2 }}>Garov:</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: token.colorText }}>
                  {fmt(deposit)} so'm
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              {/* WA + TG + Hozir olish */}
              <div style={{ display: 'flex', gap: 10 }}>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <button style={actionIconBtn('#25d366')}><WhatsAppIcon /></button>
                </a>
                <a href={TG_LINK} target="_blank" rel="noopener noreferrer">
                  <button style={actionIconBtn('#0088cc')}><TelegramIcon /></button>
                </a>
                <button
                  style={{
                    flex:           1,
                    height:         48,
                    borderRadius:   10,
                    background:     PRIMARY_RED,
                    border:         'none',
                    cursor:         'pointer',
                    color:          '#fff',
                    fontWeight:     700,
                    fontSize:       14,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            6,
                    opacity:        profileChecking ? 0.7 : 1,
                  }}
                  onClick={() => handleBookingClick('rental')}
                  disabled={profileChecking}
                >
                  <ShoppingCartOutlined style={{ fontSize: 16 }} />
                  {profileChecking ? 'Tekshirilmoqda...' : 'Hozir olish'}
                </button>
              </div>

              {/* Bron qilish — to'liq kenglik */}
              <button
                style={{
                  width:          '100%',
                  height:         44,
                  borderRadius:   10,
                  background:     token.colorBgContainer,
                  border:         `2px solid ${PRIMARY_RED}`,
                  cursor:         'pointer',
                  color:          PRIMARY_RED,
                  fontWeight:     700,
                  fontSize:       14,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            6,
                }}
                onClick={() => handleBookingClick('reservation')}
              >
                <CalendarOutlined style={{ fontSize: 15 }} />
                Bron qilib qo'yish
              </button>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── BOTTOM SECTION ─────────────────────────────────────────── */}
      <Row gutter={[20, 20]}>

        {/* Pricing tiers */}
        <Col xs={24} md={12}>
          <div style={cardStyle}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: token.colorText }}>
              Tariflar
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayTiers.map((tier, idx) => (
                <div key={tier.id} style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          14,
                  padding:      '12px 16px',
                  background:   token.colorFillAlter,
                  borderRadius: 10,
                  border:       `1px solid ${token.colorBorderSecondary}`,
                }}>
                  {/* Icon circle */}
                  <div style={{
                    width:          42,
                    height:         42,
                    borderRadius:   '50%',
                    background:     isDark ? 'rgba(228,27,41,0.15)' : '#fff0f2',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       20,
                    flexShrink:     0,
                  }}>
                    {TIER_ICONS[idx] ?? '💰'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: token.colorTextSecondary, marginBottom: 2 }}>{tier.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: token.colorText }}>{fmt(tier.rate)} so'm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Specs */}
        <Col xs={24} md={12}>
          <div style={cardStyle}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: token.colorText }}>
              Xarakteristikalar
            </h3>
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
              gap:                 10,
            }}>
              {specs.map((spec, i) => (
                <div key={i} style={{
                  background:   specBoxBg,
                  borderRadius: 10,
                  padding:      '12px 14px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                }}>
                  <span style={{ color: '#aaa', fontSize: 20, flexShrink: 0 }}>{spec.icon}</span>
                  <div>
                    <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{spec.label}</div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{spec.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {car.description && (
              <div style={{
                marginTop:    12,
                background:   specBoxBg,
                borderRadius: 10,
                padding:      '12px 14px',
              }}>
                <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Tavsif</div>
                <div style={{ color: '#e0e0e0', fontSize: 13, lineHeight: 1.5 }}>{car.description}</div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* ── Ijara / Bron modallari ─────────────────────────────────── */}
      <RentalFormModal
        open={rentalOpen}
        onClose={() => setRentalOpen(false)}
        onSuccess={() => setRentalOpen(false)}
        prefilledCarId={car.id}
        carLabel={`${car.brand} ${car.model} (${car.year})`}
      />

      <ReservationFormModal
        open={reservationOpen}
        onClose={() => setReservationOpen(false)}
        onSuccess={() => setReservationOpen(false)}
        prefilledCarId={car.id}
        carLabel={`${car.brand} ${car.model} (${car.year})`}
      />

      {/* ── Auth modal: login talab qilinadi ──────────────────────── */}
      <Modal
        open={authModalOpen}
        onCancel={() => setAuthModalOpen(false)}
        footer={null}
        centered
        width={380}
        styles={{ body: { padding: '24px 20px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width:          64,
            height:         64,
            borderRadius:   '50%',
            background:     'linear-gradient(135deg,#1677ff22,#6366f122)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 14px',
          }}>
            <LoginOutlined style={{ fontSize: 28, color: '#1677ff' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Kirish talab qilinadi
          </div>
          <div style={{ fontSize: 13, color: '#8c8c8c', lineHeight: 1.6 }}>
            Avtomobil ijaraga olish yoki bron qilish uchun tizimga kiring yoki ro'yxatdan o'ting
          </div>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          <Button
            type="primary"
            size="large"
            block
            icon={<LoginOutlined />}
            onClick={() => { setAuthModalOpen(false); navigate('/login') }}
            style={{ borderRadius: 10, height: 46 }}
          >
            Tizimga kirish
          </Button>
          <Button
            size="large"
            block
            icon={<UserAddOutlined />}
            onClick={() => { setAuthModalOpen(false); navigate('/register') }}
            style={{ borderRadius: 10, height: 46 }}
          >
            Ro'yxatdan o'tish
          </Button>
        </Space>
      </Modal>

      {/* ── Profil to'liqligi modal ────────────────────────────────── */}
      <Modal
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={null}
        centered
        width={400}
        styles={{ body: { padding: '24px 20px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            width:          64,
            height:         64,
            borderRadius:   '50%',
            background:     'linear-gradient(135deg,#fa8c1622,#faad1422)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 14px',
          }}>
            <ExclamationCircleFilled style={{ fontSize: 28, color: '#fa8c16' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Profilingizni to'ldiring
          </div>
          <div style={{ fontSize: 13, color: '#8c8c8c', lineHeight: 1.6, marginBottom: 16 }}>
            Avtomobil ijaraga olish uchun quyidagi ma'lumotlarni to'ldirish shart:
          </div>
        </div>

        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
          message="Quyidagi ma'lumotlar to'ldirilmagan:"
          description={
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {missingFields.map(f => (
                <li key={f} style={{ fontSize: 13, marginBottom: 2 }}>{f}</li>
              ))}
            </ul>
          }
        />

        <Button
          type="primary"
          size="large"
          block
          icon={<ProfileOutlined />}
          onClick={() => { setProfileModalOpen(false); navigate('/profile') }}
          style={{ borderRadius: 10, height: 46 }}
        >
          Profilni to'ldirish
        </Button>
      </Modal>
    </div>
  )
}

// ── Styles — badge is defined as a function to access token ────────────────────
// (see badgeStyle() helper used in JSX)
function badgeStyle(token: ReturnType<typeof theme.useToken>['token']): React.CSSProperties {
  return {
    padding:      '6px 12px',
    borderRadius: 50,
    border:       `1.5px solid ${token.colorBorderSecondary}`,
    background:   token.colorBgContainer,
    fontSize:     12,
    display:      'inline-flex',
    alignItems:   'center',
    gap:          5,
    color:        token.colorText,
    whiteSpace:   'nowrap',
  }
}

function actionIconBtn(bg: string): React.CSSProperties {
  return {
    width:          48,
    height:         48,
    borderRadius:   10,
    background:     bg,
    border:         'none',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  }
}
