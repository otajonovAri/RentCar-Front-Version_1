import { useState } from 'react'
import { theme, Grid } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  SettingOutlined, TeamOutlined, ThunderboltFilled,
  ArrowRightOutlined, FireFilled,
} from '@ant-design/icons'
import type { CarListItemDto } from '@/types/cars'
import { TRANSMISSION_LABEL } from '@/types/cars'

const fmt = (n: number) => n.toLocaleString('ru-RU')

// Status config
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  Available:   { label: 'Mavjud',     color: '#52c41a', bg: 'rgba(82,196,26,0.15)'   },
  Rented:      { label: 'Ijarada',    color: '#fa8c16', bg: 'rgba(250,140,22,0.15)'  },
  Maintenance: { label: "Ta'mirda",   color: '#ff4d4f', bg: 'rgba(255,77,79,0.15)'   },
  Reserved:    { label: 'Bron',       color: '#1677ff', bg: 'rgba(22,119,255,0.15)'  },
}

interface Props {
  car: CarListItemDto
}

export default function CarCatalogCard({ car }: Props) {
  const navigate      = useNavigate()
  const { token }     = theme.useToken()
  const screens       = Grid.useBreakpoint()
  const isMobile      = !screens.md
  const [hovered, setHovered] = useState(false)

  const name    = `${car.brand} ${car.model}`
  const imgSrc  = car.mainImageUrl ?? ''
  const logoSrc = car.brandLogoUrl ?? ''
  const status  = STATUS_CFG[car.status] ?? STATUS_CFG.Available

  return (
    <div
      onClick={() => navigate(`/catalog/${car.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    token.colorBgContainer,
        borderRadius:  16,
        overflow:      'hidden',
        border:        `1.5px solid ${hovered ? '#1677ff' : token.colorBorderSecondary}`,
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        transform:     hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow:     hovered
          ? '0 16px 40px rgba(22,119,255,0.15), 0 4px 12px rgba(0,0,0,0.1)'
          : `0 2px 10px rgba(0,0,0,0.06)`,
        transition:    'all 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* ── Image ─────────────────────────────────────────────────────── */}
      <div style={{
        position:    'relative',
        aspectRatio: '4 / 3',
        background:  token.colorFillSecondary,
        overflow:    'hidden',
      }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            style={{
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              transform:  hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}
            onError={e => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
              const p = el.parentElement
              if (p && !p.querySelector('.fb')) {
                const s = document.createElement('span')
                s.className = 'fb'
                s.style.cssText = 'font-size:52px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)'
                s.textContent = '🚗'
                p.appendChild(s)
              }
            }}
          />
        ) : (
          <span style={{
            position:  'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', fontSize: 52,
          }}>🚗</span>
        )}

        {/* Gradient overlay bottom */}
        <div style={{
          position:   'absolute', bottom: 0, left: 0, right: 0,
          height:     '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
        }} />

        {/* Brand logo — top left */}
        {logoSrc && (
          <div style={{
            position:       'absolute', top: 10, left: 10,
            width:          34, height: 34,
            borderRadius:   8,
            background:     'rgba(255,255,255,0.92)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            boxShadow:      '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <img
              src={logoSrc}
              alt={car.brand}
              style={{ width: 24, height: 24, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}

        {/* Status badge — top right */}
        <div style={{
          position:     'absolute', top: 10, right: 10,
          padding:      '3px 10px',
          borderRadius: 20,
          background:   status.bg,
          backdropFilter: 'blur(6px)',
          border:       `1px solid ${status.color}40`,
          fontSize:     11,
          fontWeight:   700,
          color:        status.color,
          letterSpacing: 0.3,
        }}>
          {status.label}
        </div>

        {/* Car name on image — bottom left */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12, right: 12,
        }}>
          <div style={{
            fontWeight:    800,
            fontSize:      isMobile ? 14 : 15,
            color:         '#fff',
            letterSpacing: 0.3,
            textShadow:    '0 1px 4px rgba(0,0,0,0.4)',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            whiteSpace:    'nowrap',
          }}>
            {name.toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
            {car.categoryName ?? 'Sedan'}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div style={{
        padding:       '12px 14px 14px',
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        gap:           10,
      }}>

        {/* Specs chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { icon: <SettingOutlined style={{ fontSize: 10 }} />, label: TRANSMISSION_LABEL[car.transmissionType] },
            { icon: <TeamOutlined    style={{ fontSize: 10 }} />, label: `${car.seatCount} o'rin` },
            { icon: <ThunderboltFilled style={{ fontSize: 10, color: '#fa8c16' }} />, label: 'Benzin' },
          ].map((spec, i) => (
            <span key={i} style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          4,
              padding:      '3px 8px',
              borderRadius: 20,
              background:   token.colorFillAlter,
              border:       `1px solid ${token.colorBorderSecondary}`,
              fontSize:     11,
              color:        token.colorTextSecondary,
              whiteSpace:   'nowrap',
            }}>
              {spec.icon} {spec.label}
            </span>
          ))}
        </div>

        {/* Price row */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '10px 12px',
          background:     'linear-gradient(135deg, rgba(22,119,255,0.06) 0%, rgba(99,102,241,0.06) 100%)',
          borderRadius:   10,
          border:         `1px solid rgba(22,119,255,0.12)`,
        }}>
          <div>
            <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 1 }}>Kuniga</div>
            <div style={{ fontWeight: 800, fontSize: isMobile ? 16 : 17, color: '#1677ff', lineHeight: 1 }}>
              {fmt(car.dailyRate)}
              <span style={{ fontSize: 11, fontWeight: 500, color: token.colorTextSecondary, marginLeft: 3 }}>so'm</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: token.colorTextTertiary, marginBottom: 1 }}>Garov</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: token.colorTextSecondary }}>
              {fmt(car.dailyRate * 10)} so'm
            </div>
          </div>
        </div>

        {/* CTA button */}
        <button
          style={{
            width:          '100%',
            height:         40,
            borderRadius:   10,
            background:     hovered
              ? 'linear-gradient(135deg, #0958d9 0%, #4f46e5 100%)'
              : 'linear-gradient(135deg, #1677ff 0%, #6366f1 100%)',
            border:         'none',
            cursor:         'pointer',
            color:          '#fff',
            fontWeight:     700,
            fontSize:       13,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            6,
            transition:     'background 0.2s',
            boxShadow:      hovered ? '0 4px 16px rgba(22,119,255,0.4)' : '0 2px 8px rgba(22,119,255,0.2)',
            letterSpacing:  0.2,
          }}
        >
          <FireFilled style={{ fontSize: 13 }} />
          Batafsil ko'rish
          <ArrowRightOutlined style={{ fontSize: 11 }} />
        </button>
      </div>
    </div>
  )
}
