import { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, message } from 'antd'
import { driversApi } from '@/api/driversApi'
import type { DriverListItemDto } from '@/types/drivers'
import { branchesApi } from '@/api/branchesApi'
import type { BranchDto } from '@/types/branches'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  open: boolean
  driver: DriverListItemDto | null
  onClose: () => void
  onSuccess: () => void
}

export default function DriverFormModal({ open, driver, onClose, onSuccess }: Props) {
  // DriverListItemDto faqat id ni taqdim etadi — update uchun yetarli
  const isMobile = useIsMobile()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<BranchDto[]>([])

  useEffect(() => {
    branchesApi.getAll().then((r) => setBranches(r.data))
  }, [])

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      if (driver) {
        await driversApi.update(driver.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          dailyRate: values.dailyRate,
          branchId: values.branchId,
        })
        message.success('Haydovchi yangilandi')
      } else {
        await driversApi.create({
          ...values,
          licenseExpirationDate: values.licenseExpirationDate
            ? format(values.licenseExpirationDate.toDate(), 'yyyy-MM-dd')
            : '',
        })
        message.success('Haydovchi qo\'shildi')
      }
      onSuccess()
    } catch {
      message.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={driver ? 'Haydovchi tahrirlash' : 'Yangi haydovchi'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Saqlash"
      cancelText="Bekor"
      width={isMobile ? '95vw' : 520}
      forceRender
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="firstName" label="Ism" rules={[{ required: true }]}>
              <Input placeholder="Akbar" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="lastName" label="Familya" rules={[{ required: true }]}>
              <Input placeholder="Raximov" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="phoneNumber" label="Telefon" rules={[{ required: true }]}>
          <Input placeholder="+998901234567" />
        </Form.Item>

        {!driver && (
          <>
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item name="licenseNumber" label="Guvohnoma raqami" rules={[{ required: true }]}>
                  <Input placeholder="AB1234567" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="licenseExpirationDate" label="Muddati" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} placeholder="2028-01-01" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="dailyRate" label="Kunlik stavka (so'm)" rules={[{ required: true }]}>
              <InputNumber min={0} step={10000} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="branchId" label="Filial" rules={[{ required: true }]}>
              <Select placeholder="Tanlang">
                {branches.map((b) => <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
