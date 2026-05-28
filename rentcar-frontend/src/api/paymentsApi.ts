import api from './axiosInstance'
import type {
  PaymentDto, PendingPaymentDto, CreatePaymentDto,
  InitiatePaymentDto, InitiatePaymentResponse, RefundPaymentDto,
  PaymentHistoryDto, PaymentsFilter,
} from '@/types/payments'
import type { PaginatedResponse } from '@/types/common'

export const paymentsApi = {
  getByRental: (rentalId: number) =>
    api.get<PaymentDto>(`/api/payments/by-rental/${rentalId}`),

  create: (data: CreatePaymentDto) =>
    api.post<{ id: number }>('/api/payments', data),

  // Payme / Click onlayn to'lov: checkout URL olish
  initiate: (data: InitiatePaymentDto) =>
    api.post<InitiatePaymentResponse>('/api/payments/initiate', data),

  // Admin: barcha kutilayotgan to'lovlar
  getPending: () =>
    api.get<PendingPaymentDto[]>('/api/payments/pending'),

  // Admin: pending to'lovni tasdiqlash (status → Paid + rental → Active)
  approve: (paymentId: number) =>
    api.put<void>(`/api/payments/${paymentId}/approve`),

  // Admin/SuperAdmin: to'lovni qaytarish (refund)
  refund: (paymentId: number, data: RefundPaymentDto) =>
    api.post<void>(`/api/payments/${paymentId}/refund`, data),

  // Admin/SuperAdmin: barcha to'lovlar tarixi (paginated)
  getAll: (params?: PaymentsFilter) =>
    api.get<PaginatedResponse<PaymentHistoryDto>>('/api/payments', { params }),
}
