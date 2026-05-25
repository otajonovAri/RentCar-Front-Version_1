import { useState } from 'react'
import { Modal, Form, InputNumber, Select, Input, Switch, Button, message, Space } from 'antd'
import { DollarOutlined } from '@ant-design/icons'
import { paymentsApi } from '@/api/paymentsApi'
import type { PaymentMethod } from '@/types/payments'
import { getApiError } from '@/utils/apiError'

const METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'Cash',         label: 'Naqd pul',        icon: '💵' },
  { value: 'CreditCard',   label: 'Kredit karta',    icon: '💳' },
  { value: 'DebitCard',    label: 'Debit karta',     icon: '💳' },
  { value: 'BankTransfer', label: "Bank o'tkazmasi", icon: '🏦' },
  { value: 'Online',       label: 'Onlayn',          icon: '🌐' },
  { value: 'Click',        label: 'CLICK',           icon: '⚡' },
  { value: 'Payme',        label: 'Payme',           icon: '📱' },
]

interface Props {
  open: boolean
  initialRentalId?: number
  onClose: () => void
  onSuccess: () => void
}

export default function CreatePaymentModal({ open, initialRentalId, onClose, onSuccess }: Props) {
  const [form]    = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleOpen = () => {
    form.resetFields()
    if (initialRentalId) form.setFieldValue('rentalId', initialRentalId)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      await paymentsApi.create({
        rentalId:         values.rentalId,
        method:           values.method,
        transactionId:    values.transactionId || null,
        requiresApproval: values.requiresApproval ?? false,
      })
      message.success("✅ To'lov muvaffaqiyatli yaratildi!")
      onSuccess()
    } catch (err) {
      message.error(getApiError(err, "To'lov yaratishda xatolik"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <Space>
          <DollarOutlined style={{ color: '#1677ff' }} />
          <span>Yangi to'lov</span>
        </Space>
      }
      onCancel={onClose}
      afterOpenChange={(v) => v && handleOpen()}
      footer={null}
      width={440}
      centered
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>

        <Form.Item
          label="Ijara ID"
          name="rentalId"
          rules={[{ required: true, message: 'Ijara ID kiriting' }]}
        >
          <InputNumber
            min={1}
            placeholder="Masalan: 42"
            style={{ width: '100%' }}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="To'lov usuli"
          name="method"
          rules={[{ required: true, message: "To'lov usulini tanlang" }]}
        >
          <Select placeholder="Usulni tanlang" size="large">
            {METHODS.map(m => (
              <Select.Option key={m.value} value={m.value}>
                {m.icon} {m.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Tranzaksiya ID (ixtiyoriy)"
          name="transactionId"
        >
          <Input
            placeholder="Masalan: TXN20260504001"
            size="large"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Admin tasdig'ini talab qilsin"
          name="requiresApproval"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: -16, marginBottom: 16 }}>
          Yoqilsa — to'lov "Kutilmoqda" holatida qoladi, admin tasdiqlashi kerak
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            icon={<DollarOutlined />}
          >
            To'lov yaratish
          </Button>
        </div>

      </Form>
    </Modal>
  )
}
