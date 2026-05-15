// ── Region ────────────────────────────────────────────────────────────────────
export interface RegionDto {
  id: number
  name: string
  code: string | null
  citiesCount: number
}

export interface CreateRegionDto {
  name: string
  code?: string | null
}

export interface UpdateRegionDto {
  id: number
  name: string
  code?: string | null
}

export interface RegionsFilter {
  searchTerm?: string
  page: number
  pageSize: number
}

// ── City ──────────────────────────────────────────────────────────────────────
export interface CityDto {
  id: number
  name: string
  regionId: number
  regionName: string
  branchesCount: number
}

export interface CreateCityDto {
  name: string
  regionId: number
}

export interface UpdateCityDto {
  id: number
  name: string
  regionId: number
}

export interface CitiesFilter {
  regionId?: number
  searchTerm?: string
  page: number
  pageSize: number
}
