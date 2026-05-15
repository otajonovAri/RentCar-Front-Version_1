import { useState, useEffect, useCallback } from 'react'
import {
  Button, Input, Modal, Form, Spin,
  Popconfirm, Grid, theme, message,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ThunderboltFilled, CheckOutlined,
} from '@ant-design/icons'
import { carFeaturesApi } from '@/api/carFeaturesApi'
import type { LookupItem } from '@/types/lookups'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'

// Icon pool — rotates through feature icons
const FEATURE_ICONS = ['❄️','🎵','🛰️','🔐','🪟','💡','🔥','⚡','🌐','📱','🎮','🚗','🛡️','🔊','💨','🧭']
const FEATURE_COLORS = [
  { color:'#1677ff', bg:'rgba(22,119,255,0.1)',  border:'rgba(22,119,255,0.2)'  },
  { color:'#722ed1', bg:'rgba(114,46,209,0.1)',  border:'rgba(114,46,209,0.2)'  },
  { color:'#13c2c2', bg:'rgba(19,194,194,0.1)',  border:'rgba(19,194,194,0.2)'  },
  { color:'#fa8c16', bg:'rgba(250,140,22,0.1)',  border:'rgba(250,140,22,0.2)'  },
  { color:'#52c41a', bg:'rgba(82,196,26,0.1)',   border:'rgba(82,196,26,0.2)'   },
  { color:'#eb2f96', bg:'rgba(235,47,150,0.1)',  border:'rgba(235,47,150,0.2)'  },
  { color:'#f5222d', bg:'rgba(245,34,45,0.1)',   border:'rgba(245,34,45,0.2)'   },
]

function featureColor(id: number) { return FEATURE_COLORS[id % FEATURE_COLORS.length] }
function featureIcon(id: number)  { return FEATURE_ICONS[id % FEATURE_ICONS.length] }

