import api from './axiosInstance'
import type { BrandDto, CreateBrandDto } from '@/types/brands'
import type { PaginatedResponse } from '@/types/common'

export const brandsApi = {
  getAll: (params?: { search?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResponse<BrandDto>>('/api/brands', { params }),

  create: (data: CreateBrandDto) =>
    api.post<{ id: number }>('/api/brands', data),

  update: (id: number, data: CreateBrandDto) =>
    api.put<void>(`/api/brands/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/api/brands/${id}`),
}
