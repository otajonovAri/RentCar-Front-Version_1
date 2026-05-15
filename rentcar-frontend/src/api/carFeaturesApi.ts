import api from './axiosInstance'
import type { LookupItem } from '@/types/lookups'

export const carFeaturesApi = {
  getAll: () =>
    api.get<LookupItem[]>('/api/car-features'),

  create: (name: string) =>
    api.post<{ id: number }>('/api/car-features', { name }),

  update: (id: number, name: string) =>
    api.put<void>(`/api/car-features/${id}`, { id, name }),

  delete: (id: number) =>
    api.delete<void>(`/api/car-features/${id}`),
}
