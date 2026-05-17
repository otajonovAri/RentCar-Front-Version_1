import { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Input, Select, message, Tag, theme } from 'antd'
import { CarFilled, UserOutlined, SearchOutlined } from '@ant-design/icons'
import { finesApi } from '@/api/finesApi'
import { rentalsApi } from '@/api/rentalsApi'
import { useAuthStore } from '@/store/authStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { RentalDto } from '@/types/rentals'
import { format } from 'date-fns'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  Pending:   { label: 'Kutilmoqda', color: 'orange'  },
  Active:    { label: 'Aktiv',      color: 'green'   },
  Completed: { label: 'Yakunlangan',color: 'blue'    },
  Cancelled: { label: 'Bekor',      color: 'red'     },
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FineFormModal({ open, onClose, onSuccess }: Props) {
  const isMobile        = useIsMobile()
  const { token }       = theme.useToken()
  const [form]          = Form.useForm()
  const [loading,       setLoading]       = useState(false)
  const [rentals,       setRentals]       = useState<RentalDto[]>([])
  const [rentalsLoading,setRentalsLoading]= useState(false)
  const [searchText,    setSearchText]    = useState('')
  const { userId }      = useAuthStore()

  // Fetch rentals when modal opens
  useEffect(() => {
    if (!open) return
    form.resetFields()
    setSearchText('')
    fetchRentals('')
  }, [open])

  const fetchRentals = async (search: string) => {
    setRentalsLoading(true)
    try {
      const res = await rentalsApi.getAll({
        page: 1, pageSize: 50,
        ...(search ? {} : {}),   // backend search yo'q, filter client-side
      })
      setRentals(res.data.items)
    } catch {
      // silent
    } finally {
      setRentalsLoading(false)
    }
  }

  // Client-side filter
  const filteredRentals = rentals.filter(r => {
    if (!searchText) return true
    const q = searchText.toLowerCase()
    return (
      String(r.id).includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.carBrand.toLowerCase().includes(q) ||
      r.carModel.toLowerCase().includes(q) ||
      r.licensePlate.toLowerCase().includes(q)
    )
  })

  const handleOk = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      await finesApi.create({ ...values, issuedByUserId: userId! })
      message.success('✅ Jarima muvaffaqiyatli yaratildi')
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
      title={
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:'linear-gradient(135deg,#ff4d4f,#fa8c16)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span style={{ fontSize:16 }}>⚠️</span>
          </div>
          <span style={{ fontWeight:700 }}>Yangi jarima qo'shish</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Jarima qo'shish"
      okButtonProps={{ danger: true, style:{ fontWeight:600 } }}
      cancelText="Bekor"
      forceRender
      afterClose={() => form.resetFields()}
      width={isMobile ? '95vw' : 520}
    >
      <Form form={form} layout="vertical" style={{ marginTop:8 }}>

        {/* Ijara tanlash */}
        <Form.Item
          name="rentalId"
          label={
            <span style={{ fontWeight:600 }}>
              <CarFilled style={{ color:'#1677ff', marginRight:6 }}/>
              Ijara tanlang
            </span>
          }
          rules={[{ required: true, message: 'Ijarani tanlang' }]}
        >
          <Select
            showSearch
            placeholder={
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <SearchOutlined /> Ijara ID, mijoz ismi yoki mashina...
              </span>
            }
            loading={rentalsLoading}
            filterOption={false}
            onSearch={val => setSearchText(val)}
            searchValue={searchText}
            notFoundContent={
              rentalsLoading ? 'Yuklanmoqda...' : 'Ijara topilmadi'
            }
            style={{ width:'100%' }}
            size="large"
            optionLabelProp="label"
            getPopupContainer={() => document.body}
            styles={{ popup: { root: { zIndex: 2000 } } }}
          >
            {filteredRentals.map(r => {
              const st = STATUS_LABEL[r.status] ?? { label: r.status, color:'default' }
              return (
                <Select.Option
                  key={r.id}
                  value={r.id}
                  label={`#${r.id} — ${r.customerName} · ${r.carBrand} ${r.carModel}`}
                >
                  <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'2px 0' }}>
                    {/* Row 1: ID + status */}
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <Tag color="blue" style={{ margin:0, fontSize:11, fontWeight:700 }}>
                        #{r.id}
                      </Tag>
                      <Tag color={st.color} style={{ margin:0, fontSize:10 }}>
                        {st.label}
                      </Tag>
                      <span style={{
                        fontSize:11,
                        color:'#8c8c8c',
                        marginLeft:'auto',
                      }}>
                        {format(new Date(r.startDate),'dd.MM.yy')} → {format(new Date(r.endDate),'dd.MM.yy')}
                      </span>
                    </div>
                    {/* Row 2: customer + car */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                        <UserOutlined style={{ fontSize:10, color:'#8c8c8c' }}/>
                        <strong>{r.customerName}</strong>
                      </span>
                      <span style={{ color:'#d9d9d9' }}>·</span>
                      <span style={{ fontSize:12, color:'#595959' }}>
                        <CarFilled style={{ fontSize:10, color:'#1677ff', marginRight:4 }}/>
                        {r.carBrand} {r.carModel}
                        <span style={{ color:'#bfbfbf', marginLeft:5, fontFamily:'monospace' }}>
                          {r.licensePlate}
                        </span>
                      </span>
                    </div>
                    {/* Row 3: branch */}
                    <div style={{ fontSize:11, color:'#8c8c8c' }}>
                      📍 {r.pickupBranch}
                      {r.totalDays && (
                        <span style={{ marginLeft:8 }}>· {r.totalDays} kun</span>
                      )}
                    </div>
                  </div>
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>

        {/* Sabab */}
        <Form.Item
          name="description"
          label={<span style={{ fontWeight:600 }}>⚠️ Jarima sababi</span>}
          rules={[
            { required: true, message: 'Sababni kiriting' },
            { min: 5, message: "Kamida 5 ta belgi bo'lishi kerak" },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Masalan: Kechiktirilgan qaytarish — 2 kun, ichki salonni ifloslantirish..."
            style={{ borderRadius:8 }}
          />
        </Form.Item>

        {/* Miqdor */}
        <Form.Item
          name="amount"
          label={<span style={{ fontWeight:600 }}>💸 Jarima miqdori (so'm)</span>}
          rules={[
            { required: true, message: 'Miqdorni kiriting' },
            { type:'number', min:1000, message: "Kamida 1 000 so'm bo'lishi kerak" },
          ]}
        >
          <InputNumber
            min={0}
            step={10000}
            style={{ width:'100%', borderRadius:8 }}
            size="large"
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            parser={v => Number(v!.replace(/\s/g, '')) as unknown as 0}
            placeholder="100 000"
            addonAfter="so'm"
          />
        </Form.Item>

        {/* Izoh */}
        <Form.Item
          name="notes"
          label={<span style={{ fontWeight:600, color:token.colorTextSecondary }}>📝 Izoh (ixtiyoriy)</span>}
        >
          <Input.TextArea
            rows={2}
            placeholder="Qo'shimcha ma'lumot..."
            style={{ borderRadius:8 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
