import { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, message, Row, Col } from 'antd'
import { branchesApi } from '@/api/branchesApi'
import type { BranchDto } from '@/types/branches'
import { useRegions, useCities } from '@/hooks/useLookups'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  open: boolean
  branch: BranchDto | null
  onClose: () => void
  onSuccess: () => void
}

export default function BranchFormModal({ open, branch, onClose, onSuccess }: Props) {
  const isMobile = useIsMobile()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null)
  const { regions } = useRegions()
  const { cities }  = useCities(selectedRegion)

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      if (branch) {
        await branchesApi.update(branch.id, values)
        message.success('Filial yangilandi')
      } else {
        await branchesApi.create(values)
        message.success('Filial yaratildi')
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
      title={branch ? 'Filialni tahrirlash' : 'Yangi filial'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Saqlash"
      cancelText="Bekor"
      width={isMobile ? '95vw' : 560}
      forceRender
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical" initialValues={branch ?? {}}>
        <Form.Item name="name" label="Filial nomi" rules={[{ required: true, message: 'Majburiy' }]}>
          <Input placeholder="Toshkent Markaz" />
        </Form.Item>

        <Form.Item name="address" label="Manzil" rules={[{ required: true }]}>
          <Input placeholder="Amir Temur ko'chasi, 1" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="phoneNumber" label="Telefon" rules={[{ required: true }]}>
              <Input placeholder="+998712345678" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email">
              <Input placeholder="branch@rentcar.uz" />
            </Form.Item>
          </Col>
        </Row>

        {!branch && (
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="regionId" label="Viloyat" rules={[{ required: true }]}>
                <Select
                  placeholder="Viloyat tanlang"
                  onChange={(v) => { setSelectedRegion(v); form.setFieldValue('cityId', undefined) }}
                >
                  {regions.map((r) => <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cityId" label="Shahar" rules={[{ required: true }]}>
                <Select placeholder="Shahar tanlang" disabled={!selectedRegion}>
                  {cities.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="latitude" label="Kenglik (lat)">
              <Input placeholder="41.2995" type="number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="longitude" label="Uzunlik (lng)">
              <Input placeholder="69.2401" type="number" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
