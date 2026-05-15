import { useState, useEffect } from 'react'
import { Modal, Form, Select, DatePicker, Input, InputNumber, message, Row, Col, Typography } from 'antd'
import { reservationsApi } from '@/api/reservationsApi'
import { branchesApi } from '@/api/branchesApi'
import { driversApi } from '@/api/driversApi'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAuthStore } from '@/store/authStore'
import type { BranchDto } from '@/types/branches'
import type { DriverListItemDto } from '@/types/drivers'
import { format } from 'date-fns'
import { getApiError } from '@/utils/apiError'

const { Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** Oldindan tanlangan mashina ID */
  prefilledCarId?: number
  /** Mashina nomi — modal sarlavhasida */
  carLabel?: string
}

export default function ReservationFormModal({ open, onClose, onSuccess, prefilledCarId, carLabel }: Props) {
  const isMobile  = useIsMobile()
  const [form]    = Form.useForm()
  const [loading, setLoading]   = useState(false)
  const [branches, setBranches] = useState<BranchDto[]>([])
  const [drivers,  setDrivers]  = useState<DriverListItemDto[]>([])

  const userId = useAuthStore((s) => s.userId)

  useEffect(() => {
    branchesApi.getAll().then((r) => setBranches(r.data)).catch(() => {})
    driversApi.getAll().then((r)  => setDrivers(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (prefilledCarId) form.setFieldValue('carId', prefilledCarId)
    }
  }, [open, form, prefilledCarId])

  const handleOk = async () => {
    const values = await form.validateFields()
    if (!userId) { message.error('Foydalanuvchi aniqlanmadi'); return }
    setLoading(true)
    try {
      await reservationsApi.create({
        carId:          values.carId,
        userId,
        startDate:      format(values.dateRange[0].toDate(), 'yyyy-MM-dd'),
        endDate:        format(values.dateRange[1].toDate(), 'yyyy-MM-dd'),
        pickupBranchId: values.pickupBranchId,
        returnBranchId: values.returnBranchId ?? null,
        driverId:       values.driverId ?? null,
        notes:          values.notes ?? null,
      })
      message.success('Rezervatsiya muvaffaqiyatli yaratildi!')
      onSuccess()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Rezervatsiya yaratishda xatolik'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={carLabel ? `Bron qilish — ${carLabel}` : 'Yangi rezervatsiya'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Bron qilish"
      cancelText="Bekor"
      width={isMobile ? '95vw' : 580}
      forceRender
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical">

        {/* Mashina (yashirin yoki ko'rinadigan) */}
        {prefilledCarId ? (
          <>
            <Form.Item name="carId" hidden><InputNumber /></Form.Item>
            <div style={{
              marginBottom: 16,
              padding:      '8px 12px',
              background:   '#f0f5ff',
              border:       '1px solid #adc6ff',
              borderRadius: 6,
            }}>
              <Text style={{ color: '#2f54eb', fontWeight: 500 }}>
                🚗 Tanlangan mashina: <strong>{carLabel ?? `ID: ${prefilledCarId}`}</strong>
              </Text>
            </div>
          </>
        ) : (
          <Form.Item name="carId" label="Mashina ID" rules={[{ required: true, message: 'Mashina ID kiriting' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
          </Form.Item>
        )}

        {/* Sana */}
        <Form.Item
          name="dateRange"
          label="Bron muddati (boshlanish — tugash)"
          rules={[{ required: true, message: 'Sanani tanlang' }]}
        >
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            disabledDate={(d) => d && d.isBefore(new Date(), 'day')}
            format="DD.MM.YYYY"
            placeholder={['Boshlanish', 'Tugash']}
          />
        </Form.Item>

        {/* Filiallar */}
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="pickupBranchId"
              label="Qabul filiali"
              rules={[{ required: true, message: 'Filialni tanlang' }]}
            >
              <Select placeholder="Tanlang" showSearch optionFilterProp="children">
                {branches.map((b) => (
                  <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="returnBranchId" label="Qaytarish filiali (ixtiyoriy)">
              <Select placeholder="Qabul bilan bir xil" allowClear showSearch optionFilterProp="children">
                {branches.map((b) => (
                  <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Haydovchi */}
        {drivers.length > 0 && (
          <Form.Item name="driverId" label="Haydovchi (ixtiyoriy)">
            <Select placeholder="Haydovchi tanlang" allowClear showSearch optionFilterProp="children">
              {drivers.map((d) => (
                <Select.Option key={d.id} value={d.id}>
                  {d.fullName} — {d.dailyRate.toLocaleString()} so'm/kun
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Izoh */}
        <Form.Item name="notes" label="Izoh (ixtiyoriy)">
          <Input.TextArea rows={2} placeholder="Qo'shimcha ma'lumot..." />
        </Form.Item>

      </Form>
    </Modal>
  )
}
