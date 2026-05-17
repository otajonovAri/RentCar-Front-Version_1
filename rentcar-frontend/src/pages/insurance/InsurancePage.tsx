import { useState, useEffect, useCallback } from 'react'
import {
  Button, Modal, Form, Input, InputNumber, DatePicker,
  Select, message, Spin, Grid, theme, Divider,
} from 'antd'
import {
  PlusOutlined, SafetyCertificateFilled, BankFilled,
  PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined,
  CalendarOutlined, DollarCircleFilled,
  CheckCircleFilled, CloseCircleFilled, FileProtectOutlined,
  TagOutlined,
} from '@ant-design/icons'
import { insuranceApi } from '@/api/insuranceApi'
import type { InsuranceCompanyDto, InsurancePolicyDto } from '@/types/insurance'
import { getApiError } from '@/utils/apiError'
import { format, isAfter } from 'date-fns'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('ru-RU')

const COMPANY_PALETTE = [
  { color: '#1677ff', bg: 'linear-gradient(135deg,#1677ff,#4096ff)' },
  { color: '#722ed1', bg: 'linear-gradient(135deg,#722ed1,#9254de)' },
  { color: '#13c2c2', bg: 'linear-gradient(135deg,#13c2c2,#36cfc9)' },
  { color: '#52c41a', bg: 'linear-gradient(135deg,#52c41a,#73d13d)' },
  { color: '#fa8c16', bg: 'linear-gradient(135deg,#fa8c16,#ffc53d)' },
  { color: '#eb2f96', bg: 'linear-gradient(135deg,#eb2f96,#f759ab)' },
]
function companyPalette(id: number) { return COMPANY_PALETTE[id % COMPANY_PALETTE.length] }
function companyInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const COVERAGE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  KASKO:  { color: '#1677ff', bg: 'rgba(22,119,255,0.1)',  border: 'rgba(22,119,255,0.25)' },
  OSAGO:  { color: '#722ed1', bg: 'rgba(114,46,209,0.1)',  border: 'rgba(114,46,209,0.25)' },
  CASCO:  { color: '#1677ff', bg: 'rgba(22,119,255,0.1)',  border: 'rgba(22,119,255,0.25)' },
}
function coverageCfg(type: string) {
  return COVERAGE_COLORS[type.toUpperCase()] ?? {
    color: '#13c2c2', bg: 'rgba(19,194,194,0.1)', border: 'rgba(19,194,194,0.25)',
  }
}

type ActiveTab = 'policies' | 'companies'

