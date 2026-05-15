import { useState, useEffect, useCallback } from 'react'
import {
  Button, Input, Modal, Form,
  message, Spin, Grid, Popconfirm, theme,
} from 'antd'
import {
  GlobalOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, SearchOutlined, EnvironmentOutlined,
} from '@ant-design/icons'
import { regionsApi } from '@/api/regionsApi'
import type { RegionDto } from '@/types/regions'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'

const { useBreakpoint } = Grid

const PALETTE = [
  { bar: '#52c41a', color: '#52c41a', light: 'rgba(82,196,26,0.12)',  border: 'rgba(82,196,26,0.3)'  },
  { bar: '#1677ff', color: '#1677ff', light: 'rgba(22,119,255,0.12)', border: 'rgba(22,119,255,0.3)' },
  { bar: '#13c2c2', color: '#13c2c2', light: 'rgba(19,194,194,0.12)', border: 'rgba(19,194,194,0.3)' },
  { bar: '#fa8c16', color: '#fa8c16', light: 'rgba(250,140,22,0.12)', border: 'rgba(250,140,22,0.3)' },
  { bar: '#722ed1', color: '#722ed1', light: 'rgba(114,46,209,0.12)', border: 'rgba(114,46,209,0.3)' },
  { bar: '#eb2f96', color: '#eb2f96', light: 'rgba(235,47,150,0.12)', border: 'rgba(235,47,150,0.3)' },
]

export default function RegionsPage() {
  const { token }  = theme.useToken()
  const screens    = useBreakpoint()
  const isMobile   = !screens.md
  const { hasRole } = useAuthStore()
  const canEdit    = hasRole(['Admin', 'SuperAdmin', 'Manager'])

  const [data,    setData]    = useState<PaginatedResponse<RegionDto> | null>(null)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<RegionDto | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [form] = Form.useForm()

  const { page, pageSize, onChange, reset } = usePagination()

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await regionsApi.getAll({ page, pageSize, searchTerm: search || undefined })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Modal (race condition yo'q: reset faqat ochishda) ────────────────────────
  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (region: RegionDto) => {
    setEditing(region)
    form.setFieldsValue({ name: region.name, code: region.code ?? '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    // Kechiktirilgan reset yo'q — keyingi ochishda openCreate/openEdit o'zi boshqaradi
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await regionsApi.update(editing.id, {
          id:   editing.id,
          name: values.name,
          code: values.code || null,
        })
        message.success('✅ Viloyat yangilandi')
      } else {
        await regionsApi.create({ name: values.name, code: values.code || null })
        message.success("✅ Viloyat qo'shildi")
      }
      closeModal()
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await regionsApi.delete(id)
      message.success("🗑️ Viloyat o'chirildi")
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, "O'chirishda xatolik"))
    }
  }

  const total      = data?.totalCount ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const gridCols   = isMobile ? 1 : !screens.lg ? 2 : screens.xl ? 4 : 3

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg,#092b00 0%,#135200 55%,#389e0d 100%)',
        padding: isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position: 'relative', overflow: 'hidden',
      }}>
        {[
          { s: 220, t: -80, r: -60, o: .07 },
          { s: 140, t: 20,  r: 140, o: .05 },
          { s: 100, b: -40, l: 80,  o: .07 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', background: '#fff',
            width: c.s, height: c.s, opacity: c.o,
            top: c.t, right: c.r, bottom: c.b, left: c.l,
          }}/>
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Title row */}
          <div style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            gap: 16, marginBottom: 20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GlobalOutlined style={{ fontSize: 28, color: '#fff' }}/>
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Viloyatlar
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {total} ta viloyat ro'yxatda
                {search && ` · qidirilmoqda: "${search}"`}
              </p>
            </div>

            {!isMobile && (
              <div style={{
                padding: '8px 20px', borderRadius: 12, textAlign: 'center',
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <div style={{ fontWeight: 800, fontSize: 24, color: '#b7eb8f', lineHeight: 1 }}>{total}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Viloyatlar</div>
              </div>
            )}

            {canEdit && (
              <Button
                icon={<PlusOutlined/>}
                size="large"
                onClick={openCreate}
                style={{
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.35)', color: '#fff',
                  borderRadius: 10, fontWeight: 600, flexShrink: 0,
                }}
              >
                {isMobile ? '' : "Viloyat qo'shish"}
              </Button>
            )}
          </div>

          {/* Search */}
          <Input
            prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.6)' }}/>}
            placeholder="Viloyat nomi yoki kodi bo'yicha qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); reset() }}
            allowClear
            size="large"
            style={{
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large"/>
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Viloyatlar yuklanmoqda...</span>
        </div>
      ) : !data?.items?.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Viloyatlar topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {search ? `"${search}" bo'yicha natija yo'q` : "Hali viloyat qo'shilmagan"}
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 20,
                background: 'linear-gradient(135deg,#135200,#389e0d)',
                border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}
            >
              Filterni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
              <strong style={{ color: token.colorText }}>{total}</strong> ta viloyat
            </span>
            {totalPages > 1 && (
              <span style={{ fontSize: 12, color: token.colorTextTertiary }}>
                {page} / {totalPages} sahifa
              </span>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: isMobile ? 12 : 16,
          }}>
            {data.items.map(region => (
              <RegionCard
                key={region.id}
                region={region}
                canEdit={canEdit}
                onEdit={openEdit}
                onDelete={handleDelete}
                token={token}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28, gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => onChange(p, pageSize)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                    border: page === p ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                    background: page === p
                      ? 'linear-gradient(135deg,#135200,#389e0d)'
                      : token.colorBgContainer,
                    color: page === p ? '#fff' : token.colorText,
                    fontWeight: page === p ? 700 : 400, fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MODAL ────────────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#135200,#389e0d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GlobalOutlined style={{ color: '#fff', fontSize: 14 }}/>
            </div>
            <span style={{ fontWeight: 700 }}>
              {editing ? 'Viloyatni tahrirlash' : "Yangi viloyat qo'shish"}
            </span>
          </div>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={closeModal}
        confirmLoading={saving}
        okText="Saqlash"
        cancelText="Bekor"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 700, background: '#389e0d', border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={isMobile ? '95vw' : 440}
        forceRender
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600 }}>🗺️ Viloyat nomi</span>}
            rules={[
              { required: true, message: 'Majburiy' },
              { min: 2, message: 'Kamida 2 ta belgi' },
            ]}
          >
            <Input placeholder="Toshkent viloyati" size="large" style={{ borderRadius: 8 }}/>
          </Form.Item>
          <Form.Item
            name="code"
            label={<span style={{ fontWeight: 600 }}>🔤 Kod (ixtiyoriy)</span>}
            rules={[
              { pattern: /^[A-Z0-9]*$/, message: 'Faqat katta lotin harflari va raqamlar' },
            ]}
          >
            <Input
              placeholder="TSH"
              size="large"
              maxLength={20}
              style={{ borderRadius: 8, fontFamily: 'monospace', letterSpacing: 2 }}
              onChange={e => form.setFieldValue('code', e.target.value.toUpperCase())}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ── Region Card ────────────────────────────────────────────────────────────────
