import api from './axiosInstance'
import type { BranchDto, CreateBranchDto, UpdateBranchDto } from '@/types/branches'

export const branchesApi = {
  getAll: (cityId?: number) =>
    api.get<BranchDto[]>('/api/branches', { params: cityId ? { cityId } : {} }),

  getById: (id: number) =>
    api.get<BranchDto>(`/api/branches/${id}`),

  create: (data: CreateBranchDto) =>
    api.post<{ id: number }>('/api/branches', data),

  update: (id: number, data: UpdateBranchDto) =>
    api.put<void>(`/api/branches/${id}`, data),
}
