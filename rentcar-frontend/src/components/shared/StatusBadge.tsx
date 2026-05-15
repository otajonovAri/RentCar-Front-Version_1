import { Tag } from 'antd'

type Color = 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'purple' | 'cyan'

const STATUS_MAP: Record<string, { color: Color; label: string }> = {
  // Car
  Available:    { color: 'green',  label: 'Mavjud' },
  Rented:       { color: 'blue',   label: 'Ijarada' },
  Maintenance:  { color: 'orange', label: 'Ta\'mirda' },
  Reserved:     { color: 'purple', label: 'Band' },
  Inactive:     { color: 'gray',   label: 'Nofaol' },
  // Rental / Reservation
  Pending:      { color: 'orange', label: 'Kutilmoqda' },
  Active:       { color: 'green',  label: 'Faol' },
  Confirmed:    { color: 'blue',   label: 'Tasdiqlangan' },
  Completed:    { color: 'cyan',   label: 'Yakunlangan' },
  Cancelled:    { color: 'red',    label: 'Bekor qilingan' },
  // Payment / Fine
  Paid:         { color: 'green',  label: "To'langan" },
  Failed:       { color: 'red',    label: 'Muvaffaqiyatsiz' },
  Refunded:     { color: 'purple', label: 'Qaytarilgan' },
  // Damage
  Reported:     { color: 'orange', label: 'Xabar berilgan' },
  UnderReview:  { color: 'blue',   label: 'Ko\'rib chiqilmoqda' },
  Repaired:     { color: 'green',  label: "Ta'mirlangan" },
  Closed:       { color: 'gray',   label: 'Yopilgan' },
  // Maintenance
  Scheduled:    { color: 'blue',   label: 'Rejalashtirilgan' },
  InProgress:   { color: 'orange', label: 'Jarayonda' },
  // Invoice
  Draft:        { color: 'gray',   label: 'Qoralama' },
  Issued:       { color: 'blue',   label: 'Yuborilgan' },
  Overdue:      { color: 'red',    label: 'Muddati o\'tgan' },
  Voided:       { color: 'gray',   label: 'Bekor' },
  // Owner Payout
  Processing:   { color: 'blue',   label: 'Jarayonda' },
  OnHold:       { color: 'orange', label: 'Kutishda' },
  // CarListing
  Approved:     { color: 'green',  label: 'Tasdiqlangan' },
  Rejected:     { color: 'red',    label: 'Rad etilgan' },
  // Conversation
  Open:         { color: 'green',  label: 'Ochiq' },
  // Role
  Customer:     { color: 'blue',   label: 'Mijoz' },
  Owner:        { color: 'purple', label: 'Egasi' },
  Manager:      { color: 'orange', label: 'Menejer' },
  Admin:        { color: 'red',    label: 'Admin' },
  SuperAdmin:   { color: 'red',    label: 'SuperAdmin' },
}

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status]
  if (!config) return <Tag>{status}</Tag>
  return <Tag color={config.color}>{config.label}</Tag>
}
