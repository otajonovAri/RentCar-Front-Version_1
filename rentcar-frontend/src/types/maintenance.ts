export type MaintenanceType = 'Routine' | 'Repair' | 'Emergency' | 'Inspection'
export type MaintenanceStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled'

export interface MaintenanceDto {
  id: number
  carId: number
  carPlate: string
  title: string
  description: string | null
  type: MaintenanceType
  status: MaintenanceStatus
  scheduledDate: string
  completedDate: string | null
  cost: number
  mileageAtService: number
  serviceProvider: string
  notes: string | null
}

export interface CreateMaintenanceDto {
  carId: number
  title: string
  description?: string | null
  type: MaintenanceType
  scheduledDate: string
  cost: number
  mileageAtService: number
  serviceProvider: string
  notes?: string | null
}

export interface MaintenanceFilter {
  carId?: number
  status?: MaintenanceStatus
  type?: MaintenanceType
  page: number
  pageSize: number
}
