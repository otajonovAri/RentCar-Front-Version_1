import { useState, useEffect, useCallback } from 'react'
import {
  Button, Input, Modal, Form, Select,
  message, Spin, Grid, Popconfirm, theme,
} from 'antd'
import {
  EnvironmentFilled, PlusOutlined, EditOutlined,
  DeleteOutlined, SearchOutlined, BankFilled,
} from '@ant-design/icons'
import { citiesApi } from '@/api/citiesApi'
import type { CityDto } from '@/types/regions'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useRegions } from '@/hooks/useLookups'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'

const { useBreakpoint } = Grid

// ── colour palette — rgba so it works in both light & dark ───────────────────
const PALETTE = [
  { bar: '#1677ff', color: '#1677ff', light: 'rgba(22,119,255,0.12)',  border: 'rgba(22,119,255,0.3)'  },
  { bar: '#52c41a', color: '#52c41a', light: 'rgba(82,196,26,0.12)',   border: 'rgba(82,196,26,0.3)'   },
  { bar: '#722ed1', color: '#722ed1', light: 'rgba(114,46,209,0.12)',  border: 'rgba(114,46,209,0.3)'  },
  { bar: '#fa8c16', color: '#fa8c16', light: 'rgba(250,140,22,0.12)',  border: 'rgba(250,140,22,0.3)'  },
  { bar: '#eb2f96', color: '#eb2f96', light: 'rgba(235,47,150,0.12)',  border: 'rgba(235,47,150,0.3)'  },
  { bar: '#13c2c2', color: '#13c2c2', light: 'rgba(19,194,194,0.12)', border: 'rgba(19,194,194,0.3)'  },
]

// ── individual city card ──────────────────────────────────────────────────────
interface CityCardProps {
  city: CityDto
  canEdit: boolean
  onEdit: (city: CityDto) => void
  onDelete: (id: number) => void
  token: ReturnType<typeof theme.useToken>['token']
}

