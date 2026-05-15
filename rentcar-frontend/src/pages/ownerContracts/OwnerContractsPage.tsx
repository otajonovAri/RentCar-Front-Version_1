import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Modal, Form, Select, InputNumber, DatePicker, message, Spin, Grid, theme } from 'antd'
import { AuditOutlined, PlusOutlined, EditOutlined, SwapOutlined, SearchOutlined } from '@ant-design/icons'
import { ownerContractsApi } from '@/api/ownerContractsApi'
import { ownersApi } from '@/api/ownersApi'
import type { OwnerContractDto, ContractStatus, CreateOwnerContractDto } from '@/types/owners'
import type { PaginatedResponse } from '@/types/common'
import { usePagination } from '@/hooks/usePagination'
import { useAuthStore } from '@/store/authStore'
import { getApiError } from '@/utils/apiError'
import api from '@/api/axiosInstance'
import dayjs from 'dayjs'

const { useBreakpoint } = Grid

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ContractStatus, { color: string; bg: string; border: string; label: string }> = {
  Draft:      { color: '#595959', bg: 'rgba(0,0,0,0.06)',        border: 'rgba(0,0,0,0.15)',       label: '📝 Qoralama'      },
  Active:     { color: '#52c41a', bg: 'rgba(82,196,26,0.12)',    border: 'rgba(82,196,26,0.3)',    label: '✅ Faol'           },
  Suspended:  { color: '#fa8c16', bg: 'rgba(250,140,22,0.12)',   border: 'rgba(250,140,22,0.3)',   label: "⏸ To'xtatilgan"  },
  Terminated: { color: '#f5222d', bg: 'rgba(245,34,45,0.12)',    border: 'rgba(245,34,45,0.3)',    label: '❌ Bekor qilingan' },
  Expired:    { color: '#8c8c8c', bg: 'rgba(140,140,140,0.12)', border: 'rgba(140,140,140,0.3)',  label: "⌛ Muddati o'tgan" },
}

const ALL_STATUSES: ContractStatus[] = ['Draft', 'Active', 'Suspended', 'Terminated', 'Expired']

// ── Filter chips config ───────────────────────────────────────────────────────
const FILTER_CHIPS = [
  { label: 'Barchasi',          value: 'All'        },
  { label: '📝 Qoralama',       value: 'Draft'      },
  { label: '✅ Faol',           value: 'Active'     },
  { label: "⏸ To'xtatilgan",   value: 'Suspended'  },
  { label: '❌ Bekor',          value: 'Terminated' },
  { label: "⌛ Muddati o'tgan", value: 'Expired'    },
]

// ── ContractCard types ────────────────────────────────────────────────────────
interface ContractCardProps {
  contract: OwnerContractDto
  canEdit: boolean
  onEdit: (c: OwnerContractDto) => void
  onChangeStatus: (c: OwnerContractDto) => void
  token: ReturnType<typeof theme.useToken>['token']
}

