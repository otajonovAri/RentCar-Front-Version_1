import api from './axiosInstance'
import type { InvoiceDto, CreateInvoiceDto } from '@/types/invoices'

export const invoicesApi = {
  getByRental: (rentalId: number) =>
    api.get<InvoiceDto>(`/api/invoices/by-rental/${rentalId}`),

  create: (data: CreateInvoiceDto) =>
    api.post<InvoiceDto>('/api/invoices', data),
}
