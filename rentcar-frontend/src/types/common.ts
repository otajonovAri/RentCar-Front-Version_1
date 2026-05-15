export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface SelectOption {
  id: number
  name: string
}

export interface SelectOptionWithPrice extends SelectOption {
  dailyPrice: number
  description?: string | null
}
