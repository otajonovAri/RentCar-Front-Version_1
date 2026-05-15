import api from './axiosInstance'
import type { CarListItemDto, CarDetailDto, CarImage, CreateCarDto, UpdateCarDto, AddCarImageDto, CarsFilter } from '@/types/cars'
import type { PaginatedResponse } from '@/types/common'

export const carsApi = {
  getAll: (params: CarsFilter) =>
    api.get<PaginatedResponse<CarListItemDto>>('/api/cars', { params }),

  getById: (id: number) =>
    api.get<CarDetailDto>(`/api/cars/${id}`),

  create: (data: CreateCarDto) =>
    api.post<{ id: number }>('/api/cars', data),

  update: (id: number, data: UpdateCarDto) =>
    api.put<void>(`/api/cars/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/api/cars/${id}`),

  getImages: (id: number) =>
    api.get<CarImage[]>(`/api/cars/${id}/images`),

  addImage: (id: number, data: AddCarImageDto) =>
    api.post<{ id: number }>(`/api/cars/${id}/images`, data),

  setMainImage: (carId: number, imageId: number) =>
    api.patch<void>(`/api/cars/${carId}/images/${imageId}/set-main`),

  deleteImage: (carId: number, imageId: number) =>
    api.delete<void>(`/api/cars/${carId}/images/${imageId}`),
}
