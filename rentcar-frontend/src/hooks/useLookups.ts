import { useState, useEffect } from 'react'
import { lookupsApi } from '@/api/lookupsApi'
import type { LookupItem, RentalAddon } from '@/types/lookups'

// ── Generic fetch hook ────────────────────────────────────────────────────────
function useFetch<T>(fetcher: () => Promise<{ data: T }>, deps: unknown[] = []) {
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((r) => { if (!cancelled) setData(r.data) })
      .catch(() => { if (!cancelled) setError("Ma'lumot yuklanmadi") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

// ── Lookup hooks ──────────────────────────────────────────────────────────────
export function useBrands() {
  const { data, loading, error } = useFetch<LookupItem[]>(
    () => lookupsApi.getBrands(),
  )
  return { brands: data ?? [], loading, error }
}

export function useModels(brandId: number | null) {
  const { data, loading, error } = useFetch<LookupItem[]>(
    () => (brandId ? lookupsApi.getModels(brandId) : Promise.resolve({ data: [] })),
    [brandId],
  )
  return { models: data ?? [], loading, error }
}

export function useCategories() {
  const { data, loading, error } = useFetch<LookupItem[]>(
    () => lookupsApi.getCategories(),
  )
  return { categories: data ?? [], loading, error }
}

export function useFuelTypes() {
  const { data, loading, error } = useFetch<LookupItem[]>(
    () => lookupsApi.getFuelTypes(),
  )
  return { fuelTypes: data ?? [], loading, error }
}

export function useCarFeatures() {
  const { data, loading, error } = useFetch<LookupItem[]>(
    () => lookupsApi.getCarFeatures(),
  )
  return { carFeatures: data ?? [], loading, error }
}

export function useRegions() {
  const { data, loading, error } = useFetch<LookupItem[]>(
    () => lookupsApi.getRegions(),
  )
  return { regions: data ?? [], loading, error }
}

export function useCities(regionId: number | null) {
  const { data, loading, error } = useFetch<LookupItem[]>(
    () => (regionId ? lookupsApi.getCities(regionId) : Promise.resolve({ data: [] })),
    [regionId],
  )
  return { cities: data ?? [], loading, error }
}

export function useRentalAddons() {
  const { data, loading, error } = useFetch<RentalAddon[]>(
    () => lookupsApi.getRentalAddons(),
  )
  return { addons: data ?? [], loading, error }
}
