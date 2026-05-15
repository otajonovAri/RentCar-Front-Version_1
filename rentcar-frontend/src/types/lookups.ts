export interface LookupItem {
  id: number
  name: string
}

export interface RentalAddon {
  id: number
  name: string
  dailyPrice: number
  description: string | null
}
