import { useState, useEffect, useCallback } from 'react'
import {
  Button, Modal, Form, Input, InputNumber, DatePicker,
  Select, Popconfirm, message, Spin, Grid, theme,
  Divider, Radio,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  DollarCircleFilled, CalendarOutlined, ClockCircleOutlined,
  CarFilled, AppstoreOutlined, GlobalOutlined,
  TagFilled, CheckCircleFilled, InfoCircleOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { pricingTiersApi } from '@/api/pricingTiersApi'
import type { PricingTierDto, CreatePricingTierDto } from '@/types/pricingTiers'
import { useCategories } from '@/hooks/useLookups'
import { getApiError } from '@/utils/apiError'
import { format, isAfter } from 'date-fns'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('ru-RU')
const nfmt = (v: number | undefined) =>
  v !== undefined ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''

const TIER_PALETTE = [
  { color: '#52c41a', bg: 'linear-gradient(135deg,#52c41a,#73d13d)',  light: 'rgba(82,196,26,0.1)',  border: 'rgba(82,196,26,0.25)'  },
  { color: '#1677ff', bg: 'linear-gradient(135deg,#1677ff,#4096ff)',  light: 'rgba(22,119,255,0.1)', border: 'rgba(22,119,255,0.25)' },
  { color: '#722ed1', bg: 'linear-gradient(135deg,#722ed1,#9254de)',  light: 'rgba(114,46,209,0.1)', border: 'rgba(114,46,209,0.25)' },
  { color: '#fa8c16', bg: 'linear-gradient(135deg,#fa8c16,#ffc53d)',  light: 'rgba(250,140,22,0.1)', border: 'rgba(250,140,22,0.25)' },
  { color: '#13c2c2', bg: 'linear-gradient(135deg,#13c2c2,#36cfc9)',  light: 'rgba(19,194,194,0.1)', border: 'rgba(19,194,194,0.25)' },
  { color: '#eb2f96', bg: 'linear-gradient(135deg,#eb2f96,#f759ab)',  light: 'rgba(235,47,150,0.1)', border: 'rgba(235,47,150,0.25)' },
]
function tierPalette(id: number) { return TIER_PALETTE[id % TIER_PALETTE.length] }

type ApplyTarget = 'category' | 'car'

function isActive(tier: PricingTierDto): boolean {
  const now = new Date()
  const from = new Date(tier.validFrom)
  if (!isAfter(now, from)) return false
  if (tier.validTo && !isAfter(new Date(tier.validTo), now)) return false
  return true
}

export default function PricingTiersPage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md

  const [data,          setData]          = useState<PricingTierDto[]>([])
  const [loading,       setLoading]       = useState(false)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editing,       setEditing]       = useState<PricingTierDto | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [applyTarget,   setApplyTarget]   = useState<ApplyTarget>('category')
  const [filterTarget,  setFilterTarget]  = useState<'all' | 'category' | 'car' | 'global'>('all')
  const [form] = Form.useForm()
  const { categories } = useCategories()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pricingTiersApi.getAll()
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Modal ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setApplyTarget('category')
    setModalOpen(true)
  }

  const openEdit = (record: PricingTierDto) => {
    setEditing(record)
    const target: ApplyTarget = record.carId ? 'car' : 'category'
    setApplyTarget(target)
    form.setFieldsValue({
      name:        record.name,
      dailyRate:   record.dailyRate,
      weeklyRate:  record.weeklyRate,
      monthlyRate: record.monthlyRate,
      minDays:     record.minDays,
      maxDays:     record.maxDays ?? undefined,
      validFrom:   record.validFrom  ? dayjs(record.validFrom)  : undefined,
      validTo:     record.validTo    ? dayjs(record.validTo)    : undefined,
      categoryId:  record.categoryId ?? undefined,
      carId:       record.carId      ?? undefined,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setActionLoading(true)
    try {
      const validFrom = (values.validFrom as Dayjs).toISOString()
      const validTo   = values.validTo ? (values.validTo as Dayjs).toISOString() : null

      const payload: CreatePricingTierDto = {
        name:        values.name,
        dailyRate:   values.dailyRate,
        weeklyRate:  values.weeklyRate,
        monthlyRate: values.monthlyRate,
        minDays:     values.minDays,
        maxDays:     values.maxDays ?? null,
        validFrom, validTo,
        categoryId: applyTarget === 'category' ? (values.categoryId ?? null) : null,
        carId:      applyTarget === 'car'      ? (values.carId      ?? null) : null,
      }

      if (editing) {
        await pricingTiersApi.update(editing.id, payload)
        message.success('✅ Tarif yangilandi')
      } else {
        await pricingTiersApi.create(payload)
        message.success("✅ Tarif qo'shildi")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, "Xatolik yuz berdi"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await pricingTiersApi.delete(id)
      message.success("🗑️ Tarif o'chirildi")
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, "O'chirishda xatolik"))
    }
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = data.filter(t => {
    if (filterTarget === 'all')      return true
    if (filterTarget === 'category') return t.categoryId !== null && t.carId === null
    if (filterTarget === 'car')      return t.carId !== null
    if (filterTarget === 'global')   return t.categoryId === null && t.carId === null
    return true
  })

  const activeCount   = data.filter(isActive).length
  const categoryCount = data.filter(t => t.categoryId !== null && t.carId === null).length
  const carCount      = data.filter(t => t.carId !== null).length
  const globalCount   = data.filter(t => !t.categoryId && !t.carId).length

  const FILTER_TABS = [
    { key: 'all' as const,      label: `Barchasi (${data.length})`,          icon: <AppstoreOutlined/>,  color: '#1677ff' },
    { key: 'category' as const, label: `Kategoriya (${categoryCount})`,       icon: <TagFilled/>,         color: '#722ed1' },
    { key: 'car' as const,      label: `Mashina (${carCount})`,               icon: <CarFilled/>,         color: '#fa8c16' },
    { key: 'global' as const,   label: `Umumiy (${globalCount})`,             icon: <GlobalOutlined/>,    color: '#13c2c2' },
  ]

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg,#092b00 0%,#237804 55%,#52c41a 100%)',
        padding: isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position: 'relative', overflow: 'hidden',
      }}>
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
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DollarCircleFilled style={{ fontSize: 28, color: '#fff' }}/>
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Narxlar Jadvali
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                Ijaralar uchun narx tariflarini boshqarish
              </p>
            </div>

            {/* Stats */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { val: data.length,   label: 'Jami tariflar',  color: '#d9f7be' },
                  { val: activeCount,   label: 'Faol',           color: '#b7eb8f' },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '8px 18px', borderRadius: 12, textAlign: 'center',
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <Button
              icon={<PlusOutlined/>}
              size="large"
              onClick={openCreate}
              style={{
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.35)', color: '#fff',
                borderRadius: 10, fontWeight: 600, flexShrink: 0,
              }}
            >
              {isMobile ? '' : "Tarif qo'shish"}
            </Button>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTER_TABS.map(tab => {
              const isAct = filterTarget === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTarget(tab.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
                    border: isAct ? 'none' : '1px solid rgba(255,255,255,0.3)',
                    background: isAct ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
                    color: isAct ? tab.color : 'rgba(255,255,255,0.85)',
                    fontSize: 13, fontWeight: isAct ? 700 : 500,
                    backdropFilter: 'blur(6px)', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{tab.icon}</span>
                  {tab.label}
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
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Tariflar yuklanmoqda...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💰</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Tariflar topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {filterTarget !== 'all' ? 'Bu filtrdagi tarif yo\'q' : "Hali tarif qo'shilmagan"}
          </div>
          <button
            onClick={openCreate}
            style={{
              marginTop: 16, padding: '9px 24px', borderRadius: 20, cursor: 'pointer',
              background: 'linear-gradient(135deg,#237804,#52c41a)',
              border: 'none', color: '#fff', fontWeight: 600, fontSize: 13,
            }}
          >
            <PlusOutlined style={{ marginRight: 6 }}/>
            Tarif qo'shish
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
              <strong style={{ color: token.colorText }}>{filtered.length}</strong> ta tarif
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : !screens.lg
                ? 'repeat(2,1fr)'
                : screens.xl ? 'repeat(3,1fr)' : 'repeat(2,1fr)',
            gap: isMobile ? 12 : 16,
          }}>
            {filtered.map(tier => (
              <TierCard
                key={tier.id}
                tier={tier}
                token={token}
                onEdit={() => openEdit(tier)}
                onDelete={() => handleDelete(tier.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── MODAL ────────────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#237804,#52c41a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DollarCircleFilled style={{ color: '#fff', fontSize: 14 }}/>
            </div>
            <span style={{ fontWeight: 700 }}>
              {editing ? `Tahrirlanmoqda — ${editing.name}` : "Yangi tarif qo'shish"}
            </span>
          </div>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={actionLoading}
        okText="Saqlash"
        cancelText="Bekor"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700, background: '#52c41a', border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={640}
        forceRender
        afterClose={() => form.resetFields()}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          {/* Nomi */}
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600 }}>🏷️ Tarif nomi</span>}
            rules={[{ required: true, message: 'Tarif nomini kiriting' }]}
          >
            <Input
              placeholder="Masalan: Haftalik iqtisodiy tarif"
              size="large" style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {/* Narxlar */}
          <Divider orientation="left" plain style={{ fontSize: 12, color: '#8c8c8c' }}>
            💰 Narxlar (so'm)
          </Divider>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item
              name="dailyRate"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Kunlik</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber
                min={0} step={10000} style={{ width: '100%', borderRadius: 8 }}
                formatter={nfmt} placeholder="150,000" size="large"
                parser={v => v!.replace(/,/g, '') as unknown as number}
              />
            </Form.Item>
            <Form.Item
              name="weeklyRate"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Haftalik</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber
                min={0} step={50000} style={{ width: '100%', borderRadius: 8 }}
                formatter={nfmt} placeholder="900,000" size="large"
                parser={v => v!.replace(/,/g, '') as unknown as number}
              />
            </Form.Item>
            <Form.Item
              name="monthlyRate"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Oylik</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber
                min={0} step={100000} style={{ width: '100%', borderRadius: 8 }}
                formatter={nfmt} placeholder="3,000,000" size="large"
                parser={v => v!.replace(/,/g, '') as unknown as number}
              />
            </Form.Item>
          </div>

          {/* Kun chegaralari */}
          <Divider orientation="left" plain style={{ fontSize: 12, color: '#8c8c8c' }}>
            📅 Ijara muddati (kun)
          </Divider>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="minDays"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Minimal kun</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} placeholder="1" size="large"/>
            </Form.Item>
            <Form.Item
              name="maxDays"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Maksimal kun (ixtiyoriy)</span>}
              tooltip={{ title: "Bo'sh qoldirilsa — cheksiz", icon: <InfoCircleOutlined/> }}
            >
              <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} placeholder="Cheksiz" size="large"/>
            </Form.Item>
          </div>

          {/* Muddati */}
          <Divider orientation="left" plain style={{ fontSize: 12, color: '#8c8c8c' }}>
            🗓️ Amal qilish muddati
          </Divider>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="validFrom"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Boshlanish</span>}
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <DatePicker style={{ width: '100%', borderRadius: 8 }} format="DD.MM.YYYY" size="large"/>
            </Form.Item>
            <Form.Item
              name="validTo"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Tugash (ixtiyoriy)</span>}
              tooltip={{ title: "Bo'sh = cheksiz", icon: <InfoCircleOutlined/> }}
            >
              <DatePicker style={{ width: '100%', borderRadius: 8 }} format="DD.MM.YYYY" placeholder="Cheksiz" size="large"/>
            </Form.Item>
          </div>

          {/* Target */}
          <Divider orientation="left" plain style={{ fontSize: 12, color: '#8c8c8c' }}>
            🎯 Tarif qayerga qo'llaniladi?
          </Divider>
          <Form.Item>
            <Radio.Group
              value={applyTarget}
              onChange={e => {
                setApplyTarget(e.target.value)
                form.setFieldValue('categoryId', undefined)
                form.setFieldValue('carId', undefined)
              }}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="category">📁 Kategoriyaga</Radio.Button>
              <Radio.Button value="car">🚗 Konkret mashinaga</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {applyTarget === 'category' && (
            <Form.Item
              name="categoryId"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Kategoriya (ixtiyoriy)</span>}
              tooltip={{ title: "Bo'sh = barcha kategoriyalarga", icon: <InfoCircleOutlined/> }}
            >
              <Select
                placeholder="Kategoriya tanlang (bo'sh = umumiy)"
                allowClear size="large" style={{ borderRadius: 8 }}
              >
                {categories.map(c => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {applyTarget === 'car' && (
            <Form.Item
              name="carId"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Mashina ID</span>}
              tooltip={{ title: 'Faqat shu mashina uchun', icon: <InfoCircleOutlined/> }}
            >
              <InputNumber
                min={1} style={{ width: '100%', borderRadius: 8 }}
                placeholder="Mashina ID sini kiriting" size="large"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

// ── Tier Card ──────────────────────────────────────────────────────────────────
function TierCard({
  tier, token, onEdit, onDelete,
}: {
  tier: PricingTierDto
  token: ReturnType<typeof theme.useToken>['token']
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const pal    = tierPalette(tier.id)
  const active = isActive(tier)

  // Apply target label
  const applyBadge = tier.carId
    ? { label: `🚗 ${tier.carPlate ?? `#${tier.carId}`}`, color: '#fa8c16', bg: 'rgba(250,140,22,0.1)', border: 'rgba(250,140,22,0.25)' }
    : tier.categoryId
      ? { label: `📁 ${tier.categoryName ?? `#${tier.categoryId}`}`, color: '#722ed1', bg: 'rgba(114,46,209,0.1)', border: 'rgba(114,46,209,0.25)' }
      : { label: '🌐 Umumiy', color: '#13c2c2', bg: 'rgba(19,194,194,0.1)', border: 'rgba(19,194,194,0.25)' }

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
      {/* Top gradient bar */}
      <div style={{ height: 3, background: pal.bg }}/>

      <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: hovered ? pal.bg : `linear-gradient(135deg,${pal.color}22,${pal.color}11)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            <DollarCircleFilled style={{ fontSize: 20, color: pal.color }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 800, fontSize: 15, lineHeight: 1.3,
              color: hovered ? pal.color : token.colorText,
              transition: 'color 0.18s',
            }}>
              {tier.name}
            </div>
            <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {/* Apply badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                color: applyBadge.color, background: applyBadge.bg, border: `1px solid ${applyBadge.border}`,
              }}>
                {applyBadge.label}
              </span>
              {/* Active status */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                color: active ? '#52c41a' : '#f5222d',
                background: active ? 'rgba(82,196,26,0.1)' : 'rgba(245,34,45,0.1)',
                border: `1px solid ${active ? 'rgba(82,196,26,0.25)' : 'rgba(245,34,45,0.25)'}`,
              }}>
                <CheckCircleFilled style={{ fontSize: 10 }}/>
                {active ? 'Faol' : 'Faol emas'}
              </span>
            </div>
          </div>
        </div>

        <Divider style={{ margin: '2px 0' }}/>

        {/* Price grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
        }}>
          {[
            { label: 'Kunlik',   value: tier.dailyRate,   icon: '☀️' },
            { label: 'Haftalik', value: tier.weeklyRate,  icon: '📅' },
            { label: 'Oylik',    value: tier.monthlyRate, icon: '🗓️' },
          ].map((p, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center', padding: '10px 6px', borderRadius: 10,
                background: hovered ? pal.light : token.colorFillAlter,
                border: `1px solid ${hovered ? pal.border : token.colorBorderSecondary}`,
                transition: 'all 0.18s',
              }}
            >
              <div style={{ fontSize: 14, marginBottom: 3 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: hovered ? pal.color : token.colorText, lineHeight: 1.2 }}>
                {fmt(p.value)}
              </div>
              <div style={{ fontSize: 10, color: token.colorTextTertiary, marginTop: 2 }}>so'm</div>
              <div style={{ fontSize: 10, color: token.colorTextTertiary }}>{p.label}</div>
            </div>
          ))}
        </div>

        {/* Day range + dates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ClockCircleOutlined/> Muddat (kun)
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              padding: '1px 10px', borderRadius: 20,
              background: token.colorFillAlter,
              color: token.colorText,
            }}>
              {tier.minDays}{tier.maxDays ? ` — ${tier.maxDays}` : '+'} kun
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: token.colorTextTertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarOutlined/> Sana
            </span>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
              {format(new Date(tier.validFrom), 'dd.MM.yy')}
              {' — '}
              {tier.validTo ? format(new Date(tier.validTo), 'dd.MM.yy') : '∞'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1, padding: '9px 0',
            background: hovered ? pal.light : 'transparent',
            border: 'none', borderRight: `1px solid ${token.colorBorderSecondary}`,
            color: hovered ? pal.color : token.colorTextTertiary,
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.15s',
          }}
        >
          <EditOutlined/> Tahrirlash
        </button>
        <Popconfirm
          title="Bu tarifni o'chirishni tasdiqlaysizmi?"
          onConfirm={onDelete}
          okText="Ha, o'chir"
          cancelText="Bekor"
          okButtonProps={{ danger: true }}
        >
          <button style={{
            flex: 1, padding: '9px 0',
            background: 'transparent', border: 'none',
            color: '#ff4d4f', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.15s',
          }}>
            <DeleteOutlined/> O'chirish
          </button>
        </Popconfirm>
      </div>
    </div>
  )
}
