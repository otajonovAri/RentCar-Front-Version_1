import api from './axiosInstance'
import type { MaintenanceDto, CreateMaintenanceDto, MaintenanceFilter } from '@/types/maintenance'
import type { PaginatedResponse } from '@/types/common'

export const maintenanceApi = {
  getAll: (params: MaintenanceFilter) =>
    api.get<PaginatedResponse<MaintenanceDto>>('/api/maintenance', { params }),

  create: (data: CreateMaintenanceDto) =>
    api.post<{ id: number }>('/api/maintenance', data),

  complete: (id: number, actualCost: number) =>
    api.patch<void>(`/api/maintenance/${id}/complete`, { actualCost }),
}
