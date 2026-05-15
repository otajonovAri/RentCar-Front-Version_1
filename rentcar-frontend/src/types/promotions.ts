export type DiscountType = 'Percentage' | 'FixedAmount'

export interface PromotionDto {
  id: number
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  minRentalAmount: number
  validFrom: string
  validTo: string
  maxUses: number
  usedCount: number
  isActive: boolean
}

export interface CreatePromotionDto {
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  minRentalAmount: number
  validFrom: string
  validTo: string
  maxUses: number
  isActive?: boolean
}
