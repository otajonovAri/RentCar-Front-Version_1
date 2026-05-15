import api from './axiosInstance'
import type { UserDto, UpdateProfileDto, UpdateLicenseDto, UpdateRoleDto, UsersFilter } from '@/types/users'
import type { PaginatedResponse } from '@/types/common'

export const usersApi = {
  getAll: (params: UsersFilter) =>
    api.get<PaginatedResponse<UserDto>>('/api/users', { params }),

  getById: (id: number) =>
    api.get<UserDto>(`/api/users/${id}`),

  updateProfile: (userId: number, data: UpdateProfileDto) =>
    api.put<void>(`/api/users/${userId}/profile`, data),

  updateLicense: (userId: number, data: UpdateLicenseDto) =>
    api.put<void>(`/api/users/${userId}/license`, data),

  updateRole: (userId: number, data: UpdateRoleDto) =>
    api.patch<void>(`/api/users/${userId}/role`, data),
}
