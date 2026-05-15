export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'

export interface ReservationDto {
  id: number
  customerName: string
  carBrand: string
  carModel: string
  licensePlate: string
  startDate: string
  endDate: string
  totalDays: number
  estimatedAmount: number
  status: ReservationStatus
  pickupBranch: string
  returnBranch: string | null
  driverName: string | null
  createdAt: string
}

export interface CreateReservationDto {
  carId: number
  userId: number
  startDate: string
  endDate: string
  pickupBranchId: number
  returnBranchId?: number | null
  driverId?: number | null
  notes?: string | null
}

export interface ReservationsFilter {
  page: number
  pageSize: number
  userId?: number
  status?: ReservationStatus
}