export default function InsurancePage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md

  const [companies,        setCompanies]        = useState<InsuranceCompanyDto[]>([])
  const [policies,         setPolicies]         = useState<InsurancePolicyDto[]>([])
  const [loading,          setLoading]          = useState(false)
  const [activeTab,        setActiveTab]        = useState<ActiveTab>('policies')
  const [activeOnly,       setActiveOnly]       = useState(false)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [policyModalOpen,  setPolicyModalOpen]  = useState(false)
  const [actionLoading,    setActionLoading]    = useState(false)
  const [companyForm] = Form.useForm()
  const [policyForm]  = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, pRes] = await Promise.all([
        insuranceApi.getCompanies(),
        insuranceApi.getPolicies(),
      ])
      setCompanies(cRes.data)
      setPolicies(pRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateCompany = async () => {
    const values = await companyForm.validateFields()
    setActionLoading(true)
    try {
      await insuranceApi.createCompany(values)
      message.success("✅ Kompaniya qo'shildi")
      setCompanyModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally { setActionLoading(false) }
  }

  const handleCreatePolicy = async () => {
    const values = await policyForm.validateFields()
    setActionLoading(true)
    try {
      const payload = {
        ...values,
        startDate: format(values.startDate.toDate(), 'yyyy-MM-dd'),
        endDate:   format(values.endDate.toDate(),   'yyyy-MM-dd'),
      }
      await insuranceApi.createPolicy(payload)
      message.success("✅ Sug'urta polisi qo'shildi")
      setPolicyModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally { setActionLoading(false) }
  }

  const filteredPolicies = activeOnly
    ? policies.filter(p => p.isActive)
    : policies

  const activeCount   = policies.filter(p => p.isActive).length
  const expiredCount  = policies.filter(p => !p.isActive).length

  // ── display counts
  const currentCount = activeTab === 'policies' ? filteredPolicies.length : companies.length

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg,#001529 0%,#003a8c 55%,#0958d9 100%)',
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
          {/* Title row */}
          <div style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            gap: 16, marginBottom: 20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SafetyCertificateFilled style={{ fontSize: 28, color: '#fff' }}/>
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Sug'urta
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                Kompaniyalar va polislarni boshqarish
              </p>
            </div>

            {/* Stats chips */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { val: policies.length, label: "Jami polislar", color: '#91caff' },
                  { val: activeCount,     label: 'Faol',          color: '#95f2a8' },
                  { val: companies.length,label: 'Kompaniyalar',  color: '#ffd591' },
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

            {/* Add button */}
            <Button
              icon={<PlusOutlined/>}
              size="large"
              onClick={() => activeTab === 'policies' ? setPolicyModalOpen(true) : setCompanyModalOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.35)', color: '#fff',
                borderRadius: 10, fontWeight: 600, flexShrink: 0,
              }}
            >
              {isMobile ? '' : activeTab === 'policies' ? "Polisi qo'shish" : "Kompaniya qo'shish"}
            </Button>
          </div>

          {/* Tab + filter chips row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Tab chips */}
            {([
              { key: 'policies',   label: `Polislar (${policies.length})`,     icon: <FileProtectOutlined/> },
              { key: 'companies',  label: `Kompaniyalar (${companies.length})`, icon: <BankFilled/> },
            ] as { key: ActiveTab; label: string; icon: React.ReactNode }[]).map(tab => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setActiveOnly(false) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 18px', borderRadius: 20, cursor: 'pointer',
                    border: isActive ? 'none' : '1px solid rgba(255,255,255,0.3)',
                    background: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
                    color: isActive ? '#003a8c' : 'rgba(255,255,255,0.85)',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    backdropFilter: 'blur(6px)', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}

            {/* Active filter — only for policies tab */}
            {activeTab === 'policies' && (
              <button
                onClick={() => setActiveOnly(p => !p)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
                  border: activeOnly ? 'none' : '1px solid rgba(255,255,255,0.3)',
                  background: activeOnly ? 'rgba(82,196,26,0.85)' : 'rgba(255,255,255,0.12)',
                  color: activeOnly ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontSize: 13, fontWeight: activeOnly ? 700 : 500,
                  backdropFilter: 'blur(6px)', transition: 'all 0.2s',
                }}
              >
                <CheckCircleFilled style={{ fontSize: 12 }}/>
                Faqat faollar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large"/>
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Ma'lumotlar yuklanmoqda...</span>
        </div>
      ) : currentCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{activeTab === 'policies' ? '🛡️' : '🏦'}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            {activeTab === 'policies' ? "Polislar topilmadi" : "Kompaniyalar topilmadi"}
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {activeOnly ? 'Faol polislar yo\'q' : "Hali hech narsa qo'shilmagan"}
          </div>
          <button
            onClick={() => activeTab === 'policies' ? setPolicyModalOpen(true) : setCompanyModalOpen(true)}
            style={{
              marginTop: 16, padding: '9px 24px', borderRadius: 20, cursor: 'pointer',
              background: 'linear-gradient(135deg,#003a8c,#0958d9)',
              border: 'none', color: '#fff', fontWeight: 600, fontSize: 13,
            }}
          >
            <PlusOutlined style={{ marginRight: 6 }}/>
            {activeTab === 'policies' ? "Polisi qo'shish" : "Kompaniya qo'shish"}
          </button>
        </div>
      ) : (
        <>
          {/* Count row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
              <strong style={{ color: token.colorText }}>{currentCount}</strong> ta {activeTab === 'policies' ? 'polisi' : 'kompaniya'}
              {activeTab === 'policies' && (
                <span style={{ marginLeft: 12, fontSize: 12, color: token.colorTextTertiary }}>
                  <span style={{ color: '#52c41a', fontWeight: 600 }}>{activeCount}</span> faol
                  {' · '}
                  <span style={{ color: '#f5222d', fontWeight: 600 }}>{expiredCount}</span> tugagan
                </span>
              )}
            </span>
          </div>

          {/* ── POLICIES GRID ── */}
          {activeTab === 'policies' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : !screens.lg ? 'repeat(2,1fr)' : screens.xl ? 'repeat(3,1fr)' : 'repeat(2,1fr)',
              gap: isMobile ? 12 : 16,
            }}>
              {filteredPolicies.map(p => <PolicyCard key={p.id} policy={p} token={token}/>)}
            </div>
          )}

          {/* ── COMPANIES GRID ── */}
          {activeTab === 'companies' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : !screens.lg ? 'repeat(2,1fr)' : screens.xl ? 'repeat(3,1fr)' : 'repeat(2,1fr)',
              gap: isMobile ? 12 : 16,
            }}>
              {companies.map(c => <CompanyCard key={c.id} company={c} token={token}/>)}
            </div>
          )}
        </>
      )}

      {/* ── COMPANY MODAL ────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#003a8c,#0958d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BankFilled style={{ color: '#fff', fontSize: 14 }}/>
            </div>
            <span style={{ fontWeight: 700 }}>Yangi sug'urta kompaniyasi</span>
          </div>
        }
        open={companyModalOpen}
        onOk={handleCreateCompany}
        onCancel={() => setCompanyModalOpen(false)}
        confirmLoading={actionLoading}
        okText="Saqlash"
        cancelText="Bekor"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={isMobile ? '95vw' : 480}
        forceRender
        afterClose={() => companyForm.resetFields()}
      >
        <Form form={companyForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600 }}>🏦 Kompaniya nomi</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <Input placeholder="Alfa Insurance, UzAgroInsurance..." size="large" style={{ borderRadius: 8 }}/>
          </Form.Item>
          <Form.Item
            name="contactPhone"
            label={<span style={{ fontWeight: 600 }}>📞 Telefon</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <Input placeholder="+998 71 234 56 78" size="large" style={{ borderRadius: 8 }}/>
          </Form.Item>
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 600 }}>📧 Email</span>}
            rules={[{ required: true, message: 'Majburiy' }, { type: 'email', message: "To'g'ri email kiriting" }]}
          >
            <Input placeholder="info@insurance.uz" size="large" style={{ borderRadius: 8 }}/>
          </Form.Item>
          <Form.Item
            name="website"
            label={<span style={{ fontWeight: 600 }}>🌐 Veb-sayt (ixtiyoriy)</span>}
          >
            <Input placeholder="https://insurance.uz" size="large" style={{ borderRadius: 8 }}/>
          </Form.Item>
          <Form.Item
            name="address"
            label={<span style={{ fontWeight: 600 }}>📍 Manzil</span>}
            rules={[{ required: true, message: 'Majburiy' }]}
          >
            <Input placeholder="Toshkent, Chilonzor tumani..." size="large" style={{ borderRadius: 8 }}/>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── POLICY MODAL ─────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#003a8c,#0958d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileProtectOutlined style={{ color: '#fff', fontSize: 14 }}/>
            </div>
            <span style={{ fontWeight: 700 }}>Yangi sug'urta polisi</span>
          </div>
        }
        open={policyModalOpen}
        onOk={handleCreatePolicy}
        onCancel={() => setPolicyModalOpen(false)}
        confirmLoading={actionLoading}
        okText="Saqlash"
        cancelText="Bekor"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={isMobile ? '95vw' : 560}
        forceRender
        afterClose={() => policyForm.resetFields()}
      >
        <Form form={policyForm} layout="vertical" style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <Form.Item
              name="carId"
              label={<span style={{ fontWeight: 600 }}>🚗 Mashina ID</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber style={{ width: '100%', borderRadius: 8 }} min={1} size="large"/>
            </Form.Item>
            <Form.Item
              name="insuranceCompanyId"
              label={<span style={{ fontWeight: 600 }}>🏦 Kompaniya</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <Select placeholder="Kompaniya tanlang..." size="large" style={{ borderRadius: 8 }}>
                {companies.map(c => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="policyNumber"
              label={<span style={{ fontWeight: 600 }}>🔢 Polisi raqami</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <Input placeholder="POL-2026-001" size="large" style={{ borderRadius: 8 }}/>
            </Form.Item>
            <Form.Item
              name="coverageType"
              label={<span style={{ fontWeight: 600 }}>🛡️ Tur</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <Input placeholder="KASKO / OSAGO" size="large" style={{ borderRadius: 8 }}/>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="premiumAmount"
              label={<span style={{ fontWeight: 600 }}>💰 Premium (so'm)</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber
                min={0} style={{ width: '100%', borderRadius: 8 }} size="large"
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v!.replace(/,/g, '') as unknown as 0}
              />
            </Form.Item>
            <Form.Item
              name="coverageAmount"
              label={<span style={{ fontWeight: 600 }}>🔒 Qamrov (so'm)</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber
                min={0} style={{ width: '100%', borderRadius: 8 }} size="large"
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v!.replace(/,/g, '') as unknown as 0}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="startDate"
              label={<span style={{ fontWeight: 600 }}>📅 Boshlanish</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <DatePicker style={{ width: '100%', borderRadius: 8 }} size="large"/>
            </Form.Item>
            <Form.Item
              name="endDate"
              label={<span style={{ fontWeight: 600 }}>📅 Tugash</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <DatePicker style={{ width: '100%', borderRadius: 8 }} size="large"/>
            </Form.Item>
          </div>

          <Form.Item
            name="notes"
            label={<span style={{ fontWeight: 600 }}>📝 Izoh (ixtiyoriy)</span>}
          >
            <Input.TextArea rows={2} placeholder="Qo'shimcha ma'lumot..." style={{ borderRadius: 8 }}/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ── Policy Card ────────────────────────────────────────────────────────────────
function PolicyCard({
  policy, token,
}: {
  policy: InsurancePolicyDto
  token: ReturnType<typeof theme.useToken>['token']
}) {
  const [hovered, setHovered] = useState(false)
  const cov   = coverageCfg(policy.coverageType)
  const pal   = companyPalette(policy.insuranceCompanyId)

  // Days left
  const end  = new Date(policy.endDate)
  const now  = new Date()
  const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000)
  const expired = !isAfter(end, now)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: token.colorBgContainer,
        borderRadius: 16,
        border: `1.5px solid ${hovered ? pal.color : token.colorBorderSecondary}`,
        overflow: 'hidden',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 30px ${pal.color}22, 0 3px 8px rgba(0,0,0,0.07)`
          : '0 2px 6px rgba(0,0,0,0.04)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{ height: 3, background: pal.bg }}/>

      <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Car plate badge */}
          <div style={{
            padding: '6px 12px', borderRadius: 8, flexShrink: 0,
            background: hovered ? pal.bg : `linear-gradient(135deg,${pal.color}22,${pal.color}11)`,
            border: `1px solid ${pal.color}44`,
            fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: pal.color,
            letterSpacing: 1, transition: 'background 0.2s',
          }}>
            {policy.carPlate}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 14,
              color: hovered ? pal.color : token.colorText,
              transition: 'color 0.18s',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {policy.companyName}
            </div>
            <div style={{ fontSize: 11, color: token.colorTextSecondary, marginTop: 1 }}>
              #{policy.policyNumber}
            </div>
          </div>
          {/* Status badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            color: policy.isActive ? '#52c41a' : '#f5222d',
            background: policy.isActive ? 'rgba(82,196,26,0.1)' : 'rgba(245,34,45,0.1)',
            border: `1px solid ${policy.isActive ? 'rgba(82,196,26,0.25)' : 'rgba(245,34,45,0.25)'}`,
            flexShrink: 0,
          }}>
            {policy.isActive
              ? <CheckCircleFilled style={{ fontSize: 11 }}/>
              : <CloseCircleFilled style={{ fontSize: 11 }}/>}
            {policy.isActive ? 'Faol' : 'Tugagan'}
          </span>
        </div>

        <Divider style={{ margin: '4px 0' }}/>

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Coverage type */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TagOutlined/> Tur
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              color: cov.color, background: cov.bg, border: `1px solid ${cov.border}`,
            }}>
              {policy.coverageType}
            </span>
          </div>

          {/* Premium */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <DollarCircleFilled/> Premium
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0958d9' }}>
              {fmt(policy.premiumAmount)} so'm
            </span>
          </div>

          {/* Coverage amount */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <SafetyCertificateFilled/> Qamrov
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: token.colorText }}>
              {fmt(policy.coverageAmount)} so'm
            </span>
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarOutlined/> Muddat
            </span>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
              {format(new Date(policy.startDate), 'dd.MM.yy')} — {format(new Date(policy.endDate), 'dd.MM.yy')}
            </span>
          </div>
        </div>

        {/* Days left bar */}
        {policy.isActive && !expired && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: token.colorTextTertiary }}>Qolgan muddat</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: days < 30 ? '#fa8c16' : '#52c41a' }}>
                {days} kun
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: token.colorFillAlter, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${Math.min(100, (days / 365) * 100)}%`,
                background: days < 30 ? '#fa8c16' : days < 90 ? '#fadb14' : '#52c41a',
                transition: 'width 0.4s',
              }}/>
            </div>
          </div>
        )}

        {/* Expired warning */}
        {expired && (
          <div style={{
            padding: '6px 10px', borderRadius: 8, fontSize: 11,
            background: 'rgba(245,34,45,0.06)', border: '1px solid rgba(245,34,45,0.18)',
            color: '#f5222d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <CloseCircleFilled/> Polisi muddati tugagan
          </div>
        )}
      </div>
    </div>
  )
}

// ── Company Card ───────────────────────────────────────────────────────────────
function CompanyCard({
  company, token,
}: {
  company: InsuranceCompanyDto
  token: ReturnType<typeof theme.useToken>['token']
}) {
  const [hovered, setHovered] = useState(false)
  const pal = companyPalette(company.id)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: token.colorBgContainer,
        borderRadius: 16,
        border: `1.5px solid ${hovered ? pal.color : token.colorBorderSecondary}`,
        overflow: 'hidden',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 30px ${pal.color}22, 0 3px 8px rgba(0,0,0,0.07)`
          : '0 2px 6px rgba(0,0,0,0.04)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{ height: 3, background: pal.bg }}/>

      <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: hovered ? pal.bg : `linear-gradient(135deg,${pal.color}33,${pal.color}22)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: pal.color, letterSpacing: -1,
            transition: 'background 0.2s',
          }}>
            {companyInitials(company.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 800, fontSize: 15,
              color: hovered ? pal.color : token.colorText,
              transition: 'color 0.18s',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {company.name}
            </div>
            <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 2 }}>
              Sug'urta kompaniyasi
            </div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: hovered ? pal.bg : token.colorFillAlter,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            <BankFilled style={{ fontSize: 13, color: pal.color }}/>
          </div>
        </div>

        <Divider style={{ margin: '4px 0' }}/>

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PhoneOutlined style={{ fontSize: 12, color: token.colorTextTertiary, flexShrink: 0 }}/>
            <span style={{ fontSize: 13, fontWeight: 600, color: token.colorText }}>{company.contactPhone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MailOutlined style={{ fontSize: 12, color: token.colorTextTertiary, flexShrink: 0 }}/>
            <span style={{
              fontSize: 12, color: '#0958d9', fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {company.email}
            </span>
          </div>
          {company.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GlobalOutlined style={{ fontSize: 12, color: token.colorTextTertiary, flexShrink: 0 }}/>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12, color: pal.color, fontWeight: 500,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <EnvironmentOutlined style={{ fontSize: 12, color: token.colorTextTertiary, flexShrink: 0, marginTop: 2 }}/>
            <span style={{ fontSize: 12, color: token.colorTextSecondary, lineHeight: 1.4 }}>
              {company.address}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
