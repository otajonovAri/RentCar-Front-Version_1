import { useState, useEffect, useCallback } from 'react'
import {
  Button, Input, Modal, Form, Spin, Pagination,
  Popconfirm, Select, Grid, theme, message,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, AppstoreFilled, CarFilled, ShopFilled,
} from '@ant-design/icons'
import { carModelsApi } from '@/api/carModelsApi'
import { brandsApi } from '@/api/brandsApi'
import type { CarModelDto, BrandDto } from '@/types/brands'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'

// Brand color palette — consistent with BrandsPage
const BRAND_PALETTE = [
  'linear-gradient(135deg,#fa8c16,#fadb14)',
  'linear-gradient(135deg,#1677ff,#6366f1)',
  'linear-gradient(135deg,#f5222d,#ff7875)',
  'linear-gradient(135deg,#13c2c2,#52c41a)',
  'linear-gradient(135deg,#722ed1,#eb2f96)',
  'linear-gradient(135deg,#fa541c,#faad14)',
]
const BRAND_COLORS = ['#fa8c16','#1677ff','#f5222d','#13c2c2','#722ed1','#fa541c']

function brandGradient(id: number) { return BRAND_PALETTE[id % BRAND_PALETTE.length] }
function brandColor(id: number)    { return BRAND_COLORS[id % BRAND_COLORS.length] }

