import api from './axiosInstance'
import type { InspectionDto, CreateInspectionDto, InspectionsFilter } from '@/types/inspections'
import type { PaginatedResponse } from '@/types/common'

export const inspectionsApi = {
  getAll: (params: InspectionsFilter) =>
    api.get<PaginatedResponse<InspectionDto>>('/api/inspections', { params }),

  create: (data: CreateInspectionDto) =>
    api.post<{ id: number }>('/api/inspections', data),
}
