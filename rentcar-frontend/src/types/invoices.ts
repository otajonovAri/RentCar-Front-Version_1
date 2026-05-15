export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Overdue' | 'Voided'

export interface InvoiceDto {
  id: number
  invoiceNumber: string
  rentalId: number
  issueDate: string
  dueDate: string
  subTotal: number
  taxAmount: number
  totalAmount: number
  status: InvoiceStatus
  notes: string | null
}

export interface CreateInvoiceDto {
  rentalId: number
  taxPercent: number
  notes?: string | null
}