function CityCard({ city, canEdit, onEdit, onDelete, token }: CityCardProps) {
  const [hovered, setHovered] = useState(false)
  const palette = PALETTE[city.id % PALETTE.length]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: token.colorBgContainer,
        border: `1px solid ${hovered ? palette.border : token.colorBorderSecondary}`,
        boxShadow: hovered
          ? '0 8px 32px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* coloured top bar */}
      <div style={{ height: 5, background: palette.bar }} />

      {/* body */}
      <div style={{ padding: '20px 18px 14px', flex: 1 }}>
        {/* icon circle + id badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: palette.light,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <EnvironmentFilled style={{ fontSize: 22, color: palette.color }} />
          </div>
          <span
            style={{
              fontSize: 11,
              color: token.colorTextTertiary,
              fontFamily: 'monospace',
              background: token.colorFillAlter,
              padding: '2px 7px',
              borderRadius: 6,
            }}
          >
            #{city.id}
          </span>
        </div>

        {/* city name */}
        <div
          style={{
            fontWeight: 700, fontSize: 16,
            color: hovered ? palette.color : token.colorText,
            transition: 'color 0.2s',
            marginBottom: 10, lineHeight: 1.3,
          }}
        >
          {city.name}
        </div>

        {/* region badge */}
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: '#722ed1',
              background: 'rgba(114,46,209,0.12)',
              border: '1px solid rgba(114,46,209,0.3)',
              borderRadius: 20, padding: '2px 10px', fontWeight: 500,
            }}
          >
            {city.regionName}
          </span>
        </div>

        {/* branches count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BankFilled
            style={{
              fontSize: 13,
              color: city.branchesCount > 0 ? '#52c41a' : token.colorTextTertiary,
            }}
          />
          <span
            style={{
              fontSize: 13,
              color: city.branchesCount > 0 ? '#389e0d' : token.colorTextTertiary,
              fontWeight: 500,
            }}
          >
            {city.branchesCount} ta filial
          </span>
        </div>
      </div>

      {/* footer with actions */}
      {canEdit && (
        <div
          style={{
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            padding: '10px 18px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: hovered ? token.colorFillAlter : token.colorBgContainer,
            transition: 'background 0.2s',
          }}
        >
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(city)}
            style={{ borderRadius: 6 }}
          >
            Tahrirlash
          </Button>
          <Popconfirm
            title="Shahani o'chirish"
            description="Bu shahardagi barcha filiallar ham o'chadi. Davom etasizmi?"
            onConfirm={() => onDelete(city.id)}
            okText="Ha"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
          </Popconfirm>
        </div>
      )}
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function CitiesPage() {
  const { token } = theme.useToken()
  const screens   = useBreakpoint()
  const isMobile  = !screens.md
  const { hasRole } = useAuthStore()
  const canEdit   = hasRole(['Admin', 'SuperAdmin', 'Manager'])

  const [data,    setData]    = useState<PaginatedResponse<CityDto> | null>(null)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [regionFilter, setRegionFilter] = useState<number | undefined>()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<CityDto | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [form] = Form.useForm()

  const { page, pageSize, onChange, reset } = usePagination()
  const { regions } = useRegions()

  // ── fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await citiesApi.getAll({
        page, pageSize,
        searchTerm: search || undefined,
        regionId: regionFilter,
      })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, regionFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // ── modal (race condition yo'q: reset faqat ochishda) ───────────────────────
  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (city: CityDto) => {
    setEditing(city)
    form.setFieldsValue({ name: city.name, regionId: city.regionId })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false) }

  // ── save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await citiesApi.update(editing.id, {
          id: editing.id,
          name: values.name,
          regionId: values.regionId,
        })
        message.success('✅ Shahar yangilandi')
      } else {
        await citiesApi.create({ name: values.name, regionId: values.regionId })
        message.success("✅ Shahar qo'shildi")
      }
      closeModal()
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally {
      setSaving(false)
    }
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await citiesApi.delete(id)
      message.success("🗑️ Shahar o'chirildi")
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

      {/* ── HERO — RegionsPage bilan bir xil tuzilish ─────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg,#001333 0%,#003a8c 55%,#1677ff 100%)',
        padding: isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        {[
          { s: 220, t: -80, r: -60, o: 0.07 },
          { s: 140, t: 20,  r: 140, o: 0.05 },
          { s: 100, b: -40, l: 80,  o: 0.07 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', background: '#fff',
            width: c.s, height: c.s, opacity: c.o,
            top: c.t, right: c.r, bottom: c.b, left: c.l,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Title row */}
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 16, marginBottom: 20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* glass icon box */}
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <EnvironmentFilled style={{ fontSize: 28, color: '#fff' }} />
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Shaharlar
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {total} ta shahar ro'yxatda
                {search && ` · qidirilmoqda: "${search}"`}
              </p>
            </div>

            {/* counter chip */}
            {!isMobile && (
              <div style={{
                padding: '8px 20px', borderRadius: 12, textAlign: 'center',
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <div style={{ fontWeight: 800, fontSize: 24, color: '#91caff', lineHeight: 1 }}>{total}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Shaharlar</div>
              </div>
            )}

            {canEdit && (
              <Button
                icon={<PlusOutlined />}
                size="large"
                onClick={openCreate}
                style={{
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.35)', color: '#fff',
                  borderRadius: 10, fontWeight: 600, flexShrink: 0,
                }}
              >
                {isMobile ? '' : "Shahar qo'shish"}
              </Button>
            )}
          </div>

          {/* Search + region filter row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* search input */}
            <Input
              prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.6)' }} />}
              placeholder="Shahar nomi bo'yicha qidirish..."
              value={search}
              onChange={e => { setSearch(e.target.value); reset() }}
              allowClear
              size="large"
              style={{
                flex: 2, minWidth: 200,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: 14,
              }}
            />

            {/* region filter — styled same as input */}
            <div style={{
              flex: 1, minWidth: 180,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 12,
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center',
            }}>
              <Select
                variant="borderless"
                size="large"
                placeholder={<span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Viloyat bo'yicha filter</span>}
                value={regionFilter}
                onChange={v => { setRegionFilter(v); reset() }}
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%', color: '#fff' }}
                styles={{ popup: { root: { borderRadius: 10 } } }}
              >
                {regions.map(r => (
                  <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large" />
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Shaharlar yuklanmoqda...</span>
        </div>
      ) : !data?.items?.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🏙️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Shaharlar topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {search ? `"${search}" bo'yicha natija yo'q` : "Hali shahar qo'shilmagan"}
          </div>
          {(search || regionFilter) && (
            <button
              onClick={() => { setSearch(''); setRegionFilter(undefined) }}
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 20,
                background: 'linear-gradient(135deg,#003a8c,#1677ff)',
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
              <strong style={{ color: token.colorText }}>{total}</strong> ta shahar
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
            {data.items.map(city => (
              <CityCard
                key={city.id}
                city={city}
                canEdit={canEdit}
                onEdit={openEdit}
                onDelete={handleDelete}
                token={token}
              />
            ))}
          </div>

          {/* pagination */}
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
                      ? 'linear-gradient(135deg,#003a8c,#1677ff)'
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
        title={editing ? 'Shahani tahrirlash' : "Yangi shahar qo'shish"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={closeModal}
        confirmLoading={saving}
        okText="Saqlash"
        cancelText="Bekor"
        width={isMobile ? '95vw' : 440}
        forceRender
        styles={{ body: { paddingTop: 8 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Shahar nomi"
            rules={[
              { required: true, message: 'Majburiy' },
              { min: 2, message: 'Kamida 2 ta belgi' },
            ]}
          >
            <Input placeholder="Toshkent" size="large" />
          </Form.Item>
          <Form.Item
            name="regionId"
            label="Viloyat"
            rules={[{ required: true, message: "Viloyatni tanlang" }]}
          >
            <Select
              placeholder="Viloyatni tanlang"
              size="large"
              showSearch
              optionFilterProp="children"
              styles={{ popup: { root: { borderRadius: 10 } } }}
            >
              {regions.map(r => (
                <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
