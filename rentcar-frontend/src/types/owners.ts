export type ContractStatus = 'Draft' | 'Active' | 'Suspended' | 'Terminated' | 'Expired'

export interface OwnerDto {
  id: number
  userId: number
  fullName: string
  email: string
  phoneNumber: string
  userRole: string
  passportSeries?: string
  passportNumber: string
  bankAccount?: string
  bankName?: string
  address?: string
  isVerified: boolean
  verifiedAt?: string
  createdAt: string
  activeContractsCount: number
  totalCarsCount: number
}

export interface OwnerContractDto {
  id: number
  ownerId: number
  ownerName: string
  carId: number
  carPlate: string
  carInfo: string
  contractNumber: string
  startDate: string
  endDate?: string
  commissionPercent: number
  monthlyMinimum?: number
  status: ContractStatus
  signedAt?: string
  notes?: string
  createdAt: string
}

export interface CreateOwnerProfileDto {
  userId: number
  passportNumber: string
  passportSeries?: string
  bankAccount?: string
  bankName?: string
  address?: string
}

export interface UpdateOwnerProfileDto {
  passportNumber: string
  passportSeries?: string
  bankAccount?: string
  bankName?: string
  address?: string
}

export interface OwnersFilter {
  search?: string
  isVerified?: boolean
  page?: number
  pageSize?: number
}

export interface CreateOwnerContractDto {
  ownerId: number
  carId: number
  contractNumber: string
  startDate: string
  endDate?: string
  commissionPercent: number
  monthlyMinimum?: number
  notes?: string
}

export interface UpdateOwnerContractDto {
  startDate: string
  endDate?: string
  commissionPercent: number
  monthlyMinimum?: number
  notes?: string
}

export interface OwnerContractsFilter {
  ownerId?: number
  carId?: number
  status?: string
  page?: number
  pageSize?: number
}
