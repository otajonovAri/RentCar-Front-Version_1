import api from './axiosInstance'
import type {
  InsuranceCompanyDto, CreateInsuranceCompanyDto,
  InsurancePolicyDto, CreateInsurancePolicyDto, PoliciesFilter,
} from '@/types/insurance'

export const insuranceApi = {
  getCompanies: () =>
    api.get<InsuranceCompanyDto[]>('/api/insurance/companies'),

  createCompany: (data: CreateInsuranceCompanyDto) =>
    api.post<{ id: number }>('/api/insurance/companies', data),

  getPolicies: (params?: PoliciesFilter) =>
    api.get<InsurancePolicyDto[]>('/api/insurance/policies', { params }),

  createPolicy: (data: CreateInsurancePolicyDto) =>
    api.post<{ id: number }>('/api/insurance/policies', data),
}
