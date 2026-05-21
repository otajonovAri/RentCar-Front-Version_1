import { useState, useEffect } from 'react'
import { Modal, Form, Select, InputNumber, Input, Switch, Row, Col, message, Spin } from 'antd'
import { CarFilled, CalendarFilled, UserOutlined } from '@ant-design/icons'
import { inspectionsApi } from '@/api/inspectionsApi'
import { rentalsApi } from '@/api/rentalsApi'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { InspectionType } from '@/types/inspections'
import type { RentalDto } from '@/types/rentals'
import { format } from 'date-fns'

const { Option } = Select

// ── Ko'rik turlari ────────────────────────────────────────────────────────────
const TYPES: { value: InspectionType; label: string; color: string }[] = [
  { value: 'PreRental',  label: '🚗 Ijara oldidan', color: '#13c2c2' },
  { value: 'PostRental', label: '✅ Ijara keyin',   color: '#722ed1' },
  { value: 'Periodic',  label: '🔄 Muntazam',       color: '#52c41a' },
  { value: 'Damage',    label: '⚠️ Zarar',          color: '#ff4d4f' },
]

// ── Holat ranglari ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  Active:    '#52c41a',
  Pending:   '#fa8c16',
  Completed: '#722ed1',
  Cancelled: '#ff4d4f',
}
const STATUS_LABEL: Record<string, string> = {
  Active:    'Faol',
  Pending:   'Kutilmoqda',
  Completed: 'Yakunlangan',
  Cancelled: 'Bekor',
}

interface Props {
  open: boolean
  rentalId?: number          // agar tashqaridan berilsa — lock qilinadi
  onClose: () => void
  onSuccess: () => void
}

