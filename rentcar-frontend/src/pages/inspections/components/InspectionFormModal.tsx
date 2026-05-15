import { useState } from 'react'
import { Modal, Form, Select, InputNumber, Input, Switch, Row, Col, message } from 'antd'
import { inspectionsApi } from '@/api/inspectionsApi'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { InspectionType } from '@/types/inspections'

const TYPES: { value: InspectionType; label: string }[] = [
  { value: 'PreRental',  label: 'Ijara oldidan' },
  { value: 'PostRental', label: 'Ijara keyin' },
  { value: 'Periodic',  label: 'Muntazam' },
  { value: 'Damage',    label: 'Zarar' },
]

interface Props {
  open: boolean
  rentalId?: number
  onClose: () => void
  onSuccess: () => void
}

export default function InspectionFormModal({ open, rentalId, onClose, onSuccess }: Props) {
  const isMobile = useIsMobile()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { userId } = useAuthStore()

  const handleOk = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      await inspectionsApi.create({
        ...values,
        rentalId: values.rentalId ?? rentalId,
        inspectedByUserId: userId!,
      })
      message.success('Texnik ko\'rik yaratildi')
      form.resetFields()
      onSuccess()
    } catch {
      message.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Yangi texnik ko'rik"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Saqlash"
      cancelText="Bekor"
      width={isMobile ? '95vw' : 540}
      forceRender
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical" initialValues={{ hasDamage: false, fuelLevelPercent: 100 }}>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="rentalId" label="Ijara ID" rules={[{ required: !rentalId }]}
              initialValue={rentalId}>
              <InputNumber style={{ width: '100%' }} disabled={!!rentalId} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="type" label="Ko'rik turi" rules={[{ required: true }]}>
              <Select>
                {TYPES.map((t) => <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="fuelLevelPercent" label="Yoqilg'i (%)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="mileageAtInspection" label="Probeg (km)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="exteriorCondition" label="Tashqi holat" rules={[{ required: true }]}>
              <Input placeholder="A'lo / Yaxshi / Qoniqarli" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="interiorCondition" label="Ichki holat" rules={[{ required: true }]}>
              <Input placeholder="A'lo / Yaxshi / Qoniqarli" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="hasDamage" label="Zarar bormi?" valuePropName="checked">
          <Switch checkedChildren="Ha" unCheckedChildren="Yo'q" />
        </Form.Item>

        <Form.Item name="notes" label="Izoh">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
