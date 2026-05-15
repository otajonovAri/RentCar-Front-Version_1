import { useState, useEffect, useCallback } from 'react'
import { Button, Spin, Grid, theme, Badge } from 'antd'
import {
  AuditOutlined, PlusOutlined,
  CheckCircleFilled, WarningFilled,
  CarFilled, UserOutlined, CalendarOutlined, DashboardOutlined,
  AppstoreFilled,
} from '@ant-design/icons'
import { inspectionsApi } from '@/api/inspectionsApi'
import type { InspectionDto, InspectionType } from '@/types/inspections'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { format } from 'date-fns'
import InspectionFormModal from './components/InspectionFormModal'

// ─── Config ─────────────────────────────────────────────────────────────────

type TypeFilter = InspectionType | 'All'

const TYPE_CFG: Record<InspectionType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PreRental:  { label: 'Ijara oldidan', color: '#13c2c2', bg: 'rgba(19,194,194,0.12)',  icon: <CarFilled      style={{ fontSize: 11 }}/> },
  PostRental: { label: 'Ijara keyin',   color: '#722ed1', bg: 'rgba(114,46,209,0.12)', icon: <AuditOutlined  style={{ fontSize: 11 }}/> },
  Periodic:   { label: 'Muntazam',      color: '#52c41a', bg: 'rgba(82,196,26,0.12)',  icon: <CheckCircleFilled style={{ fontSize: 11 }}/> },
  Damage:     { label: 'Zarar',         color: '#ff4d4f', bg: 'rgba(255,77,79,0.12)',  icon: <WarningFilled  style={{ fontSize: 11 }}/> },
}

const ALL_TYPES: TypeFilter[] = ['All', 'PreRental', 'PostRental', 'Periodic', 'Damage']

