import api from './axiosInstance'
import type { PromotionDto, CreatePromotionDto } from '@/types/promotions'

export const promotionsApi = {
  getAll: (activeOnly?: boolean) =>
    api.get<PromotionDto[]>('/api/promotions', { params: activeOnly !== undefined ? { activeOnly } : {} }),

  validate: (code: string) =>
    api.get<PromotionDto>(`/api/promotions/validate/${code}`),

  create: (data: CreatePromotionDto) =>
    api.post<{ id: number }>('/api/promotions', data),

  update: (id: number, data: CreatePromotionDto) =>
    api.put<void>(`/api/promotions/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/api/promotions/${id}`),
}
