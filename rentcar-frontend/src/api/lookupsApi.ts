import api from './axiosInstance'
import type { LookupItem, RentalAddon } from '@/types/lookups'

export const lookupsApi = {
  getBrands: ()                  => api.get<LookupItem[]>('/api/lookups/brands'),
  getModels: (brandId: number)   => api.get<LookupItem[]>(`/api/lookups/models?brandId=${brandId}`),
  getCategories: ()              => api.get<LookupItem[]>('/api/lookups/categories'),
  getFuelTypes: ()               => api.get<LookupItem[]>('/api/lookups/fuel-types'),
  getCarFeatures: ()             => api.get<LookupItem[]>('/api/lookups/car-features'),
  getRegions: ()                 => api.get<LookupItem[]>('/api/lookups/regions'),
  getCities: (regionId: number)  => api.get<LookupItem[]>(`/api/lookups/cities?regionId=${regionId}`),
  getRentalAddons: ()            => api.get<RentalAddon[]>('/api/lookups/rental-addons'),
}