function RegionCard({
  region, canEdit, onEdit, onDelete, token,
}: {
  region: RegionDto
  canEdit: boolean
  onEdit: (r: RegionDto) => void
  onDelete: (id: number) => void
  token: ReturnType<typeof theme.useToken>['token']
}) {
  const [hovered, setHovered] = useState(false)
  const pal = PALETTE[region.id % PALETTE.length]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: token.colorBgContainer,
        borderRadius: 16,
        border: `1.5px solid ${hovered ? pal.color : token.colorBorderSecondary}`,
        overflow: 'hidden',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 28px ${pal.color}22, 0 3px 8px rgba(0,0,0,0.07)`
          : '0 2px 6px rgba(0,0,0,0.04)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${pal.color},${pal.color}88)` }}/>

      <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Icon + ID */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: hovered ? pal.light : token.colorFillAlter,
            border: `1px solid ${hovered ? pal.border : token.colorBorderSecondary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            <GlobalOutlined style={{ fontSize: 20, color: pal.color }}/>
          </div>
          <span style={{
            fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
            padding: '2px 8px', borderRadius: 6,
            background: token.colorFillAlter,
            color: token.colorTextTertiary,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}>
            #{region.id}
          </span>
        </div>

        {/* Name */}
        <div style={{
          fontWeight: 800, fontSize: 15, lineHeight: 1.3,
          color: hovered ? pal.color : token.colorText,
          transition: 'color 0.18s',
        }}>
          {region.name}
        </div>

        {/* Code badge */}
        <div>
          {region.code ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
              padding: '3px 10px', borderRadius: 8, letterSpacing: 1.5,
              color: pal.color, background: pal.light,
              border: `1px solid ${pal.border}`,
            }}>
              {region.code}
            </span>
          ) : (
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 8,
              color: token.colorTextTertiary,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}>
              Kod yo'q
            </span>
          )}
        </div>

        {/* Cities count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <EnvironmentOutlined style={{ fontSize: 12, color: region.citiesCount > 0 ? '#13c2c2' : token.colorTextTertiary }}/>
          <span style={{
            fontSize: 12, fontWeight: 600,
            padding: '2px 10px', borderRadius: 20,
            color: region.citiesCount > 0 ? '#08979c' : token.colorTextTertiary,
            background: region.citiesCount > 0 ? 'rgba(19,194,194,0.1)' : token.colorFillAlter,
            border: `1px solid ${region.citiesCount > 0 ? 'rgba(19,194,194,0.3)' : token.colorBorderSecondary}`,
          }}>
            {region.citiesCount} ta shahar
          </span>
        </div>
      </div>

      {/* Footer */}
      {canEdit && (
        <div style={{
          display: 'flex',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <button
            onClick={() => onEdit(region)}
            style={{
              flex: 1, padding: '9px 0',
              background: hovered ? pal.light : 'transparent',
              border: 'none', borderRight: `1px solid ${token.colorBorderSecondary}`,
              color: hovered ? pal.color : token.colorTextTertiary,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <EditOutlined/> Tahrirlash
          </button>
          <Popconfirm
            title="Viloyatni o'chirish"
            description="Barcha shaharlar ham o'chadi. Davom etasizmi?"
            onConfirm={() => onDelete(region.id)}
            okText="Ha, o'chir"
            cancelText="Bekor"
            okButtonProps={{ danger: true }}
          >
            <button style={{
              flex: 1, padding: '9px 0',
              background: 'transparent', border: 'none',
              color: '#ff4d4f', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s',
            }}>
              <DeleteOutlined/> O'chirish
            </button>
          </Popconfirm>
        </div>
      )}
    </div>
  )
}
