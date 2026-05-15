export type DamageStatus = 'Reported' | 'UnderReview' | 'Repaired' | 'Closed'

export interface DamageReportDto {
  id: number
  inspectionId: number
  description: string
  estimatedRepairCost: number
  actualRepairCost: number | null
  status: DamageStatus
  photoUrls: string
  repairedDate: string | null
  notes: string | null
  reportedByName: string
  createdAt: string
}

export interface CreateDamageReportDto {
  inspectionId: number
  reportedByUserId: number
  description: string
  estimatedRepairCost: number
  photoUrls?: string
  notes?: string | null
}

export interface UpdateDamageReportDto {
  status: DamageStatus
  actualRepairCost?: number | null
  notes?: string | null
}

export interface DamageReportsFilter {
  inspectionId?: number
  status?: DamageStatus
  page: number
  pageSize: number
}
