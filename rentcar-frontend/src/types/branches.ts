export interface BranchDto {
  id: number
  name: string
  address: string
  phoneNumber: string
  email?: string | null
  cityName: string
  regionName: string
  carCount: number
  latitude?: number | null
  longitude?: number | null
}

export interface CreateBranchDto {
  name: string
  address: string
  phoneNumber: string
  email?: string | null
  cityId: number
  latitude?: number | null
  longitude?: number | null
}

export interface UpdateBranchDto {
  name: string
  address: string
  phoneNumber: string
  email?: string | null
  latitude?: number | null
  longitude?: number | null
}
