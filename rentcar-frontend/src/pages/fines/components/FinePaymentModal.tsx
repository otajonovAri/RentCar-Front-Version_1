import { useState } from 'react'
import { Modal, Button, Input, message, notification } from 'antd'
import { CheckOutlined, FileImageOutlined } from '@ant-design/icons'
import { finesApi } from '@/api/finesApi'
import { useThemeStore } from '@/store/themeStore'
import type { FineDto } from '@/types/fines'
import type { PaymentMethod } from '@/types/payments'
import { useIsMobile } from '@/hooks/useIsMobile'

const fmt = (n: number) => n.toLocaleString('ru-RU')

// ── To'lov usullari ───────────────────────────────────────────────────────────
const OTHER_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash',         label: '💵 Naqd pul'       },
  { value: 'CreditCard',   label: '💳 Kredit karta'   },
  { value: 'DebitCard',    label: '💳 Debit karta'    },
  { value: 'BankTransfer', label: "🏦 Bank o'tkazma"  },
  { value: 'Online',       label: '🌐 Onlayn'         },
]

// Isbot talab qiladigan usullar
const NEEDS_PROOF: PaymentMethod[] = ['CreditCard', 'DebitCard', 'BankTransfer', 'Online']

// ── Payme config ──────────────────────────────────────────────────────────────
const PAYME_CONFIG = {
  web:       'https://payme.uz/',
  android:   'intent://payme.uz#Intent;scheme=https;package=uz.paycom;end',
  ios:       'payme://',
  logoLight: 'https://turonbank.uz/bitrix/templates/main/images/cards/payments/payme.png',
  logoDark:  'https://pr.uz/wp-content/uploads/2024/05/photo_2024-05-14_20-27-31.jpg',
  color:     '#00bcd4',
}

function openPayme() {
  const isIos    = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const deepLink = isIos ? PAYME_CONFIG.ios : PAYME_CONFIG.android
  const fallback = setTimeout(() => window.open(PAYME_CONFIG.web, '_blank'), 1500)
  const hidden   = document.createElement('iframe')
  hidden.style.display = 'none'
  hidden.src = deepLink
  document.body.appendChild(hidden)
  setTimeout(() => { document.body.removeChild(hidden); clearTimeout(fallback) }, 2000)
}

interface Props {
  fine:      FineDto | null
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
}

