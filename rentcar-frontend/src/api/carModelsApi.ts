import api from './axiosInstance'
import type { CarModelDto, CreateCarModelDto } from '@/types/brands'
import type { PaginatedResponse } from '@/types/common'

export const carModelsApi = {
  getAll: (params?: { brandId?: number; search?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResponse<CarModelDto>>('/api/car-models', { params }),

  create: (data: CreateCarModelDto) =>
    api.post<{ id: number }>('/api/car-models', data),

  update: (id: number, name: string) =>
    api.put<void>(`/api/car-models/${id}`, { name }),

  delete: (id: number) =>
    api.delete<void>(`/api/car-models/${id}`),
}
