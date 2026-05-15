import api from './axiosInstance'
import type { FineDto, CreateFineDto, FinesFilter } from '@/types/fines'
import type { PaginatedResponse } from '@/types/common'

export const finesApi = {
  getAll: (params: FinesFilter) =>
    api.get<PaginatedResponse<FineDto>>('/api/fines', { params }),

  create: (data: CreateFineDto) =>
    api.post<{ id: number }>('/api/fines', data),

  pay: (id: number) =>
    api.patch<void>(`/api/fines/${id}/pay`),
}
