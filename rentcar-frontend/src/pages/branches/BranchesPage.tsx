import { useState, useEffect, useCallback } from 'react'
import { Button, Select, theme, Spin, Grid } from 'antd'
import {
  PlusOutlined, EditOutlined, PhoneOutlined,
  CarFilled, EnvironmentFilled, BankFilled,
} from '@ant-design/icons'
import { branchesApi } from '@/api/branchesApi'
import type { BranchDto } from '@/types/branches'
import BranchFormModal from './components/BranchFormModal'
import { useAuthStore } from '@/store/authStore'
import { useRegions, useCities } from '@/hooks/useLookups'

// Stable color from string
const PALETTE = [
  { bg: 'linear-gradient(135deg,#1677ff,#6366f1)', shadow: 'rgba(22,119,255,0.3)' },
  { bg: 'linear-gradient(135deg,#52c41a,#13c2c2)', shadow: 'rgba(82,196,26,0.3)'  },
  { bg: 'linear-gradient(135deg,#fa8c16,#fadb14)', shadow: 'rgba(250,140,22,0.3)' },
  { bg: 'linear-gradient(135deg,#722ed1,#eb2f96)', shadow: 'rgba(114,46,209,0.3)' },
  { bg: 'linear-gradient(135deg,#13c2c2,#1677ff)', shadow: 'rgba(19,194,194,0.3)' },
  { bg: 'linear-gradient(135deg,#eb2f96,#fa8c16)', shadow: 'rgba(235,47,150,0.3)' },
]
function paletteFor(id: number) { return PALETTE[id % PALETTE.length] }

