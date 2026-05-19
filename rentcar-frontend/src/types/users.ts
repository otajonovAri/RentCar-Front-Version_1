import type { UserRole } from './auth'

export interface UserDto {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  role: UserRole
  dateOfBirth: string | null
  address: string | null
  licenseNumber: string | null
  avatarUrl: string | null
  emailConfirmed: boolean
  lastActive: string | null
  createdAt: string
  // Block info
  isBlocked: boolean
  blockReason: string | null
  blockedAt: string | null
  blockedUntil: string | null
}

export interface UpdateProfileDto {
  firstName: string
  lastName: string
  middleName?: string | null
  phoneNumber: string
  address?: string | null
  dateOfBirth: string
  avatarUrl?: string | null
}

export interface UpdateLicenseDto {
  licenseNumber: string
  licenseExpirationDate: string
  driverLicenseImageUrl?: string | null
}

export interface UpdateRoleDto {
  role: UserRole
}

export interface BlockUserDto {
  reason: string
  blockedUntil?: string | null
}

export interface UsersFilter {
  page: number
  pageSize: number
  search?: string
  role?: UserRole
  isBlocked?: boolean
}