const CARD_PALETTES = [
  { color: '#13c2c2', bg: 'rgba(19,194,194,0.08)'  },
  { color: '#722ed1', bg: 'rgba(114,46,209,0.08)'  },
  { color: '#52c41a', bg: 'rgba(82,196,26,0.08)'   },
  { color: '#fa8c16', bg: 'rgba(250,140,22,0.08)'  },
  { color: '#ff4d4f', bg: 'rgba(255,77,79,0.08)'   },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function InspectionsPage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md

  const [data,       setData]       = useState<PaginatedResponse<InspectionDto> | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [hovered,    setHovered]    = useState<number | null>(null)

  const { page, pageSize, onChange, reset } = usePagination(12)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await inspectionsApi.getAll({
        page,
        pageSize,
        type: typeFilter === 'All' ? undefined : typeFilter,
      })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const items       = data?.items ?? []
  const total       = data?.totalCount ?? 0
  const damageCnt   = items.filter(i => i.hasDamage).length
  const cols        = isMobile ? 1 : !screens.lg ? 2 : screens.xl ? 3 : 2

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#001a1f 0%,#00474f 55%,#08979c 100%)',
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
          {/* Top row: icon + title + stats + button */}
          <div style={{
            display:       'flex',
            alignItems:    isMobile ? 'flex-start' : 'center',
            gap:           16,
            marginBottom:  20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Page icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AuditOutlined style={{ fontSize: 28, color: '#fff' }}/>
            </div>

            {/* Title */}
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Texnik Ko'riklar
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {total} ta ko'rik
                {damageCnt > 0 && ` · ${damageCnt} ta zarar bor`}
              </p>
            </div>

            {/* Stats chips (desktop only) */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'Jami',     val: total,     color: '#fff'    },
                  { label: 'Zarar',    val: damageCnt, color: '#ffb3b3' },
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
            <Button
              icon={<PlusOutlined/>}
              size="large"
              onClick={() => setModalOpen(true)}
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
              {isMobile ? '' : "Ko'rik qo'shish"}
            </Button>
          </div>

          {/* Type filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALL_TYPES.map(t => {
              const cfg    = t === 'All' ? null : TYPE_CFG[t as InspectionType]
              const active = t === typeFilter
              const color  = cfg?.color ?? '#fff'
              return (
                <button
                  key={t}
                  onClick={() => { setTypeFilter(t); reset() }}
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
                  {t === 'All'
                    ? <><AppstoreFilled style={{ fontSize: 11 }}/> Barchasi</>
                    : <>{cfg?.icon} {cfg?.label}</>
                  }
                  {t !== 'All' && items.filter(i => i.type === t).length > 0 && (
                    <Badge
                      count={items.filter(i => i.type === t).length}
                      style={{ backgroundColor: color, fontSize: 10, minWidth: 16, height: 16, lineHeight: '16px', padding: '0 4px' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large"/>
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Ko'riklar yuklanmoqda...</span>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Ko'rik topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {typeFilter !== 'All' ? "Bu tur bo'yicha natija yo'q" : "Hali ko'rik qo'shilmagan"}
          </div>
          {typeFilter !== 'All' && (
            <button
              style={{
                marginTop: 8, padding: '8px 20px', borderRadius: 20,
                background: 'linear-gradient(135deg,#001a1f,#08979c)',
                border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}
              onClick={() => { setTypeFilter('All'); reset() }}
            >
              Filterni tozalash
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
            {items.map(inspection => {
              const palette  = CARD_PALETTES[inspection.id % 5]
              const typeCfg  = TYPE_CFG[inspection.type]
              const isHov    = hovered === inspection.id

              // Fuel gauge color
              const fuelColor = inspection.fuelLevelPercent > 50
                ? '#52c41a'
                : inspection.fuelLevelPercent >= 20
                  ? '#fa8c16'
                  : '#ff4d4f'

              return (
                <div
                  key={inspection.id}
                  onMouseEnter={() => setHovered(inspection.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background:    token.colorBgContainer,
                    borderRadius:  16,
                    border:        `1.5px solid ${isHov ? palette.color : token.colorBorderSecondary}`,
                    overflow:      'hidden',
                    transform:     isHov ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow:     isHov
                      ? `0 16px 40px ${palette.color}22, 0 4px 12px rgba(0,0,0,0.08)`
                      : '0 2px 8px rgba(0,0,0,0.05)',
                    transition:    'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    display:       'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Colored top bar */}
                  <div style={{ height: 4, background: palette.color }}/>

                  <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Header: Ijara badge + type chip + inspector */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                          {/* Rental badge */}
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                            background: 'rgba(22,119,255,0.1)', color: '#1677ff',
                            border: '1px solid rgba(22,119,255,0.2)',
                          }}>
                            Ijara #{inspection.rentalId}
                          </span>
                          {/* Type chip */}
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                            background: typeCfg.bg, color: typeCfg.color,
                            border: `1px solid ${typeCfg.color}40`,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            {typeCfg.icon} {typeCfg.label}
                          </span>
                        </div>
                        {/* Inspector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <UserOutlined style={{ color: palette.color, fontSize: 13, flexShrink: 0 }}/>
                          <span style={{
                            fontWeight: 600, fontSize: 13, color: token.colorText,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {inspection.inspectedBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: token.colorBorderSecondary }}/>

                    {/* BIG Fuel Gauge */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <DashboardOutlined style={{ color: fuelColor, fontSize: 13 }}/>
                          <span style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>Yoqilg'i</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: fuelColor }}>
                          {inspection.fuelLevelPercent}%
                        </span>
                      </div>
                      {/* Gauge bar background */}
                      <div style={{
                        height: 10, borderRadius: 5,
                        background: token.colorFillSecondary,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.max(0, Math.min(100, inspection.fuelLevelPercent))}%`,
                          borderRadius: 5,
                          background: `linear-gradient(90deg, ${fuelColor}99, ${fuelColor})`,
                          transition: 'width 0.4s ease',
                        }}/>
                      </div>
                    </div>

                    {/* Info grid 2 columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                      {/* Mileage */}
                      <div>
                        <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 1 }}>
                          <DashboardOutlined style={{ marginRight: 3 }}/>Probeg
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                          {inspection.mileageAtInspection.toLocaleString()} km
                        </div>
                      </div>
                      {/* Date */}
                      <div>
                        <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 1 }}>
                          <CalendarOutlined style={{ marginRight: 3 }}/>Sana
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                          {format(new Date(inspection.inspectedAt), 'dd.MM.yyyy HH:mm')}
                        </div>
                      </div>
                      {/* Exterior */}
                      <div>
                        <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 1 }}>Tashqi holat</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: token.colorText,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inspection.exteriorCondition}
                        </div>
                      </div>
                      {/* Interior */}
                      <div>
                        <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 1 }}>Ichki holat</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: token.colorText,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inspection.interiorCondition}
                        </div>
                      </div>
                    </div>

                    {/* Damage badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '10px 12px', borderRadius: 10,
                      background: inspection.hasDamage
                        ? 'linear-gradient(135deg,rgba(255,77,79,0.08),rgba(250,140,22,0.06))'
                        : 'linear-gradient(135deg,rgba(82,196,26,0.08),rgba(19,194,194,0.06))',
                      border: `1px solid ${inspection.hasDamage ? 'rgba(255,77,79,0.2)' : 'rgba(82,196,26,0.2)'}`,
                    }}>
                      {inspection.hasDamage ? (
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#ff4d4f' }}>
                          ⚠️ Zarar bor
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#52c41a' }}>
                          ✅ Zarar yo'q
                        </span>
                      )}
                    </div>

                    {/* Notes block */}
                    {inspection.notes && (
                      <div style={{
                        fontSize: 12, color: token.colorTextSecondary,
                        padding: '8px 10px', borderRadius: 8,
                        background: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        lineHeight: 1.5,
                      }}>
                        📝 {inspection.notes}
                      </div>
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
                    border: `1.5px solid ${p === page ? '#08979c' : token.colorBorderSecondary}`,
                    background: p === page ? '#08979c' : token.colorBgContainer,
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

      <InspectionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchData() }}
      />
    </div>
  )
}