export default function InspectionFormModal({ open, rentalId, onClose, onSuccess }: Props) {
  const isMobile = useIsMobile()
  const [form] = Form.useForm()
  const [loading,        setLoading]        = useState(false)
  const [rentals,        setRentals]        = useState<RentalDto[]>([])
  const [rentalsLoading, setRentalsLoading] = useState(false)
  const [rentalSearch,   setRentalSearch]   = useState('')
  const { userId } = useAuthStore()

  // ── Ijaralarni yuklash (modal ochilganda) ─────────────────────────────────
  useEffect(() => {
    if (!open) return
    setRentalsLoading(true)
    rentalsApi.getAll({ page: 1, pageSize: 200 })
      .then(res => setRentals(res.data.items ?? []))
      .catch(() => message.error('Ijaralar yuklanmadi'))
      .finally(() => setRentalsLoading(false))
  }, [open])

  // ── Saqlash ───────────────────────────────────────────────────────────────
  const handleOk = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      await inspectionsApi.create({
        ...values,
        rentalId:          values.rentalId ?? rentalId,
        inspectedByUserId: userId!,
      })
      message.success("Texnik ko'rik yaratildi")
      form.resetFields()
      onSuccess()
    } catch {
      message.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  // ── Qidiruv filtri ─────────────────────────────────────────────────────────
  const filtered = rentals.filter(r => {
    const q = rentalSearch.toLowerCase()
    return (
      String(r.id).includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.carBrand?.toLowerCase().includes(q) ||
      r.carModel?.toLowerCase().includes(q) ||
      r.licensePlate?.toLowerCase().includes(q)
    )
  })

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#13c2c2,#36cfc9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CarFilled style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Yangi texnik ko'rik</div>
            <div style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 400 }}>Ko'rik ma'lumotlarini to'ldiring</div>
          </div>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Saqlash"
      cancelText="Bekor"
      width={isMobile ? '95vw' : 560}
      forceRender
      afterClose={() => { form.resetFields(); setRentalSearch('') }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ hasDamage: false, fuelLevelPercent: 100 }}
        style={{ marginTop: 8 }}
      >

        {/* ── Ijara tanlash ─────────────────────────────────────────────── */}
        <Form.Item
          name="rentalId"
          label={
            <span style={{ fontWeight: 600 }}>
              Ijara
              {!rentalId && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
            </span>
          }
          rules={[{ required: !rentalId, message: 'Ijarani tanlang' }]}
          initialValue={rentalId}
        >
          {rentalId ? (
            /* Agar tashqaridan berilgan bo'lsa — lock */
            <Select disabled value={rentalId}>
              <Option value={rentalId}>#{rentalId}</Option>
            </Select>
          ) : (
            <Select
              showSearch
              placeholder={
                rentalsLoading
                  ? 'Yuklanmoqda...'
                  : 'Ijara raqami, mijoz yoki mashina bo\'yicha qidiring...'
              }
              filterOption={false}
              onSearch={setRentalSearch}
              notFoundContent={
                rentalsLoading
                  ? <div style={{ textAlign: 'center', padding: 12 }}><Spin size="small" /></div>
                  : <div style={{ textAlign: 'center', padding: '12px 0', color: '#8c8c8c', fontSize: 13 }}>Natija topilmadi</div>
              }
              optionLabelProp="label"
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 320 }}
              listHeight={320}
            >
              {filtered.map(r => {
                const statusColor = STATUS_COLOR[r.status] ?? '#8c8c8c'
                const statusLabel = STATUS_LABEL[r.status] ?? r.status
                const startFmt = r.startDate ? format(new Date(r.startDate), 'dd.MM.yy') : '—'
                const endFmt   = r.endDate   ? format(new Date(r.endDate),   'dd.MM.yy') : '—'
                const label    = `#${r.id} — ${r.customerName} | ${r.carBrand} ${r.carModel}`
                return (
                  <Option key={r.id} value={r.id} label={label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
                      {/* Raqam badge */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${statusColor}18`,
                        border: `1.5px solid ${statusColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: 11, fontWeight: 800, color: statusColor,
                      }}>
                        #{r.id}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Mijoz + mashina */}
                        <div style={{
                          fontSize: 13, fontWeight: 700, color: 'inherit',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          <UserOutlined style={{ fontSize: 10, marginRight: 4, opacity: 0.6 }} />
                          {r.customerName}
                          <span style={{ margin: '0 4px', opacity: 0.4 }}>|</span>
                          <CarFilled style={{ fontSize: 10, marginRight: 4, opacity: 0.6 }} />
                          {r.carBrand} {r.carModel}
                          {r.licensePlate && (
                            <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.55, fontFamily: 'monospace' }}>
                              ({r.licensePlate})
                            </span>
                          )}
                        </div>
                        {/* Sana + holat */}
                        <div style={{ fontSize: 11, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                          <CalendarFilled style={{ fontSize: 9 }} />
                          {startFmt} → {endFmt}
                          <span style={{
                            padding: '1px 6px', borderRadius: 10,
                            background: `${statusColor}18`,
                            color: statusColor, fontWeight: 700, fontSize: 10,
                          }}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Option>
                )
              })}
            </Select>
          )}
        </Form.Item>

        {/* ── Ko'rik turi ───────────────────────────────────────────────────── */}
        <Form.Item
          name="type"
          label={<span style={{ fontWeight: 600 }}>Ko'rik turi <span style={{ color: '#ff4d4f' }}>*</span></span>}
          rules={[{ required: true, message: "Ko'rik turini tanlang" }]}
        >
          <Select placeholder="Ko'rik turini tanlang" optionLabelProp="label">
            {TYPES.map(t => (
              <Option key={t.value} value={t.value} label={t.label}>
                <span style={{ color: t.color, fontWeight: 600 }}>{t.label}</span>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* ── Yoqilg'i + Probeg ─────────────────────────────────────────────── */}
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fuelLevelPercent"
              label={<span style={{ fontWeight: 600 }}>Yoqilg'i (%) <span style={{ color: '#ff4d4f' }}>*</span></span>}
              rules={[{ required: true, message: 'Kiritish majburiy' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="mileageAtInspection"
              label={<span style={{ fontWeight: 600 }}>Probeg (km) <span style={{ color: '#ff4d4f' }}>*</span></span>}
              rules={[{ required: true, message: 'Kiritish majburiy' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Tashqi + Ichki holat ──────────────────────────────────────────── */}
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="exteriorCondition"
              label={<span style={{ fontWeight: 600 }}>Tashqi holat <span style={{ color: '#ff4d4f' }}>*</span></span>}
              rules={[{ required: true, message: 'Kiritish majburiy' }]}
            >
              <Select placeholder="Holat tanlang">
                <Option value="A'lo">⭐ A'lo</Option>
                <Option value="Yaxshi">👍 Yaxshi</Option>
                <Option value="Qoniqarli">⚠️ Qoniqarli</Option>
                <Option value="Yomon">❌ Yomon</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="interiorCondition"
              label={<span style={{ fontWeight: 600 }}>Ichki holat <span style={{ color: '#ff4d4f' }}>*</span></span>}
              rules={[{ required: true, message: 'Kiritish majburiy' }]}
            >
              <Select placeholder="Holat tanlang">
                <Option value="A'lo">⭐ A'lo</Option>
                <Option value="Yaxshi">👍 Yaxshi</Option>
                <Option value="Qoniqarli">⚠️ Qoniqarli</Option>
                <Option value="Yomon">❌ Yomon</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* ── Zarar ─────────────────────────────────────────────────────────── */}
        <Form.Item
          name="hasDamage"
          label={<span style={{ fontWeight: 600 }}>Zarar bormi?</span>}
          valuePropName="checked"
        >
          <Switch checkedChildren="✅ Ha" unCheckedChildren="❌ Yo'q" />
        </Form.Item>

        {/* ── Izoh ──────────────────────────────────────────────────────────── */}
        <Form.Item name="notes" label={<span style={{ fontWeight: 600 }}>Izoh</span>}>
          <Input.TextArea rows={3} placeholder="Qo'shimcha ma'lumotlar..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}
