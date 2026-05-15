export type CarListingStatus = 'Pending' | 'Approved' | 'Rejected'

export interface CarListingDto {
  id: number
  ownerName: string
  brand: string
  model: string
  year: number
  licensePlate: string
  color: string
  requestedDailyRate: number
  ownerRevenuePercent: number | null
  status: CarListingStatus
  rejectionReason: string | null
  createdAt: string
}

export interface CreateCarListingDto {
  ownerId: number
  brandId: number
  carModelId: number
  categoryId: number
  fuelTypeId: number
  branchId?: number | null
  year: number
  licensePlate: string
  color: string
  seatCount: number
  mileage: number
  transmissionType: string
  requestedDailyRate: number
  description?: string | null
}

export interface ApproveListingDto {
  branchId: number
  ownerRevenuePercent: number
  approvedDailyRate?: number | null
  adminNotes?: string | null
}

export interface RejectListingDto {
  rejectionReason: string
}

export interface ListingsFilter {
  page: number
  pageSize: number
  ownerId?: number
  status?: CarListingStatus
}
