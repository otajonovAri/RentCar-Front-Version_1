import api from './axiosInstance'
import type { UserDto, UpdateProfileDto, UpdateLicenseDto, UpdateRoleDto, BlockUserDto, UsersFilter } from '@/types/users'
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

  // ── SuperAdmin only ───────────────────────────────────────────────────────
  block: (userId: number, data: BlockUserDto) =>
    api.patch<void>(`/api/users/${userId}/block`, data),

  unblock: (userId: number) =>
    api.patch<void>(`/api/users/${userId}/unblock`),

  delete: (userId: number) =>
    api.delete<void>(`/api/users/${userId}`),

  getMyStatus: () =>
    api.get<{ userId: number; isBlocked: boolean; blockReason: string | null; blockedAt: string | null; blockedUntil: string | null }>('/api/users/my-status'),
}
