import api from './axiosInstance'
import type { DamageReportDto, CreateDamageReportDto, UpdateDamageReportDto, DamageReportsFilter } from '@/types/damageReports'
import type { PaginatedResponse } from '@/types/common'

export const damageReportsApi = {
  getAll: (params: DamageReportsFilter) =>
    api.get<PaginatedResponse<DamageReportDto>>('/api/damage-reports', { params }),

  create: (data: CreateDamageReportDto) =>
    api.post<{ id: number }>('/api/damage-reports', data),

  update: (id: number, data: UpdateDamageReportDto) =>
    api.patch<void>(`/api/damage-reports/${id}`, data),
}