export default function CarModelsPage() {
  const { token }   = theme.useToken()
  const screens     = Grid.useBreakpoint()
  const isMobile    = !screens.md
  const { hasRole } = useAuthStore()
  const canEdit     = hasRole(['Admin', 'SuperAdmin'])

  const [data,         setData]         = useState<PaginatedResponse<CarModelDto> | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [search,       setSearch]       = useState('')
  const [filterBrandId,setFilterBrandId]= useState<number | undefined>()
  const [hovered,      setHovered]      = useState<number | null>(null)

  const [brands,       setBrands]       = useState<BrandDto[]>([])
  const [brandsLoading,setBrandsLoading]= useState(false)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<CarModelDto | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [form] = Form.useForm()

  const { page, pageSize, onChange, reset } = usePagination()

  const fetchBrands = useCallback(async () => {
    setBrandsLoading(true)
    try {
      const res = await brandsApi.getAll({ pageSize: 200 })
      setBrands(res.data.items)
    } finally {
      setBrandsLoading(false)
    }
  }, [])

  useEffect(() => { fetchBrands() }, [fetchBrands])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await carModelsApi.getAll({
        page, pageSize,
        search: search || undefined,
        brandId: filterBrandId,
      })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, filterBrandId])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setEditing(null); form.resetFields(); setModalOpen(true)
  }
  const openEdit = (m: CarModelDto) => {
    setEditing(m); form.setFieldsValue({ name: m.name, brandId: m.brandId }); setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await carModelsApi.update(editing.id, values.name)
        message.success('✅ Model yangilandi')
      } else {
        await carModelsApi.create({ name: values.name, brandId: values.brandId })
        message.success("✅ Model qo'shildi")
      }
      setModalOpen(false); fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await carModelsApi.delete(id)
      message.success("🗑️ Model o'chirildi")
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, "O'chirishda xatolik"))
    }
  }

  const items = data?.items ?? []
  const total = data?.totalCount ?? 0
  const cols  = isMobile ? 1 : !screens.lg ? 2 : screens.xl ? 4 : 3

  // Active brand filter info
  const activeBrand = filterBrandId ? brands.find(b => b.id === filterBrandId) : null

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#0d0a3d 0%,#1677ff 50%,#6366f1 100%)',
        padding:      isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position:     'relative',
        overflow:     'hidden',
      }}>
        {[{s:200,t:-70,r:-50,o:.07},{s:140,t:30,r:130,o:.05},{s:90,b:-30,l:60,o:.07}].map((c,i)=>(
          <div key={i} style={{
            position:'absolute', borderRadius:'50%', background:'#fff',
            width:c.s, height:c.s, opacity:c.o,
            top:c.t, right:c.r, bottom:c.b, left:c.l,
          }}/>
        ))}

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{
            display:'flex', alignItems: isMobile ? 'flex-start' : 'center',
            gap:16, marginBottom:20, flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Icon */}
            <div style={{
              width:56, height:56, borderRadius:14, flexShrink:0,
              background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)',
              border:'1px solid rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <AppstoreFilled style={{ fontSize:28, color:'#fff' }}/>
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:isMobile?22:28, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Modellar
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {total} ta model
                {activeBrand ? ` · ${activeBrand.name} brendida` : ' ro\'yxatda'}
              </p>
            </div>

            {/* Stats */}
            {!isMobile && (
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { label:"Modellar",   val:total,                                        color:'#91caff' },
                  { label:"Mashinalar", val:items.reduce((s,m)=>s+m.carsCount,0),         color:'#95f985' },
                  { label:"Brendlar",   val:brands.length,                                color:'#ffe58f' },
                ].map((s,i)=>(
                  <div key={i} style={{
                    padding:'8px 16px', borderRadius:12,
                    background:'rgba(255,255,255,0.12)',
                    backdropFilter:'blur(6px)',
                    border:'1px solid rgba(255,255,255,0.2)',
                    textAlign:'center',
                  }}>
                    <div style={{ fontWeight:800, fontSize:18, color:s.color, lineHeight:1 }}>{s.val}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Add button */}
            {canEdit && (
              <Button
                icon={<PlusOutlined/>}
                size="large"
                onClick={openCreate}
                style={{
                  background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)',
                  border:'1px solid rgba(255,255,255,0.35)', color:'#fff',
                  borderRadius:10, fontWeight:600, flexShrink:0,
                }}
              >
                {isMobile ? '' : "Model qo'shish"}
              </Button>
            )}
          </div>

          {/* Search + Brand filter */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Input
              prefix={<SearchOutlined style={{ color:'rgba(255,255,255,0.6)' }}/>}
              placeholder="Model nomi bo'yicha qidirish..."
              value={search}
              onChange={e => { setSearch(e.target.value); reset() }}
              allowClear
              size="large"
              style={{
                flex:2, minWidth:160, borderRadius:12,
                background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
                border:'1px solid rgba(255,255,255,0.3)',
                color:'#fff', fontSize:14,
              }}
            />
            <Select
              placeholder="Brend bo'yicha..."
              allowClear
              loading={brandsLoading}
              value={filterBrandId}
              onChange={val => { setFilterBrandId(val); reset() }}
              showSearch
              optionFilterProp="label"
              size="large"
              style={{ flex:1, minWidth:160 }}
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              styles={{
                popup: { root: { zIndex: 1100 } },
              }}
            />
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:80, gap:16 }}>
          <Spin size="large"/>
          <span style={{ color:token.colorTextTertiary, fontSize:13 }}>Modellar yuklanmoqda...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🚗</div>
          <div style={{ fontSize:18, fontWeight:700, color:token.colorText, marginBottom:6 }}>
            Model topilmadi
          </div>
          <div style={{ fontSize:13, color:token.colorTextTertiary }}>
            {search || filterBrandId ? 'Bu filtr bo\'yicha natija yo\'q' : "Hali model qo'shilmagan"}
          </div>
          {(search || filterBrandId) && (
            <button
              style={{
                marginTop:12, padding:'8px 20px', borderRadius:20,
                background:'linear-gradient(135deg,#1677ff,#6366f1)',
                border:'none', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13,
              }}
              onClick={() => { setSearch(''); setFilterBrandId(undefined); reset() }}
            >
              Filterni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontSize:13, color:token.colorTextSecondary }}>
              <strong style={{ color:token.colorText }}>{total}</strong> ta model
              {activeBrand && (
                <span style={{
                  marginLeft:8, padding:'1px 10px', borderRadius:20, fontSize:12,
                  background:`${brandColor(activeBrand.id)}15`,
                  border:`1px solid ${brandColor(activeBrand.id)}40`,
                  color: brandColor(activeBrand.id), fontWeight:600,
                }}>
                  {activeBrand.name}
                </span>
              )}
            </span>
          </div>

          {/* Cards grid */}
          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${cols},1fr)`,
            gap: isMobile ? 14 : 18,
            marginBottom: 24,
          }}>
            {items.map(model => {
              const isHov    = hovered === model.id
              const bColor   = brandColor(model.brandId)
              const bGrad    = brandGradient(model.brandId)

              return (
                <div
                  key={model.id}
                  onMouseEnter={() => setHovered(model.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background:    token.colorBgContainer,
                    borderRadius:  16,
                    border:        `1.5px solid ${isHov ? bColor : token.colorBorderSecondary}`,
                    overflow:      'hidden',
                    transform:     isHov ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow:     isHov
                      ? `0 16px 40px ${bColor}22, 0 4px 12px rgba(0,0,0,0.08)`
                      : '0 2px 8px rgba(0,0,0,0.05)',
                    transition:    'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    display:       'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Brand gradient top bar */}
                  <div style={{ height:4, background:bGrad }}/>

                  {/* Card body */}
                  <div style={{
                    padding:'16px 16px 14px', flex:1,
                    display:'flex', flexDirection:'column', gap:10,
                  }}>
                    {/* Brand chip */}
                    <div style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      padding:'3px 10px', borderRadius:20,
                      background:`${bColor}12`,
                      border:`1px solid ${bColor}30`,
                      color: bColor, fontWeight:700, fontSize:11,
                      alignSelf:'flex-start',
                    }}>
                      <ShopFilled style={{ fontSize:10 }}/> {model.brandName}
                    </div>

                    {/* Model icon + name */}
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{
                        width:48, height:48, borderRadius:12, flexShrink:0,
                        background: isHov ? bGrad : `${bColor}12`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all 0.2s',
                        boxShadow: isHov ? `0 6px 18px ${bColor}40` : 'none',
                      }}>
                        <AppstoreFilled style={{
                          fontSize:22,
                          color: isHov ? '#fff' : bColor,
                          transition:'color 0.2s',
                        }}/>
                      </div>
                      <div>
                        <div style={{ fontWeight:800, fontSize:16, color:token.colorText, lineHeight:1.2 }}>
                          {model.name}
                        </div>
                        <div style={{ fontSize:11, color:token.colorTextTertiary, marginTop:2 }}>
                          {model.brandName} · Model
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height:1, background:token.colorBorderSecondary }}/>

                    {/* Cars count */}
                    <div style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'7px 10px', borderRadius:8,
                      background: model.carsCount > 0
                        ? 'rgba(22,119,255,0.06)'
                        : token.colorFillAlter,
                      border:`1px solid ${model.carsCount > 0 ? 'rgba(22,119,255,0.15)' : token.colorBorderSecondary}`,
                    }}>
                      <CarFilled style={{ color: model.carsCount > 0 ? '#1677ff' : token.colorTextTertiary, fontSize:14 }}/>
                      <span style={{
                        fontWeight:700, fontSize:14,
                        color: model.carsCount > 0 ? '#1677ff' : token.colorTextTertiary,
                      }}>
                        {model.carsCount}
                      </span>
                      <span style={{ fontSize:12, color:token.colorTextTertiary }}>
                        ta mashina
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  {canEdit && (
                    <div style={{
                      padding:'8px 12px',
                      borderTop:`1px solid ${token.colorBorderSecondary}`,
                      background:token.colorFillAlter,
                      display:'flex', gap:8,
                    }}>
                      <button
                        onClick={() => openEdit(model)}
                        style={{
                          flex:1, padding:'6px 0', borderRadius:8, cursor:'pointer',
                          background: isHov ? `${bColor}12` : 'transparent',
                          border:`1px solid ${isHov ? bColor : token.colorBorderSecondary}`,
                          color: isHov ? bColor : token.colorTextSecondary,
                          fontWeight:600, fontSize:12,
                          display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                          transition:'all 0.15s',
                        }}
                      >
                        <EditOutlined/> Tahrirlash
                      </button>
                      <Popconfirm
                        title="Modelni o'chirish"
                        description="Bu amalni bekor qilib bo'lmaydi."
                        onConfirm={() => handleDelete(model.id)}
                        okText="Ha, o'chir"
                        cancelText="Bekor"
                        okButtonProps={{ danger:true }}
                      >
                        <button style={{
                          padding:'6px 10px', borderRadius:8, cursor:'pointer',
                          background:'transparent',
                          border:`1px solid ${token.colorBorderSecondary}`,
                          color:'#ff4d4f', fontSize:12,
                          display:'flex', alignItems:'center',
                          transition:'all 0.15s',
                        }}>
                          <DeleteOutlined/>
                        </button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <Pagination
                current={page} pageSize={pageSize} total={total}
                onChange={onChange} showSizeChanger
                showTotal={t => `Jami ${t} ta`} responsive
              />
            </div>
          )}
        </>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        title={
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:'linear-gradient(135deg,#1677ff,#6366f1)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <AppstoreFilled style={{ color:'#fff', fontSize:15 }}/>
            </div>
            <span style={{ fontWeight:700 }}>
              {editing ? 'Modelni tahrirlash' : "Yangi model qo'shish"}
            </span>
          </div>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Saqlash"
        cancelText="Bekor"
        okButtonProps={{ style:{ borderRadius:8, fontWeight:700 } }}
        width={isMobile ? '95vw' : 440}
        forceRender
        afterClose={() => form.resetFields()}
      >
        <Form form={form} layout="vertical" style={{ marginTop:16 }}>
          {/* Brend — create only */}
          {!editing ? (
            <Form.Item
              name="brandId"
              label={<span style={{ fontWeight:600 }}>🏷️ Brend</span>}
              rules={[{ required:true, message:'Brend tanlanishi shart' }]}
            >
              <Select
                placeholder="Brendni tanlang..."
                size="large"
                showSearch
                optionFilterProp="label"
                loading={brandsLoading}
                style={{ borderRadius:8 }}
                options={brands.map(b => ({ value: b.id, label: b.name }))}
              />
            </Form.Item>
          ) : (
            <Form.Item label={<span style={{ fontWeight:600 }}>🏷️ Brend</span>}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:8,
                background:`${brandColor(editing.brandId)}12`,
                border:`1px solid ${brandColor(editing.brandId)}30`,
                color: brandColor(editing.brandId), fontWeight:700,
              }}>
                <ShopFilled/> {editing.brandName}
              </div>
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label={<span style={{ fontWeight:600 }}>🚗 Model nomi</span>}
            rules={[{ required:true, message:'Majburiy' }, { min:1, message:'Kamida 1 ta belgi' }]}
          >
            <Input
              placeholder="Camry, X5, E-Class, Malibu..."
              size="large"
              style={{ borderRadius:8 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
