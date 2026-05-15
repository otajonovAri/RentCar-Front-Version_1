import { useState, useEffect, useCallback } from 'react'
import { Button, Select, Spin, Grid, theme, message, Popconfirm, Badge } from 'antd'
import {
  CarFilled, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  CheckCircleFilled, SyncOutlined, EnvironmentOutlined,
  TeamOutlined, DollarCircleFilled, AppstoreFilled,
} from '@ant-design/icons'
import { carsApi } from '@/api/carsApi'
import { getApiError } from '@/utils/apiError'
import type { CarListItemDto, CarDetailDto, CarStatus } from '@/types/cars'
import { TRANSMISSION_LABEL } from '@/types/cars'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useBrands, useCategories } from '@/hooks/useLookups'
import { useAuthStore } from '@/store/authStore'
import CarFormModal from './components/CarFormModal'
import CarDetailDrawer from './components/CarDetailDrawer'

// ─── Config ─────────────────────────────────────────────────────────────────

type StatusFilter = CarStatus | 'All'

const STATUS_CFG: Record<CarStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  Available:   { label: 'Mavjud',      color: '#52c41a', bg: 'rgba(82,196,26,0.12)',   icon: <CheckCircleFilled style={{ fontSize: 11 }}/> },
  Rented:      { label: 'Ijarada',     color: '#1677ff', bg: 'rgba(22,119,255,0.12)',  icon: <CarFilled         style={{ fontSize: 11 }}/> },
  Maintenance: { label: "Ta'mirda",    color: '#fa8c16', bg: 'rgba(250,140,22,0.12)',  icon: <SyncOutlined      style={{ fontSize: 11 }}/> },
  Reserved:    { label: 'Band',        color: '#722ed1', bg: 'rgba(114,46,209,0.12)',  icon: <CheckCircleFilled style={{ fontSize: 11 }}/> },
  Inactive:    { label: "Nofaol",      color: '#8c8c8c', bg: 'rgba(140,140,140,0.1)', icon: <CheckCircleFilled style={{ fontSize: 11 }}/> },
}

const ALL_STATUSES: StatusFilter[] = ['All', 'Available', 'Rented', 'Maintenance', 'Reserved', 'Inactive']