export default function FinePaymentModal({ fine, open, onClose, onSuccess }: Props) {
  const isMobile = useIsMobile()
  const isDark   = useThemeStore(s => s.isDark)
  const [notifApi, notifCtx] = notification.useNotification()

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [proofUrl,       setProofUrl]       = useState('')
  const [loading,        setLoading]        = useState(false)

  const needsProof = selectedMethod ? NEEDS_PROOF.includes(selectedMethod) : false

  const handleClose = () => {
    setSelectedMethod(null)
    setProofUrl('')
    onClose()
  }

  const handlePay = async () => {
    if (!fine || !selectedMethod) {
      message.warning("To'lov usulini tanlang")
      return
    }
    if (needsProof && !proofUrl.trim()) {
      message.warning("To'lov isbotini (chek URL) kiriting")
      return
    }

    setLoading(true)
    try {
      await finesApi.pay(fine.id)

      handleClose()

      if (selectedMethod === 'Payme') {
        notifApi.success({
          message: "✅ Jarima to'landi!",
          description: `Jarima #${fine.id} — Payme orqali ${fmt(fine.amount)} so'm to'landi.`,
          duration: 6,
          placement: 'topRight',
        })
      } else {
        notifApi.info({
          message: "⏳ To'lov ma'lumotlari yuborildi",
          description: `Jarima #${fine.id} uchun to'lov ma'lumotlari yuborildi. Admin tasdiqlanganidan so'ng jarima yopiladi.`,
          duration: 8,
          placement: 'topRight',
        })
      }

      onSuccess()
    } catch {
      message.error("To'lovda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  if (!fine) return null

  const paymelogo = isDark ? PAYME_CONFIG.logoDark : PAYME_CONFIG.logoLight
  const isPayme   = selectedMethod === 'Payme'

  return (
    <>
      {notifCtx}
      <Modal
        title={
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:8,
              background:'linear-gradient(135deg,#ff4d4f,#fa8c16)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18,
            }}>
              ⚠️
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>Jarima to'lash</div>
              <div style={{ fontSize:11, color:'#8c8c8c', fontWeight:400 }}>
                Jarima #{fine.id}
              </div>
            </div>
          </div>
        }
        open={open}
        onCancel={handleClose}
        footer={null}
        width={isMobile ? '95vw' : 460}
        destroyOnHidden
        zIndex={1000}
      >
        {/* ── Jarima info banner ── */}
        <div style={{
          marginBottom: 20,
          padding:      '14px 16px',
          background:   'linear-gradient(135deg,rgba(255,77,79,0.06),rgba(250,140,22,0.06))',
          border:       '1.5px solid rgba(255,77,79,0.2)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize:12, color:'#8c8c8c', marginBottom:4 }}>
            Jarima sababi
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:'#262626', marginBottom:10 }}>
            {fine.description}
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
            <span style={{ fontSize:26, fontWeight:900, color:'#ff4d4f', lineHeight:1 }}>
              {fmt(fine.amount)}
            </span>
            <span style={{ fontSize:13, color:'#8c8c8c' }}>so'm</span>
          </div>
        </div>

        {/* ── Payme — katta karta ── */}
        <div style={{ marginBottom:12 }}>
          <div
            onClick={() => setSelectedMethod('Payme')}
            style={{
              borderRadius:   14,
              border:         `2.5px solid ${isPayme ? PAYME_CONFIG.color : 'transparent'}`,
              background:     PAYME_CONFIG.color,
              cursor:         'pointer',
              overflow:       'hidden',
              position:       'relative',
              boxShadow:      isPayme
                ? `0 0 0 3px ${PAYME_CONFIG.color}40`
                : '0 2px 8px rgba(0,0,0,0.12)',
              transition:     'all 0.18s',
              aspectRatio:    '21/6',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={paymelogo}
              alt="Payme"
              style={{ width:'100%', height:'100%', objectFit:'contain', padding:12 }}
              onError={e => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
                const p = el.parentElement
                if (p) {
                  const s = document.createElement('span')
                  s.textContent = 'Payme'
                  s.style.cssText = 'color:#fff;font-weight:800;font-size:22px'
                  p.appendChild(s)
                }
              }}
            />
            {isPayme && (
              <div style={{
                position:'absolute', top:8, right:8,
                width:24, height:24, borderRadius:'50%',
                background:'#fff', display:'flex',
                alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
              }}>
                <CheckOutlined style={{ color:PAYME_CONFIG.color, fontSize:13 }}/>
              </div>
            )}
          </div>
        </div>

        {/* Payme tanlanganda — ilovani ochish */}
        {isPayme && (
          <div style={{
            marginBottom:   12,
            padding:        '10px 14px',
            background:     `${PAYME_CONFIG.color}12`,
            border:         `1px solid ${PAYME_CONFIG.color}50`,
            borderRadius:   10,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            10,
          }}>
            <span style={{ fontSize:13, color:'#555' }}>
              Payme ilovasini ochib to'lovni amalga oshiring
            </span>
            <Button
              size="small"
              style={{
                background:  PAYME_CONFIG.color,
                borderColor: PAYME_CONFIG.color,
                color:       '#fff',
                fontWeight:  700,
                borderRadius:8,
                flexShrink:  0,
              }}
              onClick={openPayme}
            >
              📱 Ochish
            </Button>
          </div>
        )}

        {/* ── Boshqa usullar ── */}
        <div style={{ fontSize:12, color:'#8c8c8c', marginBottom:8, marginTop:4 }}>
          Yoki boshqa usul (admin tasdiqlanishini kutadi):
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
          {OTHER_METHODS.map(({ value, label }) => {
            const sel = selectedMethod === value
            return (
              <div
                key={value}
                onClick={() => setSelectedMethod(value)}
                style={{
                  padding:      '7px 14px',
                  borderRadius: 20,
                  border:       `1.5px solid ${sel ? '#1677ff' : '#d9d9d9'}`,
                  background:   sel ? '#e6f4ff' : 'transparent',
                  cursor:       'pointer',
                  fontSize:     13,
                  fontWeight:   sel ? 600 : 400,
                  color:        sel ? '#1677ff' : '#555',
                  transition:   'all 0.15s',
                  userSelect:   'none',
                }}
              >
                {label}
              </div>
            )
          })}
        </div>

        {/* ── Karta/online uchun isbot ── */}
        {needsProof && (
          <div style={{
            marginBottom: 18,
            padding:      '14px 16px',
            background:   '#fff7e6',
            border:       '1px solid #ffd591',
            borderRadius: 10,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
              <FileImageOutlined style={{ color:'#fa8c16' }}/>
              <span style={{ fontSize:13, fontWeight:600, color:'#d46b08' }}>
                To'lov isboti (chek URL) — majburiy
              </span>
            </div>
            <Input
              placeholder="https://... (chek yoki tranzaksiya URL)"
              value={proofUrl}
              onChange={e => setProofUrl(e.target.value)}
              style={{ borderRadius:8 }}
              size="large"
            />
            <div style={{ fontSize:11, color:'#8c8c8c', marginTop:6 }}>
              Bank ilovasi yoki POS terminaldan skrinshot linkini kiriting
            </div>
          </div>
        )}

        {/* ── Tasdiqlash tugmasi ── */}
        <Button
          type="primary"
          danger={selectedMethod !== 'Payme'}
          size="large"
          block
          loading={loading}
          disabled={!selectedMethod || (needsProof && !proofUrl.trim())}
          onClick={handlePay}
          style={{
            borderRadius: 10,
            height:       48,
            fontWeight:   700,
            fontSize:     15,
            background:   selectedMethod === 'Payme'
              ? PAYME_CONFIG.color
              : selectedMethod
                ? 'linear-gradient(135deg,#ff4d4f,#fa8c16)'
                : undefined,
            border: 'none',
            boxShadow: selectedMethod ? '0 4px 16px rgba(255,77,79,0.3)' : 'none',
          }}
        >
          {selectedMethod
            ? `${fmt(fine.amount)} so'm to'lash →`
            : "To'lov usulini tanlang"}
        </Button>
      </Modal>
    </>
  )
}
