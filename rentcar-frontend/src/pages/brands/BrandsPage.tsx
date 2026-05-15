import { useState, useEffect, useCallback } from 'react'
import {
  Button, Input, Modal, Form, Spin, Pagination,
  Popconfirm, Grid, theme, message, Image,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ShopFilled, CarFilled, AppstoreFilled,
  GlobalOutlined,
} from '@ant-design/icons'
import { brandsApi } from '@/api/brandsApi'
import type { BrandDto } from '@/types/brands'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'

// Brand logo fallback gradient palette
const BRAND_PALETTE = [
  'linear-gradient(135deg,#fa8c16,#fadb14)',
  'linear-gradient(135deg,#1677ff,#6366f1)',
  'linear-gradient(135deg,#f5222d,#ff7875)',
  'linear-gradient(135deg,#13c2c2,#52c41a)',
  'linear-gradient(135deg,#722ed1,#eb2f96)',
  'linear-gradient(135deg,#fa541c,#faad14)',
]

function brandGradient(id: number) {
  return BRAND_PALETTE[id % BRAND_PALETTE.length]
}

function brandInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

export default function BrandsPage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md
  const { hasRole } = useAuthStore()
  const canEdit    = hasRole(['Admin', 'SuperAdmin'])

  const [data,      setData]      = useState<PaginatedResponse<BrandDto> | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [hovered,   setHovered]   = useState<number | null>(null)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<BrandDto | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const [form] = Form.useForm()

  const { page, pageSize, onChange, reset } = usePagination()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await brandsApi.getAll({ page, pageSize, search: search || undefined })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setEditing(null); setLogoPreview(''); form.resetFields(); setModalOpen(true)
  }
  const openEdit = (b: BrandDto) => {
    setEditing(b); setLogoPreview(b.logoUrl ?? '');
    form.setFieldsValue({ name: b.name, country: b.country ?? '', logoUrl: b.logoUrl ?? '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await brandsApi.update(editing.id, { name: values.name, country: values.country || null, logoUrl: values.logoUrl || null })
        message.success('✅ Brend yangilandi')
      } else {
        await brandsApi.create({ name: values.name, country: values.country || null, logoUrl: values.logoUrl || null })
        message.success("✅ Brend qo'shildi")
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
      await brandsApi.delete(id)
      message.success("🗑️ Brend o'chirildi")
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, "O'chirishda xatolik"))
    }
  }

  const items  = data?.items ?? []
  const total  = data?.totalCount ?? 0
  const cols   = isMobile ? 1 : !screens.lg ? 2 : screens.xl ? 4 : 3

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#3d1500 0%,#d4380d 50%,#fa8c16 100%)',
        padding:      isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position:     'relative',
        overflow:     'hidden',
      }}>
        {[{s:200,t:-70,r:-50,o:.07},{s:130,t:30,r:120,o:.05},{s:90,b:-30,l:60,o:.07}].map((c,i)=>(
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
              <ShopFilled style={{ fontSize:28, color:'#fff' }}/>
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:isMobile?22:28, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Brendlar
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {total} ta brend ro'yxatda
              </p>
            </div>

            {/* Stats */}
            {!isMobile && (
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { label:'Brendlar',  val:total,                                        color:'#ffe58f' },
                  { label:'Modellar',  val:items.reduce((s,b)=>s+b.modelsCount,0),       color:'#95f985' },
                  { label:'Mashinalar',val:items.reduce((s,b)=>s+b.carsCount,0),         color:'#91caff' },
                ].map((s,i) => (
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
                {isMobile ? '' : "Brend qo'shish"}
              </Button>
            )}
          </div>

          {/* Search */}
          <Input
            prefix={<SearchOutlined style={{ color:'rgba(255,255,255,0.6)' }}/>}
            placeholder="Brend nomi bo'yicha qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); reset() }}
            allowClear
            size="large"
            style={{
              borderRadius:12,
              background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
              border:'1px solid rgba(255,255,255,0.3)',
              color:'#fff', fontSize:14,
            }}
          />
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:80, gap:16 }}>
          <Spin size="large"/>
          <span style={{ color:token.colorTextTertiary, fontSize:13 }}>Brendlar yuklanmoqda...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🏷️</div>
          <div style={{ fontSize:18, fontWeight:700, color:token.colorText, marginBottom:6 }}>
            Brend topilmadi
          </div>
          <div style={{ fontSize:13, color:token.colorTextTertiary }}>
            {search ? `"${search}" bo'yicha natija yo'q` : "Hali brend qo'shilmagan"}
          </div>
          {search && (
            <button
              style={{
                marginTop:12, padding:'8px 20px', borderRadius:20,
                background:'linear-gradient(135deg,#d4380d,#fa8c16)',
                border:'none', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13,
              }}
              onClick={() => { setSearch(''); reset() }}
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
              <strong style={{ color:token.colorText }}>{total}</strong> ta brend
            </span>
          </div>

          {/* Cards grid */}
          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${cols},1fr)`,
            gap: isMobile ? 14 : 18,
            marginBottom: 24,
          }}>
            {items.map(brand => {
              const isHov = hovered === brand.id
              const grad  = brandGradient(brand.id)

              return (
                <div
                  key={brand.id}
                  onMouseEnter={() => setHovered(brand.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background:    token.colorBgContainer,
                    borderRadius:  16,
                    border:        `1.5px solid ${isHov ? '#fa8c16' : token.colorBorderSecondary}`,
                    overflow:      'hidden',
                    transform:     isHov ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow:     isHov
                      ? '0 16px 40px rgba(250,140,22,0.18), 0 4px 12px rgba(0,0,0,0.08)'
                      : '0 2px 8px rgba(0,0,0,0.05)',
                    transition:    'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    display:       'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Top color bar */}
                  <div style={{ height:4, background:grad }}/>

                  {/* Logo area */}
                  <div style={{
                    padding:'20px 20px 14px',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                    background: isHov ? 'rgba(250,140,22,0.04)' : 'transparent',
                    transition:'background 0.2s',
                  }}>
                    {/* Logo / initials */}
                    <div style={{
                      width:72, height:72, borderRadius:18,
                      background: brand.logoUrl ? token.colorFillAlter : grad,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      overflow:'hidden',
                      border:`2px solid ${token.colorBorderSecondary}`,
                      boxShadow: isHov ? '0 8px 24px rgba(250,140,22,0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
                      transition:'box-shadow 0.2s',
                      flexShrink:0,
                    }}>
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          style={{ width:'100%', height:'100%', objectFit:'contain', padding:8 }}
                          onError={e => {
                            const el = e.target as HTMLImageElement
                            el.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span style={{ color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1 }}>
                          {brandInitials(brand.name)}
                        </span>
                      )}
                    </div>

                    {/* Brand name */}
                    <div style={{ textAlign:'center' }}>
                      <div style={{
                        fontWeight:800, fontSize:16, color:token.colorText,
                        lineHeight:1.2,
                      }}>
                        {brand.name}
                      </div>
                      {brand.country && (
                        <div style={{
                          display:'inline-flex', alignItems:'center', gap:4,
                          marginTop:5, fontSize:11, color:token.colorTextSecondary,
                          padding:'2px 8px', borderRadius:20,
                          background:token.colorFillAlter,
                          border:`1px solid ${token.colorBorderSecondary}`,
                        }}>
                          <GlobalOutlined style={{ fontSize:10 }}/> {brand.country}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{
                    display:'flex',
                    borderTop:`1px solid ${token.colorBorderSecondary}`,
                    borderBottom: canEdit ? `1px solid ${token.colorBorderSecondary}` : 'none',
                  }}>
                    {[
                      { icon:<AppstoreFilled style={{ fontSize:11, color:'#722ed1' }}/>, val:brand.modelsCount, label:'Model' },
                      { icon:<CarFilled style={{ fontSize:11, color:'#1677ff' }}/>,      val:brand.carsCount,   label:'Mashina' },
                    ].map((s,i) => (
                      <div key={i} style={{
                        flex:1, padding:'10px 12px', textAlign:'center',
                        borderRight: i === 0 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:2 }}>
                          {s.icon}
                          <span style={{ fontWeight:800, fontSize:16, color:token.colorText }}>
                            {s.val}
                          </span>
                        </div>
                        <div style={{ fontSize:10, color:token.colorTextTertiary }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions footer */}
                  {canEdit && (
                    <div style={{
                      padding:'8px 12px',
                      display:'flex', gap:8,
                      background:token.colorFillAlter,
                    }}>
                      <button
                        onClick={() => openEdit(brand)}
                        style={{
                          flex:1, padding:'6px 0', borderRadius:8, cursor:'pointer',
                          background: isHov ? 'rgba(22,119,255,0.1)' : 'transparent',
                          border:`1px solid ${isHov ? '#1677ff' : token.colorBorderSecondary}`,
                          color: isHov ? '#1677ff' : token.colorTextSecondary,
                          fontWeight:600, fontSize:12,
                          display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                          transition:'all 0.15s',
                        }}
                      >
                        <EditOutlined/> Tahrirlash
                      </button>
                      <Popconfirm
                        title="Brendni o'chirish"
                        description="Bu amalni bekor qilib bo'lmaydi."
                        onConfirm={() => handleDelete(brand.id)}
                        okText="Ha, o'chir"
                        cancelText="Bekor"
                        okButtonProps={{ danger:true }}
                      >
                        <button style={{
                          padding:'6px 10px', borderRadius:8, cursor:'pointer',
                          background:'transparent',
                          border:`1px solid ${token.colorBorderSecondary}`,
                          color:'#ff4d4f',
                          display:'flex', alignItems:'center', gap:4,
                          transition:'all 0.15s',
                          fontSize:12,
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
              background:'linear-gradient(135deg,#d4380d,#fa8c16)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ShopFilled style={{ color:'#fff', fontSize:15 }}/>
            </div>
            <span style={{ fontWeight:700 }}>
              {editing ? 'Brendni tahrirlash' : "Yangi brend qo'shish"}
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
        width={isMobile ? '95vw' : 480}
        forceRender
        afterClose={() => form.resetFields()}
      >
        <Form form={form} layout="vertical" style={{ marginTop:16 }}>
          <Form.Item
            name="name"
            label={<span style={{ fontWeight:600 }}>🏷️ Brend nomi</span>}
            rules={[{ required:true, message:'Majburiy' }, { min:2, message:'Kamida 2 ta belgi' }]}
          >
            <Input placeholder="Toyota, BMW, Mercedes..." size="large" style={{ borderRadius:8 }}/>
          </Form.Item>

          <Form.Item
            name="country"
            label={<span style={{ fontWeight:600 }}>🌍 Davlat (ixtiyoriy)</span>}
          >
            <Input placeholder="Yaponiya, Germaniya, Italiya..." size="large" style={{ borderRadius:8 }}/>
          </Form.Item>

          <Form.Item
            name="logoUrl"
            label={<span style={{ fontWeight:600 }}>🖼️ Logo URL (ixtiyoriy)</span>}
          >
            <Input
              placeholder="https://example.com/logo.png"
              size="large"
              style={{ borderRadius:8 }}
              onChange={e => setLogoPreview(e.target.value)}
            />
          </Form.Item>

          {logoPreview && (
            <div style={{
              marginBottom:16, padding:12, borderRadius:10,
              background:token.colorFillAlter,
              border:`1px solid ${token.colorBorderSecondary}`,
              textAlign:'center',
            }}>
              <div style={{ fontSize:11, color:token.colorTextTertiary, marginBottom:8 }}>Logo ko'rinishi:</div>
              <Image
                src={logoPreview}
                alt="Logo preview"
                height={64}
                style={{ objectFit:'contain', borderRadius:8 }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
            </div>
          )}
        </Form>
      </Modal>
    </div>
  )
}
