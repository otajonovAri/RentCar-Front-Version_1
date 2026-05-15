import api from './axiosInstance'
import type { PaymentDto, PendingPaymentDto, CreatePaymentDto } from '@/types/payments'

export const paymentsApi = {
  getByRental: (rentalId: number) =>
    api.get<PaymentDto>(`/api/payments/by-rental/${rentalId}`),

  create: (data: CreatePaymentDto) =>
    api.post<{ id: number }>('/api/payments', data),

  // Admin: barcha kutilayotgan to'lovlar
  getPending: () =>
    api.get<PendingPaymentDto[]>('/api/payments/pending'),

  // Admin: pending to'lovni tasdiqlash (status → Paid + rental → Active)
  approve: (paymentId: number) =>
    api.put<void>(`/api/payments/${paymentId}/approve`),
}
