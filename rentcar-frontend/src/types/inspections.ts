export type InspectionType = 'PreRental' | 'PostRental' | 'Periodic' | 'Damage'

export interface InspectionDto {
  id: number
  rentalId: number
  type: InspectionType
  inspectedAt: string
  fuelLevelPercent: number
  mileageAtInspection: number
  exteriorCondition: string
  interiorCondition: string
  hasDamage: boolean
  notes: string | null
  inspectedBy: string
}

export interface CreateInspectionDto {
  rentalId: number
  inspectedByUserId: number
  type: InspectionType
  fuelLevelPercent: number
  mileageAtInspection: number
  exteriorCondition: string
  interiorCondition: string
  hasDamage: boolean
  notes?: string | null
}

export interface InspectionsFilter {
  rentalId?: number
  type?: InspectionType
  page: number
  pageSize: number
}
