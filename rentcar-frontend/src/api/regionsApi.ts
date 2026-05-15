import api from './axiosInstance'
import type { RegionDto, CreateRegionDto, UpdateRegionDto, RegionsFilter } from '@/types/regions'
import type { PaginatedResponse } from '@/types/common'

export const regionsApi = {
  getAll: (params: RegionsFilter) =>
    api.get<PaginatedResponse<RegionDto>>('/api/region', { params }),

  getById: (id: number) =>
    api.get<RegionDto>(`/api/region/${id}`),

  create: (data: CreateRegionDto) =>
    api.post<{ id: number }>('/api/region', data),

  update: (id: number, data: UpdateRegionDto) =>
    api.put<void>(`/api/region/${id}`, { ...data, id }),

  delete: (id: number) =>
    api.delete<void>(`/api/region/${id}`),
}