const CARD_PALETTES = [
  { color: '#1677ff', shadow: 'rgba(22,119,255,0.18)'   },
  { color: '#52c41a', shadow: 'rgba(82,196,26,0.18)'    },
  { color: '#722ed1', shadow: 'rgba(114,46,209,0.18)'   },
  { color: '#fa8c16', shadow: 'rgba(250,140,22,0.18)'   },
  { color: '#13c2c2', shadow: 'rgba(19,194,194,0.18)'   },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function CarsPage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md
  const { hasRole } = useAuthStore()
  const canEdit    = hasRole(['Manager', 'Admin', 'SuperAdmin'])
  const canDelete  = hasRole(['Admin', 'SuperAdmin'])

  const [data,          setData]          = useState<PaginatedResponse<CarListItemDto> | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [brandFilter,   setBrandFilter]   = useState<number | undefined>()
  const [catFilter,     setCatFilter]     = useState<number | undefined>()
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('All')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editingCar,    setEditingCar]    = useState<CarDetailDto | null>(null)
  const [editLoading,   setEditLoading]   = useState(false)
  const [detailId,      setDetailId]      = useState<number | null>(null)
  const [hovered,       setHovered]       = useState<number | null>(null)

  const { page, pageSize, onChange, reset } = usePagination(12)
  const { brands }     = useBrands()
  const { categories } = useCategories()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await carsApi.getAll({
        page,
        pageSize,
        brandId:    brandFilter,
        categoryId: catFilter,
        status:     statusFilter === 'All' ? undefined : statusFilter,
      })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, brandFilter, catFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenCreate = () => {
    setEditingCar(null)
    setModalOpen(true)
  }

  const handleOpenEdit = async (id: number) => {
    setEditLoading(true)
    try {
      const res = await carsApi.getById(id)
      setEditingCar(res.data)
      setModalOpen(true)
    } catch {
      message.error("Mashina ma'lumotlarini olishda xatolik")
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await carsApi.delete(id)
      message.success("Mashina o'chirildi")
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, "O'chirishda xatolik yuz berdi"))
    }
  }

  const items    = data?.items ?? []
  const total    = data?.totalCount ?? 0
  const availCnt = items.filter(c => c.status === 'Available').length
  const cols     = isMobile ? 1 : !screens.lg ? 2 : screens.xl ? 3 : 2

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#0a0a14 0%,#1a1a3e 55%,#2e3192 100%)',
        padding:      isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position:     'relative',
        overflow:     'hidden',
      }}>
        {/* Decorative circles */}
        {[
          { s: 200, t: -70, r: -50, o: 0.07 },
          { s: 130, t:  30, r: 120, o: 0.05 },
          { s:  90, b: -30, l:  60, o: 0.08 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', background: '#fff',
            width: c.s, height: c.s, opacity: c.o,
            top: c.t, right: c.r, bottom: c.b, left: c.l,
          }}/>
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top row */}
          <div style={{
            display:       'flex',
            alignItems:    isMobile ? 'flex-start' : 'center',
            gap:           16,
            marginBottom:  20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CarFilled style={{ fontSize: 28, color: '#fff' }}/>
            </div>

            {/* Title */}
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Mashinalar
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {total} ta mashina
                {availCnt > 0 && ` · ${availCnt} ta mavjud`}
              </p>
            </div>

            {/* Stats chips (desktop) */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'Jami',   val: total,    color: '#fff'    },
                  { label: 'Mavjud', val: availCnt, color: '#95f985' },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '8px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, color: '#fff' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add button */}
            {canEdit && (
              <Button
                icon={<PlusOutlined/>}
                size="large"
                onClick={handleOpenCreate}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: '#fff',
                  borderRadius: 10,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {isMobile ? '' : "Mashina qo'shish"}
              </Button>
            )}
          </div>

          {/* Status filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALL_STATUSES.map(s => {
              const cfg    = s === 'All' ? null : STATUS_CFG[s as CarStatus]
              const active = s === statusFilter
              const color  = cfg?.color ?? '#fff'
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); reset() }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 50,
                    border: `1.5px solid ${active ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                    background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(6px)',
                    color: '#fff',
                    cursor: 'pointer', fontWeight: active ? 700 : 500, fontSize: 12,
                    transition: 'all 0.18s',
                    boxShadow: active ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {s === 'All'
                    ? <><AppstoreFilled style={{ fontSize: 11 }}/> Barchasi</>
                    : <>{cfg?.icon} {cfg?.label}</>
                  }
                  {s !== 'All' && items.filter(c => c.status === s).length > 0 && (
                    <Badge
                      count={items.filter(c => c.status === s).length}
                      style={{ backgroundColor: color, fontSize: 10, minWidth: 16, height: 16, lineHeight: '16px', padding: '0 4px' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24,
        padding: '16px 20px',
        background: token.colorBgContainer,
        borderRadius: 14,
        border: `1.5px solid ${token.colorBorderSecondary}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <Select
          placeholder="Brend"
          value={brandFilter}
          onChange={v => { setBrandFilter(v); reset() }}
          allowClear
          showSearch
          optionFilterProp="children"
          style={{ minWidth: 140, flex: 1 }}
        >
          {brands.map(b => (
            <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Kategoriya"
          value={catFilter}
          onChange={v => { setCatFilter(v); reset() }}
          allowClear
          style={{ minWidth: 140, flex: 1 }}
        >
          {categories.map(c => (
            <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Holat"
          value={statusFilter === 'All' ? undefined : statusFilter}
          onChange={v => { setStatusFilter(v ?? 'All'); reset() }}
          allowClear
          style={{ minWidth: 140, flex: 1 }}
        >
          {(Object.keys(STATUS_CFG) as CarStatus[]).map(s => {
            const cfg = STATUS_CFG[s]
            return (
              <Select.Option key={s} value={s}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  {cfg.label}
                </span>
              </Select.Option>
            )
          })}
        </Select>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large"/>
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Mashinalar yuklanmoqda...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🚗</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Mashina topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {statusFilter !== 'All' ? "Bu holat bo'yicha natija yo'q" : "Hali mashina qo'shilmagan"}
          </div>
          {(statusFilter !== 'All' || brandFilter || catFilter) && (
            <button
              style={{
                marginTop: 8, padding: '8px 20px', borderRadius: 20,
                background: 'linear-gradient(135deg,#1a1a3e,#2e3192)',
                border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}
              onClick={() => { setStatusFilter('All'); setBrandFilter(undefined); setCatFilter(undefined); reset() }}
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
              <strong style={{ color: token.colorText }}>{total}</strong> ta natija
            </span>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: isMobile ? 14 : 20, marginBottom: 24 }}>
            {items.map(car => {
              const palette   = CARD_PALETTES[car.id % 5]
              const statusCfg = STATUS_CFG[car.status]
              const isHov     = hovered === car.id

              return (
                <div
                  key={car.id}
                  onMouseEnter={() => setHovered(car.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background:    token.colorBgContainer,
                    borderRadius:  16,
                    border:        `1.5px solid ${isHov ? palette.color : token.colorBorderSecondary}`,
                    overflow:      'hidden',
                    transform:     isHov ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow:     isHov
                      ? `0 16px 40px ${palette.shadow}, 0 4px 12px rgba(0,0,0,0.08)`
                      : '0 2px 8px rgba(0,0,0,0.05)',
                    transition:    'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    display:       'flex',
                    flexDirection: 'column',
                    opacity:       car.status === 'Inactive' ? 0.7 : 1,
                  }}
                >
                  {/* Car image or gradient placeholder */}
                  {car.mainImageUrl ? (
                    <img
                      src={car.mainImageUrl}
                      alt={`${car.brand} ${car.model}`}
                      style={{
                        width: '100%', height: 160,
                        objectFit: 'cover',
                        borderRadius: '14px 14px 0 0',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      height: 160,
                      background: `linear-gradient(135deg, ${palette.color}22, ${palette.color}44)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 52,
                      borderRadius: '14px 14px 0 0',
                    }}>
                      🚗
                    </div>
                  )}

                  {/* Colored top bar (below image) */}
                  <div style={{ height: 4, background: palette.color }}/>

                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Brand + Model + Year */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700, fontSize: 16, color: token.colorText,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {car.brand} {car.model} ({car.year})
                        </div>
                        {/* License plate badge */}
                        <span style={{
                          display: 'inline-block', marginTop: 4,
                          fontFamily: 'monospace',
                          fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 6,
                          background: token.colorFillSecondary,
                          color: token.colorTextSecondary,
                          border: `1px solid ${token.colorBorderSecondary}`,
                          letterSpacing: 1,
                        }}>
                          {car.licensePlate}
                        </span>
                      </div>

                      {/* Brand logo */}
                      {car.brandLogoUrl && (
                        <img
                          src={car.brandLogoUrl}
                          alt={car.brand}
                          style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, borderRadius: 6 }}
                        />
                      )}
                    </div>

                    {/* Color dot + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: car.color.toLowerCase(),
                        border: `1px solid ${token.colorBorderSecondary}`,
                        flexShrink: 0,
                      }}/>
                      <span style={{ fontSize: 12, color: token.colorTextSecondary }}>{car.color}</span>
                    </div>

                    {/* Category + Branch chips */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {car.categoryName && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: `${palette.color}15`, color: palette.color,
                          border: `1px solid ${palette.color}30`,
                        }}>
                          {car.categoryName}
                        </span>
                      )}
                      {car.branchName && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                          background: token.colorFillAlter,
                          color: token.colorTextSecondary,
                          border: `1px solid ${token.colorBorderSecondary}`,
                        }}>
                          <EnvironmentOutlined style={{ fontSize: 10 }}/> {car.branchName}
                        </span>
                      )}
                    </div>

                    {/* Seat count + Transmission */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TeamOutlined style={{ color: token.colorTextTertiary, fontSize: 12 }}/>
                        <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                          {car.seatCount} o'rin
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                        {TRANSMISSION_LABEL[car.transmissionType] ?? car.transmissionType}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: token.colorBorderSecondary }}/>

                    {/* Daily rate */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 1 }}>Kunlik narx</div>
                        <div>
                          <DollarCircleFilled style={{ color: '#1677ff', fontSize: 13, marginRight: 4 }}/>
                          <span style={{ fontWeight: 800, fontSize: 17, color: '#1677ff' }}>
                            {car.dailyRate.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 11, color: token.colorTextTertiary, marginLeft: 3 }}>so'm/kun</span>
                        </div>
                      </div>
                      {/* Status badge */}
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: statusCfg.bg, color: statusCfg.color,
                        border: `1px solid ${statusCfg.color}40`,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        flexShrink: 0,
                      }}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Card footer: actions */}
                  <div style={{
                    padding: '10px 16px',
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}>
                    <Button
                      size="small"
                      icon={<EyeOutlined/>}
                      onClick={() => setDetailId(car.id)}
                      style={{ flex: 1, borderRadius: 8 }}
                    >
                      Ko'rish
                    </Button>

                    {canEdit && (
                      <Button
                        size="small"
                        icon={<EditOutlined/>}
                        loading={editLoading}
                        onClick={() => handleOpenEdit(car.id)}
                        style={{ flex: 1, borderRadius: 8 }}
                      >
                        Tahrirlash
                      </Button>
                    )}

                    {canDelete && (
                      <Popconfirm
                        title="Mashinani o'chirish"
                        description={
                          <span>
                            <b>{car.brand} {car.model}</b> ni o'chirishni tasdiqlaysizmi?<br/>
                            <span style={{ color: token.colorError, fontSize: 12 }}>
                              Bu amalni qaytarib bo'lmaydi!
                            </span>
                          </span>
                        }
                        onConfirm={() => handleDelete(car.id)}
                        okText="Ha, o'chir"
                        cancelText="Bekor"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined/>}
                          style={{ borderRadius: 8 }}
                        />
                      </Popconfirm>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => onChange(p, pageSize)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: `1.5px solid ${p === page ? '#2e3192' : token.colorBorderSecondary}`,
                    background: p === page ? '#2e3192' : token.colorBgContainer,
                    color: p === page ? '#fff' : token.colorText,
                    fontWeight: p === page ? 700 : 400,
                    cursor: 'pointer', fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <CarFormModal
        open={modalOpen}
        car={editingCar}
        onClose={() => { setModalOpen(false); setEditingCar(null) }}
        onSuccess={() => { setModalOpen(false); setEditingCar(null); fetchData() }}
      />

      <CarDetailDrawer
        carId={detailId}
        onClose={() => setDetailId(null)}
        onSuccess={fetchData}
      />
    </div>
  )
}