export default function BranchesPage() {
  const { token }  = theme.useToken()
  const screens    = Grid.useBreakpoint()
  const isMobile   = !screens.md
  const { hasRole } = useAuthStore()
  const canEdit    = hasRole(['Admin', 'SuperAdmin'])

  const [data,         setData]         = useState<BranchDto[]>([])
  const [loading,      setLoading]      = useState(false)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState<BranchDto | null>(null)
  const [regionFilter, setRegionFilter] = useState<number | undefined>()
  const [cityFilter,   setCityFilter]   = useState<number | undefined>()
  const [hovered,      setHovered]      = useState<number | null>(null)

  const { regions } = useRegions()
  const { cities }  = useCities(regionFilter ?? null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await branchesApi.getAll(cityFilter)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [cityFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const totalCars = data.reduce((s, b) => s + (b.carCount ?? 0), 0)
  const cols = isMobile ? 1 : !screens.lg ? 2 : 3

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background:   'linear-gradient(135deg,#0a2351 0%,#1677ff 55%,#13c2c2 100%)',
        padding:      isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position:     'relative',
        overflow:     'hidden',
      }}>
        {/* Decorative circles */}
        {[{s:200,t:-70,r:-50,o:.07},{s:130,t:30,r:120,o:.05},{s:90,b:-30,l:60,o:.08}].map((c,i)=>(
          <div key={i} style={{
            position:'absolute', borderRadius:'50%', background:'#fff',
            width:c.s, height:c.s, opacity:c.o,
            top:c.t, right:c.r, bottom:c.b, left:c.l,
          }}/>
        ))}

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{
            display:       'flex',
            alignItems:    isMobile ? 'flex-start' : 'center',
            gap:           16,
            marginBottom:  20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Icon */}
            <div style={{
              width:56, height:56, borderRadius:14,
              background:'rgba(255,255,255,0.15)',
              backdropFilter:'blur(10px)',
              border:'1px solid rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>
              <BankFilled style={{ fontSize:28, color:'#fff' }}/>
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:isMobile?22:28, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
                Filiallarimiz
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {data.length} ta filial · {totalCars} ta avtomobil
              </p>
            </div>

            {/* Stats chips */}
            {!isMobile && (
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { icon:<BankFilled/>,       label:'Filiallar', val:data.length },
                  { icon:<CarFilled/>,         label:'Mashinalar', val:totalCars  },
                ].map((s,i) => (
                  <div key={i} style={{
                    padding:'8px 16px', borderRadius:12,
                    background:'rgba(255,255,255,0.12)',
                    backdropFilter:'blur(6px)',
                    border:'1px solid rgba(255,255,255,0.2)',
                    display:'flex', alignItems:'center', gap:8, color:'#fff', fontSize:13,
                  }}>
                    <span style={{ fontSize:16 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:18, lineHeight:1 }}>{s.val}</div>
                      <div style={{ fontSize:10, opacity:.7 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add button */}
            {canEdit && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => { setEditing(null); setModalOpen(true) }}
                style={{
                  background:'rgba(255,255,255,0.2)',
                  backdropFilter:'blur(8px)',
                  border:'1px solid rgba(255,255,255,0.35)',
                  color:'#fff',
                  borderRadius:10,
                  fontWeight:600,
                  flexShrink:0,
                }}
              >
                {isMobile ? '' : 'Yangi filial'}
              </Button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Select
              placeholder="Viloyat"
              value={regionFilter}
              onChange={(v) => { setRegionFilter(v); setCityFilter(undefined) }}
              allowClear showSearch optionFilterProp="children"
              style={{ minWidth:150, flex:1, maxWidth:220 }}
              styles={{ popup: { root: { zIndex:9999 } } }}
              variant="filled"
            >
              {regions.map(r => <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}
            </Select>
            <Select
              placeholder="Shahar"
              value={cityFilter}
              onChange={(v) => setCityFilter(v)}
              allowClear showSearch optionFilterProp="children"
              disabled={!regionFilter}
              style={{ minWidth:150, flex:1, maxWidth:220 }}
              variant="filled"
            >
              {cities.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </div>
        </div>
      </div>

      {/* ── GRID ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:80, gap:16 }}>
          <Spin size="large"/>
          <span style={{ color:token.colorTextTertiary, fontSize:13 }}>Filiallar yuklanmoqda...</span>
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🏦</div>
          <div style={{ fontSize:18, fontWeight:700, color:token.colorText, marginBottom:6 }}>Filial topilmadi</div>
          <div style={{ fontSize:13, color:token.colorTextTertiary }}>Filter bo'yicha natija yo'q</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:isMobile?14:20 }}>
          {data.map((branch) => {
            const pal  = paletteFor(branch.id)
            const isHov = hovered === branch.id
            return (
              <div
                key={branch.id}
                onMouseEnter={() => setHovered(branch.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background:    token.colorBgContainer,
                  borderRadius:  16,
                  border:        `1.5px solid ${isHov ? '#1677ff' : token.colorBorderSecondary}`,
                  overflow:      'hidden',
                  transform:     isHov ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow:     isHov
                    ? '0 16px 40px rgba(22,119,255,0.12), 0 4px 12px rgba(0,0,0,0.08)'
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  transition:    'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                  display:       'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Color bar top */}
                <div style={{ height:5, background: pal.bg }} />

                <div style={{ padding:'18px 18px 16px', flex:1, display:'flex', flexDirection:'column', gap:12 }}>

                  {/* Header: icon + name */}
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:46, height:46, borderRadius:12, flexShrink:0,
                      background: pal.bg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: `0 4px 14px ${pal.shadow}`,
                    }}>
                      <BankFilled style={{ fontSize:22, color:'#fff' }}/>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{
                        fontWeight:700, fontSize:15, color:token.colorText,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>
                        {branch.name}
                      </div>
                      <div style={{ display:'flex', gap:5, marginTop:3 }}>
                        <span style={{
                          fontSize:10, fontWeight:600, padding:'1px 8px', borderRadius:20,
                          background:'rgba(114,46,209,0.1)', color:'#722ed1',
                          border:'1px solid rgba(114,46,209,0.2)',
                        }}>
                          {branch.regionName}
                        </span>
                        <span style={{
                          fontSize:10, fontWeight:600, padding:'1px 8px', borderRadius:20,
                          background:'rgba(22,119,255,0.1)', color:'#1677ff',
                          border:'1px solid rgba(22,119,255,0.2)',
                        }}>
                          {branch.cityName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height:1, background:token.colorBorderSecondary }}/>

                  {/* Address */}
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <EnvironmentFilled style={{ color:'#fa8c16', fontSize:15, marginTop:1, flexShrink:0 }}/>
                    <span style={{ fontSize:13, color:token.colorTextSecondary, lineHeight:1.5 }}>
                      {branch.address}
                    </span>
                  </div>

                  {/* Phone */}
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <PhoneOutlined style={{ color:'#52c41a', fontSize:14, flexShrink:0 }}/>
                    <a href={`tel:${branch.phoneNumber}`} style={{
                      fontSize:13, fontWeight:600, color:token.colorText,
                      fontFamily:'monospace', textDecoration:'none',
                    }}>
                      {branch.phoneNumber}
                    </a>
                  </div>

                  {/* Car count */}
                  <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px', borderRadius:10,
                    background:'linear-gradient(135deg,rgba(22,119,255,0.07),rgba(99,102,241,0.07))',
                    border:'1px solid rgba(22,119,255,0.12)',
                    marginTop:'auto',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <CarFilled style={{ color:'#1677ff', fontSize:16 }}/>
                      <span style={{ fontSize:13, color:token.colorTextSecondary }}>Mavjud mashinalar</span>
                    </div>
                    <span style={{
                      fontWeight:800, fontSize:20, color:'#1677ff', lineHeight:1,
                    }}>
                      {branch.carCount ?? 0}
                    </span>
                  </div>
                </div>

                {/* Admin edit button */}
                {canEdit && (
                  <div style={{
                    padding:'10px 18px',
                    borderTop:`1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                  }}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      block
                      onClick={() => { setEditing(branch); setModalOpen(true) }}
                      style={{ color:token.colorPrimary, fontWeight:600, borderRadius:8 }}
                    >
                      Tahrirlash
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <BranchFormModal
        open={modalOpen}
        branch={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchData() }}
      />
    </div>
  )
}
