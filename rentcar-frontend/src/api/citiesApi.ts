import api from './axiosInstance'
import type { CityDto, CreateCityDto, UpdateCityDto, CitiesFilter } from '@/types/regions'
import type { PaginatedResponse } from '@/types/common'

export const citiesApi = {
  getAll: (params: CitiesFilter) =>
    api.get<PaginatedResponse<CityDto>>('/api/cities', { params }),

  getById: (id: number) =>
    api.get<CityDto>(`/api/cities/${id}`),

  create: (data: CreateCityDto) =>
    api.post<{ id: number }>('/api/cities', data),

  update: (id: number, data: UpdateCityDto) =>
    api.put<void>(`/api/cities/${id}`, { ...data, id }),

  delete: (id: number) =>
    api.delete<void>(`/api/cities/${id}`),
}
