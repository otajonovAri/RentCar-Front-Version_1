import api from './axiosInstance'
import type { OwnerDto, CreateOwnerProfileDto, UpdateOwnerProfileDto, OwnersFilter } from '@/types/owners'
import type { PaginatedResponse } from '@/types/common'

export const ownersApi = {
  getAll: (params: OwnersFilter) =>
    api.get<PaginatedResponse<OwnerDto>>('/api/owners', { params }),
  getById: (id: number) =>
    api.get<OwnerDto>(`/api/owners/${id}`),
  create: (data: CreateOwnerProfileDto) =>
    api.post<{ id: number }>('/api/owners', data),
  update: (id: number, data: UpdateOwnerProfileDto) =>
    api.put<void>(`/api/owners/${id}`, data),
  verify: (id: number) =>
    api.post<void>(`/api/owners/${id}/verify`),
}
