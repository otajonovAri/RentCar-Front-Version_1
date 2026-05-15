import api from './axiosInstance'
import type { DriverDto, DriverListItemDto, CreateDriverDto, UpdateDriverDto } from '@/types/drivers'

export const driversApi = {
  getAll: (branchId?: number) =>
    api.get<DriverListItemDto[]>('/api/drivers', { params: branchId ? { branchId } : {} }),

  getById: (id: number) =>
    api.get<DriverDto>(`/api/drivers/${id}`),

  create: (data: CreateDriverDto) =>
    api.post<{ id: number }>('/api/drivers', data),

  update: (id: number, data: UpdateDriverDto) =>
    api.put<void>(`/api/drivers/${id}`, data),
}
