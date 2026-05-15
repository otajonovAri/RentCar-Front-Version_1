import api from './axiosInstance'
import type { PricingTierDto, CreatePricingTierDto } from '@/types/pricingTiers'

export const pricingTiersApi = {
  getAll: (params?: { carId?: number; categoryId?: number; activeOnly?: boolean }) =>
    api.get<PricingTierDto[]>('/api/pricing-tiers', { params }),

  create: (data: CreatePricingTierDto) =>
    api.post<{ id: number }>('/api/pricing-tiers', data),

  update: (id: number, data: Partial<CreatePricingTierDto>) =>
    api.put<void>(`/api/pricing-tiers/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/api/pricing-tiers/${id}`),
}
