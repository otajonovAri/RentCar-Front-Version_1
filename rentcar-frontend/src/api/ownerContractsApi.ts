import api from './axiosInstance'
import type { OwnerContractDto, CreateOwnerContractDto, UpdateOwnerContractDto, OwnerContractsFilter } from '@/types/owners'
import type { PaginatedResponse } from '@/types/common'

export const ownerContractsApi = {
  getAll: (params: OwnerContractsFilter) =>
    api.get<PaginatedResponse<OwnerContractDto>>('/api/owner-contracts', { params }),
  getById: (id: number) =>
    api.get<OwnerContractDto>(`/api/owner-contracts/${id}`),
  create: (data: CreateOwnerContractDto) =>
    api.post<{ id: number }>('/api/owner-contracts', data),
  update: (id: number, data: UpdateOwnerContractDto) =>
    api.put<void>(`/api/owner-contracts/${id}`, data),
  changeStatus: (id: number, newStatus: string) =>
    api.patch<void>(`/api/owner-contracts/${id}/status`, { newStatus }),
}
