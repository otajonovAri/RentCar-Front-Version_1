import api from './axiosInstance'
import type { RentalDto, CreateRentalDto, CompleteRentalDto, CancelRentalDto, RentalsFilter } from '@/types/rentals'
import type { PaginatedResponse } from '@/types/common'

export const rentalsApi = {
  getAll: (params: RentalsFilter) =>
    api.get<PaginatedResponse<RentalDto>>('/api/rentals', { params }),

  getById: (id: number) =>
    api.get<RentalDto>(`/api/rentals/${id}`),

  create: (data: CreateRentalDto) =>
    api.post<{ id: number }>('/api/rentals', data),

  activate: (id: number) =>
    api.patch<void>(`/api/rentals/${id}/activate`),

  complete: (id: number, data: CompleteRentalDto) =>
    api.patch<void>(`/api/rentals/${id}/complete`, data),

  cancel: (id: number, data: CancelRentalDto) =>
    api.patch<void>(`/api/rentals/${id}/cancel`, data),
}
