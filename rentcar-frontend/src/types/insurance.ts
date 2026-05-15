export interface InsuranceCompanyDto {
  id: number
  name: string
  contactPhone: string
  email: string
  website: string | null
  address: string
}

export interface CreateInsuranceCompanyDto {
  name: string
  contactPhone: string
  email: string
  website?: string | null
  address: string
}

export interface InsurancePolicyDto {
  id: number
  carId: number
  carPlate: string
  insuranceCompanyId: number
  companyName: string
  policyNumber: string
  coverageType: string
  premiumAmount: number
  coverageAmount: number
  startDate: string
  endDate: string
  notes: string | null
  isActive: boolean
}

export interface CreateInsurancePolicyDto {
  carId: number
  insuranceCompanyId: number
  policyNumber: string
  coverageType: string
  premiumAmount: number
  coverageAmount: number
  startDate: string
  endDate: string
  notes?: string | null
}

export interface PoliciesFilter {
  carId?: number
  insuranceCompanyId?: number
  activeOnly?: boolean
}
