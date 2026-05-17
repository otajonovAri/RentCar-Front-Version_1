import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Modal, Form, Select, message, Spin, Grid, theme } from 'antd'
import { CrownFilled, PlusOutlined, EditOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons'
import api from '@/api/axiosInstance'
import { ownersApi } from '@/api/ownersApi'
import type { OwnerDto } from '@/types/owners'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'

const { useBreakpoint } = Grid

// ─── Palette ─────────────────────────────────────────────────────────────────

const PALETTE = [
  { bar: '#722ed1', color: '#722ed1', light: 'rgba(114,46,209,0.12)', border: 'rgba(114,46,209,0.3)' },
  { bar: '#1677ff', color: '#1677ff', light: 'rgba(22,119,255,0.12)', border: 'rgba(22,119,255,0.3)' },
  { bar: '#13c2c2', color: '#13c2c2', light: 'rgba(19,194,194,0.12)', border: 'rgba(19,194,194,0.3)' },
  { bar: '#fa8c16', color: '#fa8c16', light: 'rgba(250,140,22,0.12)', border: 'rgba(250,140,22,0.3)' },
  { bar: '#eb2f96', color: '#eb2f96', light: 'rgba(235,47,150,0.12)', border: 'rgba(235,47,150,0.3)' },
  { bar: '#52c41a', color: '#52c41a', light: 'rgba(82,196,26,0.12)',  border: 'rgba(82,196,26,0.3)'  },
]

// ─── OwnerCard ────────────────────────────────────────────────────────────────

interface OwnerCardProps {
  owner: OwnerDto
  canEdit: boolean
  onEdit: (o: OwnerDto) => void
  onVerify: (o: OwnerDto) => void
  token: ReturnType<typeof theme.useToken>['token']
}

function OwnerCard({ owner, canEdit, onEdit, onVerify, token }: OwnerCardProps) {
  const [hovered, setHovered] = useState(false)
  const palette = PALETTE[owner.id % PALETTE.length]
  const initials = owner.fullName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: token.colorBgContainer,
        border: `1px solid ${hovered ? palette.border : token.colorBorderSecondary}`,
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* 5px top color bar */}
      <div style={{ height: 5, background: palette.bar }} />

      {/* Body */}
      <div style={{ padding: '20px 18px 14px', flex: 1 }}>
        {/* Avatar + ID badge row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: palette.light,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 18, color: palette.color,
          }}>
            {initials}
          </div>
          <span style={{
            fontSize: 11, color: token.colorTextTertiary, fontFamily: 'monospace',
            background: token.colorFillAlter, padding: '2px 7px', borderRadius: 6,
          }}>
            #{owner.id}
          </span>
        </div>

        {/* Name */}
        <div style={{
          fontWeight: 700, fontSize: 16,
          color: hovered ? palette.color : token.colorText,
          transition: 'color 0.2s', marginBottom: 8, lineHeight: 1.3,
        }}>
          {owner.fullName}
        </div>

        {/* Verification badge */}
        <div style={{ marginBottom: 10 }}>
          {owner.isVerified ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
              color: '#52c41a', background: 'rgba(82,196,26,0.12)', border: '1px solid rgba(82,196,26,0.3)',
              borderRadius: 20, padding: '2px 10px', fontWeight: 500,
            }}>
              ✓ Tasdiqlangan
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
              color: '#fa8c16', background: 'rgba(250,140,22,0.12)', border: '1px solid rgba(250,140,22,0.3)',
              borderRadius: 20, padding: '2px 10px', fontWeight: 500,
            }}>
              ⏳ Tasdiqlanmagan
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 12, color: token.colorTextSecondary,
            background: token.colorFillAlter, padding: '2px 8px', borderRadius: 6,
          }}>
            🚗 {owner.totalCarsCount} ta mashina
          </span>
          <span style={{
            fontSize: 12, color: token.colorTextSecondary,
            background: token.colorFillAlter, padding: '2px 8px', borderRadius: 6,
          }}>
            📄 {owner.activeContractsCount} ta shartnoma
          </span>
        </div>

        {/* Phone */}
        <div style={{ fontSize: 13, color: token.colorTextTertiary, marginBottom: 4 }}>
          📞 {owner.phoneNumber}
        </div>

        {/* Email */}
        <div style={{
          fontSize: 12, color: token.colorTextTertiary,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          ✉️ {owner.email}
        </div>
      </div>

      {/* Footer */}
      {canEdit && (
        <div style={{
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          padding: '10px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: hovered ? token.colorFillAlter : token.colorBgContainer,
          transition: 'background 0.2s',
        }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(owner)}
            style={{ borderRadius: 6 }}
          >
            Tahrirlash
          </Button>
          {!owner.isVerified && (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => onVerify(owner)}
              style={{ borderRadius: 6, background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
            >
              Tasdiqlash
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── OwnersPage ───────────────────────────────────────────────────────────────

export default function OwnersPage() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  // State
  const [data, setData] = useState<PaginatedResponse<OwnerDto> | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<OwnerDto | null>(null)
  const [saving, setSaving] = useState(false)
  const [, setVerifying] = useState(false)
  const [form] = Form.useForm()
  const [ownerUsers, setOwnerUsers] = useState<Array<{ id: number; fullName: string; email: string }>>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const { hasRole } = useAuthStore()
  const canEdit = hasRole(['Admin', 'SuperAdmin'])
  const { page, pageSize, onChange, reset } = usePagination()

  // Derived
  const total = data?.totalCount ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const gridCols = isMobile ? 1 : !screens.lg ? 2 : screens.xl ? 4 : 3

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ownersApi.getAll({
        search: search || undefined,
        isVerified: verifiedFilter,
        page,
        pageSize,
      })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, verifiedFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Fetch owner-role users (for create modal) ──────────────────────────────

  const fetchOwnerUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await api.get<PaginatedResponse<{
        id: number
        firstName: string
        lastName: string
        email: string
      }>>('/api/users', { params: { role: 'Owner', pageSize: 100 } })
      setOwnerUsers(
        res.data.items.map(u => ({
          id: u.id,
          fullName: `${u.firstName} ${u.lastName}`,
          email: u.email,
        }))
      )
    } catch {
      /* ignore */
    } finally {
      setUsersLoading(false)
    }
  }

  // ── Modal handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    fetchOwnerUsers()
    setModalOpen(true)
  }

  const openEdit = (o: OwnerDto) => {
    setEditing(o)
    form.setFieldsValue({
      passportNumber: o.passportNumber,
      passportSeries: o.passportSeries,
      bankAccount: o.bankAccount,
      bankName: o.bankName,
      address: o.address,
    })
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await ownersApi.update(editing.id, {
          passportNumber: values.passportNumber,
          passportSeries: values.passportSeries || undefined,
          bankAccount: values.bankAccount || undefined,
          bankName: values.bankName || undefined,
          address: values.address || undefined,
        })
        message.success('✅ Owner profili yangilandi')
      } else {
        await ownersApi.create({
          userId: values.userId,
          passportNumber: values.passportNumber,
          passportSeries: values.passportSeries || undefined,
          bankAccount: values.bankAccount || undefined,
          bankName: values.bankName || undefined,
          address: values.address || undefined,
        })
        message.success('✅ Owner profili yaratildi')
      }
      closeModal()
      fetchData()
    } catch (err) {
      message.error(getApiError(err, 'Xatolik yuz berdi'))
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async (owner: OwnerDto) => {
    setVerifying(true)
    try {
      await ownersApi.verify(owner.id)
      message.success(`✅ ${owner.fullName} tasdiqlandi`)
      fetchData()
    } catch (err) {
      message.error(getApiError(err, 'Tasdiqlashda xatolik'))
    } finally {
      setVerifying(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg,#1a0338 0%,#391085 55%,#722ed1 100%)',
        padding: isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
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
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Glass icon box */}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <CrownFilled style={{ fontSize: 28, color: '#fff' }} />
              </div>

              <div>
                <h1 style={{
                  margin: 0, color: '#fff', fontWeight: 800,
                  fontSize: isMobile ? 22 : 28, lineHeight: 1.2,
                }}>
                  Ownerlar
                </h1>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
                  {total} ta owner ro'yxatda
                  {search ? ` · qidirilmoqda: "${search}"` : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Counter chip (non-mobile) */}
              {!isMobile && (
                <div style={{
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '8px 16px',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#d3adf7', lineHeight: 1 }}>
                    {total}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                    Ownerlar
                  </div>
                </div>
              )}

              {/* Add button */}
              {canEdit && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreate}
                  size={isMobile ? 'middle' : 'large'}
                  style={{
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.2)',
                    borderColor: 'rgba(255,255,255,0.4)',
                    fontWeight: 600,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {isMobile ? null : "Owner profili qo'shish"}
                </Button>
              )}
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: 'Barchasi', value: undefined },
              { label: '✓ Tasdiqlanganlar', value: true },
              { label: '⏳ Tasdiqlanmaganlar', value: false },
            ].map(chip => {
              const active = verifiedFilter === chip.value
              return (
                <span
                  key={String(chip.value)}
                  onClick={() => { setVerifiedFilter(chip.value); reset() }}
                  style={{
                    borderRadius: 20, padding: '4px 14px', fontSize: 13,
                    color: '#fff', cursor: 'pointer',
                    background: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    border: active ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.2)',
                    fontWeight: active ? 700 : 400,
                    transition: 'all 0.18s',
                    userSelect: 'none' as const,
                  }}
                >
                  {chip.label}
                </span>
              )
            })}
          </div>

          {/* Search input */}
          <Input
            prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.6)' }} />}
            placeholder="Ism, telefon yoki email bo'yicha qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); reset() }}
            allowClear
            size="large"
            style={{
              marginTop: 16, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large" />
          <span style={{ color: token.colorTextTertiary }}>Ownerlar yuklanmoqda...</span>
        </div>
      ) : !data?.items?.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>👑</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Ownerlar topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {search
              ? `"${search}" bo'yicha natija yo'q`
              : 'Hali owner profili yaratilmagan'}
          </div>
          {(search || verifiedFilter !== undefined) && (
            <button
              onClick={() => { setSearch(''); setVerifiedFilter(undefined) }}
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 20,
                background: 'linear-gradient(135deg,#391085,#722ed1)',
                border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}
            >
              Filterni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
              <strong style={{ color: token.colorText }}>{total}</strong> ta owner
            </span>
            {totalPages > 1 && (
              <span style={{ fontSize: 12, color: token.colorTextTertiary }}>
                {page}/{totalPages} sahifa
              </span>
            )}
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols},1fr)`,
            gap: isMobile ? 12 : 16,
          }}>
            {data.items.map(owner => (
              <OwnerCard
                key={owner.id}
                owner={owner}
                canEdit={canEdit}
                onEdit={openEdit}
                onVerify={handleVerify}
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
                      ? 'linear-gradient(135deg,#391085,#722ed1)'
                      : token.colorBgContainer,
                    color: page === p ? '#fff' : token.colorText,
                    fontWeight: page === p ? 700 : 400,
                    fontSize: 13,
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

      {/* ── MODAL ── */}
      <Modal
        title={editing ? 'Owner profilini tahrirlash' : 'Owner profili yaratish'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={closeModal}
        confirmLoading={saving}
        okText="Saqlash"
        cancelText="Bekor"
        width={isMobile ? '95vw' : 480}
        forceRender
        styles={{ body: { paddingTop: 8 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* Only for create */}
          {!editing && (
            <Form.Item
              name="userId"
              label="Foydalanuvchi (Owner rolida)"
              rules={[{ required: true, message: 'Majburiy' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Foydalanuvchi tanlang"
                size="large"
                loading={usersLoading}
                options={ownerUsers.map(u => ({
                  value: u.id,
                  label: `${u.fullName} — ${u.email}`,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="passportNumber"
            label="Pasport raqami"
            rules={[
              { required: true, message: 'Majburiy' },
              { min: 5, message: 'Kamida 5 ta belgi' },
            ]}
          >
            <Input placeholder="AA1234567" size="large" />
          </Form.Item>

          <Form.Item name="passportSeries" label="Pasport seriyasi (ixtiyoriy)">
            <Input placeholder="AA" size="large" />
          </Form.Item>

          <Form.Item name="bankAccount" label="Bank hisobi / karta (ixtiyoriy)">
            <Input placeholder="8600 xxxx xxxx xxxx" size="large" />
          </Form.Item>

          <Form.Item name="bankName" label="Bank nomi (ixtiyoriy)">
            <Input placeholder="Kapitalbank" size="large" />
          </Form.Item>

          <Form.Item name="address" label="Manzil (ixtiyoriy)">
            <Input.TextArea rows={2} placeholder="Toshkent sh., Yunusobod tumani..." size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