// ── ContractCard component ────────────────────────────────────────────────────
function ContractCard({ contract, canEdit, onEdit, onChangeStatus, token }: ContractCardProps) {
  const [hovered, setHovered] = useState(false)
  const cfg = STATUS_CFG[contract.status as ContractStatus] ?? STATUS_CFG.Draft

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: token.colorBgContainer,
        border: `1px solid ${hovered ? 'rgba(19,194,194,0.4)' : token.colorBorderSecondary}`,
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Top bar colored by status */}
      <div style={{ height: 4, background: cfg.color }} />

      <div style={{ padding: '18px 18px 12px', flex: 1 }}>
        {/* Row: contract number + status badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 14,
            color: hovered ? '#13c2c2' : token.colorText,
            transition: 'color 0.18s',
          }}>
            {contract.contractNumber}
          </span>
          <span style={{
            fontSize: 11,
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 20,
            padding: '2px 8px',
            fontWeight: 600,
          }}>
            {cfg.label}
          </span>
        </div>

        {/* Car plate badge */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            color: '#13c2c2',
            background: 'rgba(19,194,194,0.1)',
            border: '1px solid rgba(19,194,194,0.3)',
            borderRadius: 6,
            padding: '2px 8px',
          }}>
            🚗 {contract.carPlate}
          </span>
          <span style={{ fontSize: 12, color: token.colorTextTertiary, marginLeft: 8 }}>
            {contract.carInfo}
          </span>
        </div>

        {/* Owner name */}
        <div style={{ fontSize: 13, color: token.colorTextSecondary, marginBottom: 10 }}>
          👤 {contract.ownerName}
        </div>

        {/* Commission highlight */}
        <div style={{
          background: 'rgba(19,194,194,0.08)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: token.colorTextTertiary }}>Komissiya foizi</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#13c2c2' }}>
            {contract.commissionPercent}%
          </span>
        </div>

        {/* Date range */}
        <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 4 }}>
          📅 {dayjs(contract.startDate).format('DD.MM.YYYY')}
          {' → '}
          {contract.endDate ? dayjs(contract.endDate).format('DD.MM.YYYY') : 'Muddatsiz'}
        </div>

        {/* Monthly minimum if exists */}
        {contract.monthlyMinimum != null && (
          <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 4 }}>
            💰 Minimal: {contract.monthlyMinimum.toLocaleString()} so'm/oy
          </div>
        )}

        {/* Signed date if present */}
        {contract.signedAt && (
          <div style={{ fontSize: 11, color: '#52c41a' }}>
            ✍️ Imzolangan: {dayjs(contract.signedAt).format('DD.MM.YYYY')}
          </div>
        )}
      </div>

      {/* Footer */}
      {canEdit && (
        <div style={{
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          padding: '10px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: hovered ? token.colorFillAlter : token.colorBgContainer,
          transition: 'background 0.2s',
        }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(contract)}
            disabled={contract.status !== 'Draft'}
            style={{ borderRadius: 6 }}
          >
            Tahrirlash
          </Button>
          <Button
            size="small"
            icon={<SwapOutlined />}
            onClick={() => onChangeStatus(contract)}
            style={{ borderRadius: 6 }}
          >
            Holat
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OwnerContractsPage() {
  const { token }   = theme.useToken()
  const screens     = useBreakpoint()
  const isMobile    = !screens.md

  // State
  const [data, setData]                   = useState<PaginatedResponse<OwnerContractDto> | null>(null)
  const [loading, setLoading]             = useState(false)
  const [statusFilter, setStatusFilter]   = useState<string>('All')
  const [search, setSearch]               = useState('')

  const [modalOpen, setModalOpen]         = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<OwnerContractDto | null>(null)
  const [editing, setEditing]             = useState<OwnerContractDto | null>(null)
  const [saving, setSaving]               = useState(false)

  const [form]       = Form.useForm()
  const [statusForm] = Form.useForm()

  const [owners, setOwners]               = useState<Array<{ id: number; fullName: string; userId: number }>>([])
  const [ownersLoading, setOwnersLoading] = useState(false)
  const [cars, setCars]                   = useState<Array<{ id: number; plate: string; info: string }>>([])
  const [carsLoading, setCarsLoading]     = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | undefined>()

  const { hasRole }  = useAuthStore()
  const canEdit      = hasRole(['Admin', 'SuperAdmin'])
  const { page, pageSize, onChange, reset } = usePagination()

  // ── Fetch contracts ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        status:   statusFilter === 'All' ? undefined : statusFilter,
        page,
        pageSize,
      }
      const res = await ownerContractsApi.getAll(params)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Fetch owners for create modal ───────────────────────────────────────────
  const fetchOwners = async () => {
    setOwnersLoading(true)
    try {
      const res = await ownersApi.getAll({ pageSize: 100 })
      setOwners(res.data.items.map(o => ({ id: o.id, fullName: o.fullName, userId: o.userId })))
    } catch {
      /* ignore */
    } finally {
      setOwnersLoading(false)
    }
  }

  // ── Fetch cars for a given owner ────────────────────────────────────────────
  const fetchCarsForOwner = async (ownerId: number) => {
    const owner = owners.find(o => o.id === ownerId)
    if (!owner) return
    setCarsLoading(true)
    try {
      const res = await api.get('/api/cars', { params: { ownerId: owner.userId, pageSize: 100 } })
      setCars(
        (res.data.items ?? []).map((c: any) => ({
          id:   c.id,
          plate: c.licensePlate,
          info: `${c.brandName} ${c.carModelName}`,
        }))
      )
    } catch {
      setCars([])
    } finally {
      setCarsLoading(false)
    }
  }

  // ── Modal handlers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    fetchOwners()
    setCars([])
    setSelectedOwnerId(undefined)
    setModalOpen(true)
  }

  const openEdit = (c: OwnerContractDto) => {
    setEditing(c)
    form.setFieldsValue({
      startDate:         dayjs(c.startDate),
      endDate:           c.endDate ? dayjs(c.endDate) : undefined,
      commissionPercent: c.commissionPercent,
      monthlyMinimum:    c.monthlyMinimum,
      notes:             c.notes,
    })
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  const openStatusModal = (c: OwnerContractDto) => {
    setSelectedContract(c)
    statusForm.resetFields()
    setStatusModalOpen(true)
  }

  const closeStatusModal = () => setStatusModalOpen(false)

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await ownerContractsApi.update(editing.id, {
          startDate:         values.startDate.toISOString(),
          endDate:           values.endDate?.toISOString(),
          commissionPercent: values.commissionPercent,
          monthlyMinimum:    values.monthlyMinimum,
          notes:             values.notes,
        })
        message.success('✅ Shartnoma yangilandi')
      } else {
        const payload: CreateOwnerContractDto = {
          ownerId:           values.ownerId,
          carId:             values.carId,
          contractNumber:    values.contractNumber,
          startDate:         values.startDate.toISOString(),
          endDate:           values.endDate?.toISOString(),
          commissionPercent: values.commissionPercent,
          monthlyMinimum:    values.monthlyMinimum,
          notes:             values.notes,
        }
        await ownerContractsApi.create(payload)
        message.success('✅ Shartnoma yaratildi')
      }
      closeModal()
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik'))
    } finally {
      setSaving(false)
    }
  }

  // ── Status change ───────────────────────────────────────────────────────────
  const handleStatusChange = async () => {
    const values = await statusForm.validateFields()
    setSaving(true)
    try {
      await ownerContractsApi.changeStatus(selectedContract!.id, values.newStatus)
      message.success('✅ Shartnoma holati yangilandi')
      closeStatusModal()
      fetchData()
    } catch (err: unknown) {
      message.error(getApiError(err, 'Xatolik'))
    } finally {
      setSaving(false)
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const total      = data?.totalCount ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const gridCols   = isMobile ? 1 : !screens.lg ? 2 : screens.xl ? 3 : 2

  // ── Chip styles ─────────────────────────────────────────────────────────────
  const chipBase: React.CSSProperties = {
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 13,
    color: '#fff',
    cursor: 'pointer',
    userSelect: 'none',
  }
  const activeChip: React.CSSProperties = {
    ...chipBase,
    background: 'rgba(255,255,255,0.3)',
    border: '1px solid rgba(255,255,255,0.6)',
    fontWeight: 700,
  }
  const inactiveChip: React.CSSProperties = {
    ...chipBase,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    fontWeight: 400,
  }

  // ── Filtered items (client-side search on contract number / owner / plate) ──
  const filteredItems = (data?.items ?? []).filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.contractNumber.toLowerCase().includes(q) ||
      c.ownerName.toLowerCase().includes(q) ||
      c.carPlate.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: isMobile ? 16 : 20,
        background: 'linear-gradient(135deg,#001a1f 0%,#00474f 55%,#13c2c2 100%)',
        padding: isMobile ? '28px 20px 24px' : '40px 40px 36px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {[
          { s: 220, t: -80,       r: -60,      o: .07 },
          { s: 140, t: 20,        r: 140,      o: .05 },
          { s: 100, b: -40 as number | undefined, l: 80, o: .07 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            borderRadius: '50%',
            background: '#fff',
            width: c.s,
            height: c.s,
            opacity: c.o,
            top:    't' in c ? (c as any).t : undefined,
            right:  'r' in c ? (c as any).r : undefined,
            bottom: 'b' in c ? (c as any).b : undefined,
            left:   'l' in c ? (c as any).l : undefined,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Title row */}
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 16,
            marginBottom: 20,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Glass icon box */}
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AuditOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{
                margin: 0,
                fontSize: isMobile ? 22 : 28,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.2,
              }}>
                Shartnomalar
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {total} ta shartnoma ro'yxatda
              </p>
            </div>

            {/* Counter chip */}
            {!isMobile && (
              <div style={{
                padding: '8px 20px', borderRadius: 12, textAlign: 'center',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <div style={{ fontWeight: 800, fontSize: 24, color: '#87e8de', lineHeight: 1 }}>{total}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Shartnomalar</div>
              </div>
            )}

            {/* Add button */}
            {canEdit && (
              <Button
                icon={<PlusOutlined />}
                size="large"
                onClick={openCreate}
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
                {isMobile ? '' : "Shartnoma qo'shish"}
              </Button>
            )}
          </div>

          {/* Search */}
          <Input
            prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.6)' }} />}
            placeholder="Shartnoma raqami, owner yoki mashina raqami..."
            value={search}
            onChange={e => { setSearch(e.target.value); reset() }}
            allowClear
            size="large"
            style={{
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              fontSize: 14,
              marginBottom: 14,
            }}
          />

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTER_CHIPS.map(chip => (
              <span
                key={chip.value}
                style={statusFilter === chip.value ? activeChip : inactiveChip}
                onClick={() => { setStatusFilter(chip.value); reset() }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
          <Spin size="large" />
          <span style={{ color: token.colorTextTertiary, fontSize: 13 }}>Shartnomalar yuklanmoqda...</span>
        </div>
      ) : !filteredItems.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText, marginBottom: 6 }}>
            Shartnomalar topilmadi
          </div>
          <div style={{ fontSize: 13, color: token.colorTextTertiary }}>
            {search
              ? `"${search}" bo'yicha natija yo'q`
              : statusFilter !== 'All'
                ? "Bu status bo'yicha shartnoma topilmadi"
                : "Hali shartnoma qo'shilmagan"}
          </div>
          {(search || statusFilter !== 'All') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('All'); reset() }}
              style={{
                marginTop: 12,
                padding: '8px 20px',
                borderRadius: 20,
                background: 'linear-gradient(135deg,#00474f,#13c2c2)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Filter tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Result info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
              <strong style={{ color: token.colorText }}>{filteredItems.length}</strong> ta shartnoma
            </span>
            {totalPages > 1 && (
              <span style={{ fontSize: 12, color: token.colorTextTertiary }}>
                {page} / {totalPages} sahifa
              </span>
            )}
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: isMobile ? 12 : 16,
          }}>
            {filteredItems.map(contract => (
              <ContractCard
                key={contract.id}
                contract={contract}
                canEdit={canEdit}
                onEdit={openEdit}
                onChangeStatus={openStatusModal}
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
                      ? 'linear-gradient(135deg,#00474f,#13c2c2)'
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

      {/* ── CREATE / EDIT MODAL ──────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#00474f,#13c2c2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AuditOutlined style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <span style={{ fontWeight: 700 }}>
              {editing ? 'Shartnomani tahrirlash' : 'Yangi shartnoma yaratish'}
            </span>
          </div>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={closeModal}
        confirmLoading={saving}
        okText="Saqlash"
        cancelText="Bekor"
        okButtonProps={{
          style: { borderRadius: 8, fontWeight: 700, background: '#13c2c2', border: 'none' },
        }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={isMobile ? '95vw' : 520}
        forceRender
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* Create only fields */}
          {!editing && (
            <>
              <Form.Item
                name="ownerId"
                label={<span style={{ fontWeight: 600 }}>👤 Owner</span>}
                rules={[{ required: true, message: 'Owner tanlang' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Owner tanlang"
                  size="large"
                  loading={ownersLoading}
                  options={owners.map(o => ({ value: o.id, label: o.fullName }))}
                  onChange={(val: number) => {
                    setSelectedOwnerId(val)
                    fetchCarsForOwner(val)
                    form.setFieldValue('carId', undefined)
                  }}
                />
              </Form.Item>

              <Form.Item
                name="carId"
                label={<span style={{ fontWeight: 600 }}>🚗 Mashina</span>}
                rules={[{ required: true, message: 'Mashina tanlang' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Mashina tanlang"
                  size="large"
                  loading={carsLoading}
                  disabled={!selectedOwnerId}
                  options={cars.map(c => ({ value: c.id, label: `${c.plate} — ${c.info}` }))}
                />
              </Form.Item>

              <Form.Item
                name="contractNumber"
                label={<span style={{ fontWeight: 600 }}>📄 Shartnoma raqami</span>}
                rules={[{ required: true, message: 'Shartnoma raqamini kiriting' }]}
              >
                <Input placeholder="OC-2025-001" size="large" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="startDate"
            label={<span style={{ fontWeight: 600 }}>📅 Boshlanish sanasi</span>}
            rules={[{ required: true, message: 'Boshlanish sanasini tanlang' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item
            name="endDate"
            label={<span style={{ fontWeight: 600 }}>📅 Tugash sanasi (ixtiyoriy)</span>}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item
            name="commissionPercent"
            label={<span style={{ fontWeight: 600 }}>💹 Komissiya foizi (%)</span>}
            rules={[{ required: true, message: 'Komissiya foizini kiriting' }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.5}
              size="large"
              style={{ width: '100%' }}
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item
            name="monthlyMinimum"
            label={<span style={{ fontWeight: 600 }}>💰 Minimal oylik to'lov (ixtiyoriy)</span>}
          >
            <InputNumber
              min={0}
              size="large"
              style={{ width: '100%' }}
              addonAfter="so'm"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label={<span style={{ fontWeight: 600 }}>📝 Izoh (ixtiyoriy)</span>}
          >
            <Input.TextArea rows={2} size="large" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── STATUS CHANGE MODAL ──────────────────────────────────────────────── */}
      <Modal
        title="Shartnoma holatini o'zgartirish"
        open={statusModalOpen}
        onOk={handleStatusChange}
        onCancel={closeStatusModal}
        confirmLoading={saving}
        okText="O'zgartirish"
        cancelText="Bekor"
        okButtonProps={{
          style: { borderRadius: 8, fontWeight: 700, background: '#13c2c2', border: 'none' },
        }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={400}
        forceRender
      >
        {selectedContract && (
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: token.colorFillAlter,
            fontSize: 13,
          }}>
            <strong>{selectedContract.contractNumber}</strong>
            <span style={{ marginLeft: 8, color: token.colorTextTertiary }}>
              — Hozirgi holat: {STATUS_CFG[selectedContract.status as ContractStatus]?.label}
            </span>
          </div>
        )}
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="newStatus"
            label="Yangi holat"
            rules={[{ required: true, message: 'Tanlang' }]}
          >
            <Select
              size="large"
              placeholder="Holat tanlang"
              options={ALL_STATUSES.map(s => ({ value: s, label: STATUS_CFG[s].label }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
