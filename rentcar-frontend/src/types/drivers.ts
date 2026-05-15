// GET /api/drivers (list) — faqat asosiy maydonlar
export interface DriverListItemDto {
  id: number
  fullName: string
  phoneNumber: string
  dailyRate: number
  branchName: string | null
}

// GET /api/drivers/{id} — to'liq ma'lumotlar
export interface DriverDto {
  id: number
  fullName: string
  phoneNumber: string
  licenseNumber: string
  licenseExpirationDate: string
  dailyRate: number
  photoUrl: string | null
  branchName: string | null
  isLinkedToUser: boolean
}

export interface CreateDriverDto {
  firstName: string
  lastName: string
  phoneNumber: string
  licenseNumber: string
  licenseExpirationDate: string
  dailyRate: number
  branchId: number
  userId?: number | null
  photoUrl?: string | null
  notes?: string | null
}

export interface UpdateDriverDto {
  firstName: string
  lastName: string
  phoneNumber: string
  dailyRate: number
  branchId: number
}
