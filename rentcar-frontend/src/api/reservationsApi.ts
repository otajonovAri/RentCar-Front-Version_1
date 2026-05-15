import api from './axiosInstance'
import type { ReservationDto, CreateReservationDto, ReservationsFilter } from '@/types/reservations'
import type { PaginatedResponse } from '@/types/common'

export const reservationsApi = {
  getAll: (params: ReservationsFilter) =>
    api.get<PaginatedResponse<ReservationDto>>('/api/reservations', { params }),

  create: (data: CreateReservationDto) =>
    api.post<{ id: number }>('/api/reservations', data),

  cancel: (id: number, reason: string) =>
    api.patch<void>(`/api/reservations/${id}/cancel`, { reason }),
}
