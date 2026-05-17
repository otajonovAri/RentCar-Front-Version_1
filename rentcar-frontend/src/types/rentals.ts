export type RentalStatus = 'Pending' | 'Active' | 'Completed' | 'Cancelled'

export interface RentalDto {
  id: number
  customerName: string
  carBrand: string
  carModel: string
  licensePlate: string
  startDate: string
  endDate: string
  actualReturnDate: string | null
  totalDays: number
  baseAmount: number
  addonAmount: number
  discountAmount: number
  totalAmount: number
  status: RentalStatus
  pickupBranch: string
  returnBranch: string | null
  driverName: string | null
  promotionCode: string | null
  notes: string | null
  createdAt: string
}

export interface CreateRentalDto {
  carId: number
  /** userId is intentionally omitted — the backend reads it from JWT claims */
  startDate: string
  endDate: string
  pickupBranchId: number
  returnBranchId?: number | null
  driverId?: number | null
  promotionCode?: string | null
  addonIds?: number[]
  notes?: string | null
}

export interface CompleteRentalDto {
  actualReturnDate: string
  notes?: string | null
}

export interface CancelRentalDto {
  reason: string
}

export interface RentalsFilter {
  page: number
  pageSize: number
  userId?: number
  carId?: number
  status?: RentalStatus
  fromDate?: string
  toDate?: string
}