export default function CarFeaturesPage() {
  const { token }   = theme.useToken()
  const screens     = Grid.useBreakpoint()
  const isMobile    = !screens.md
  const { hasRole } = useAuthStore()
  const canEdit     = hasRole(['Admin', 'SuperAdmin'])

  const [items,    setItems]    = useState<LookupItem[]>([])
  const [filtered, setFiltered] = useState<LookupItem[]>([])
  const [loading,  setLoading]  = useState(false)
  const [search,   setSearch]   = useState('')
  const [hovered,  setHovered]  = useState<number | null>(null)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<LookupItem | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await carFeaturesApi.getAll()
      setItems(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    setFiltered(q ? items.filter(i => i.name.toLowerCase().includes(q)) : items)
  }, [search, items])

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit   = (item: LookupItem) => {
    setEditing(item); form.setFieldsValue({ name: item.name }); setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await carFeaturesApi.update(editing.id, values.name)
        message.success('✅ Xususiyat yangilandi')
      } else {
        await carFeaturesApi.create(values.name)
        message.success("✅ Xususiyat qo'shildi")
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
      await carFeaturesApi.delete(id)
      message.success("🗑️ Xususiyat o'chirildi")
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, "O'chirishda xatolik"))
    }
  }

  const cols = isMobile ? 2 : !screens.lg ? 3 : screens.xl ? 5 : 4

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#002333 0%,#006d75 50%,#13c2c2 100%)',
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
            <div style={{
              width:56, height:56, borderRadius:14, flexShrink:0,
              background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)',
              border:'1px solid rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ThunderboltFilled style={{ fontSize:28, color:'#fff' }}/>
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:isMobile?22:28, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Avtomobil Xususiyatlari
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {items.length} ta xususiyat ro'yxatda
                {search && ` · ${filtered.length} ta topildi`}
              </p>
            </div>

            {/* Stats chips */}
            {!isMobile && (
              <div style={{
                padding:'8px 20px', borderRadius:12,
                background:'rgba(255,255,255,0.12)',
                backdropFilter:'blur(6px)',
                border:'1px solid rgba(255,255,255,0.2)',
                textAlign:'center',
              }}>
                <div style={{ fontWeight:800, fontSize:24, color:'#87e8de', lineHeight:1 }}>{items.length}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2 }}>Xususiyatlar</div>
              </div>
            )}

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
                {isMobile ? '' : "Xususiyat qo'shish"}
              </Button>
            )}
          </div>

          {/* Search */}
          <Input
            prefix={<SearchOutlined style={{ color:'rgba(255,255,255,0.6)' }}/>}
            placeholder="Xususiyat nomi bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
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
          <span style={{ color:token.colorTextTertiary, fontSize:13 }}>Xususiyatlar yuklanmoqda...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>⚡</div>
          <div style={{ fontSize:18, fontWeight:700, color:token.colorText, marginBottom:6 }}>
            Xususiyat topilmadi
          </div>
          <div style={{ fontSize:13, color:token.colorTextTertiary }}>
            {search ? `"${search}" bo'yicha natija yo'q` : "Hali xususiyat qo'shilmagan"}
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                marginTop:12, padding:'8px 20px', borderRadius:20,
                background:'linear-gradient(135deg,#006d75,#13c2c2)',
                border:'none', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13,
              }}
            >
              Filterni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontSize:13, color:token.colorTextSecondary }}>
              <strong style={{ color:token.colorText }}>{filtered.length}</strong> ta xususiyat
            </span>
          </div>

          {/* Feature chips grid */}
          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${cols},1fr)`,
            gap: isMobile ? 10 : 14,
          }}>
            {filtered.map(item => {
              const cfg   = featureColor(item.id)
              const icon  = featureIcon(item.id)
              const isHov = hovered === item.id

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background:    token.colorBgContainer,
                    borderRadius:  14,
                    border:        `1.5px solid ${isHov ? cfg.color : token.colorBorderSecondary}`,
                    overflow:      'hidden',
                    transform:     isHov ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow:     isHov
                      ? `0 12px 30px ${cfg.color}22, 0 3px 8px rgba(0,0,0,0.07)`
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    transition:    'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    display:       'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Color top bar */}
                  <div style={{ height:3, background:`linear-gradient(90deg,${cfg.color},${cfg.color}88)` }}/>

                  {/* Body */}
                  <div style={{
                    padding: isMobile ? '12px 12px 10px' : '14px 14px 12px',
                    flex:1, display:'flex', flexDirection:'column', gap:8,
                  }}>
                    {/* Icon */}
                    <div style={{
                      width:40, height:40, borderRadius:10,
                      background: isHov ? cfg.bg : token.colorFillAlter,
                      border:`1px solid ${isHov ? cfg.border : token.colorBorderSecondary}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:20, transition:'all 0.18s',
                    }}>
                      {icon}
                    </div>

                    {/* Name */}
                    <div style={{
                      fontWeight:700, fontSize: isMobile ? 12 : 13,
                      color: isHov ? cfg.color : token.colorText,
                      lineHeight:1.35, transition:'color 0.18s',
                      wordBreak:'break-word',
                    }}>
                      {item.name}
                    </div>

                    {/* ID badge */}
                    <div style={{
                      display:'inline-flex', alignSelf:'flex-start',
                      padding:'1px 7px', borderRadius:20, fontSize:10,
                      background: cfg.bg, color: cfg.color,
                      border:`1px solid ${cfg.border}`,
                      fontWeight:600, fontFamily:'monospace',
                    }}>
                      #{item.id}
                    </div>
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div style={{
                      display:'flex',
                      borderTop:`1px solid ${token.colorBorderSecondary}`,
                    }}>
                      <button
                        onClick={() => openEdit(item)}
                        style={{
                          flex:1, padding:'8px 0',
                          background: isHov ? cfg.bg : 'transparent',
                          border:'none', borderRight:`1px solid ${token.colorBorderSecondary}`,
                          color: isHov ? cfg.color : token.colorTextTertiary,
                          cursor:'pointer', fontSize:13,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'all 0.15s',
                        }}
                      >
                        <EditOutlined/>
                      </button>
                      <Popconfirm
                        title="Xususiyatni o'chirish"
                        description="Bu xususiyat barcha mashinalardan olib tashlanadi."
                        onConfirm={() => handleDelete(item.id)}
                        okText="Ha, o'chir"
                        cancelText="Bekor"
                        okButtonProps={{ danger:true }}
                      >
                        <button style={{
                          flex:1, padding:'8px 0',
                          background:'transparent', border:'none',
                          color:'#ff4d4f', cursor:'pointer', fontSize:13,
                          display:'flex', alignItems:'center', justifyContent:'center',
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
        </>
      )}

      {/* ── Modal ── */}
      <Modal
        title={
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:'linear-gradient(135deg,#006d75,#13c2c2)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ThunderboltFilled style={{ color:'#fff', fontSize:15 }}/>
            </div>
            <span style={{ fontWeight:700 }}>
              {editing ? 'Xususiyatni tahrirlash' : "Yangi xususiyat qo'shish"}
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
        width={isMobile ? '95vw' : 420}
        forceRender
        afterClose={() => form.resetFields()}
      >
        <Form form={form} layout="vertical" style={{ marginTop:16 }}>
          <Form.Item
            name="name"
            label={<span style={{ fontWeight:600 }}>⚡ Xususiyat nomi</span>}
            rules={[
              { required:true, message:'Majburiy maydon' },
              { min:2, message:'Kamida 2 ta belgi' },
              { max:200, message:"Ko'pi bilan 200 ta belgi" },
            ]}
          >
            <Input
              placeholder="Konditsioner, Bluetooth, GPS, Isitgich..."
              size="large"
              style={{ borderRadius:8 }}
              suffix={saving ? undefined : <CheckOutlined style={{ color:'#13c2c2', opacity:0 }}/>}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
