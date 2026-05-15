export interface PricingTierDto {
  id: number
  name: string
  dailyRate: number
  weeklyRate: number
  monthlyRate: number
  minDays: number
  maxDays: number | null
  validFrom: string
  validTo: string | null
  categoryId: number | null
  categoryName: string | null
  carId: number | null
  carPlate: string | null
}

export interface CreatePricingTierDto {
  name: string
  dailyRate: number
  weeklyRate: number
  monthlyRate: number
  minDays: number
  maxDays?: number | null
  validFrom: string
  validTo?: string | null
  categoryId?: number | null
  carId?: number | null
}
