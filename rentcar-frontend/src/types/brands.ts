export interface BrandDto {
  id: number
  name: string
  country: string | null
  logoUrl: string | null
  modelsCount: number
  carsCount: number
}

export interface CarModelDto {
  id: number
  name: string
  brandId: number
  brandName: string
  carsCount: number
}

export interface CreateBrandDto {
  name: string
  country?: string | null
  logoUrl?: string | null
}

export interface CreateCarModelDto {
  name: string
  brandId: number
}
