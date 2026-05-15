/**
 * Backend GlobalExceptionMiddleware dan kelgan xato xabarini ajratib oladi.
 *
 * Response format:
 * {
 *   status: 400,
 *   title: "...",
 *   errors: { detail: ["xato matni"] }
 * }
 */
export function getApiError(err: unknown, fallback = 'Xatolik yuz berdi'): string {
  const data = (err as { response?: { data?: Record<string, unknown> } })
    ?.response?.data

  if (!data) return fallback

  // { errors: { detail: ['...'] } }  ← GlobalExceptionMiddleware formati
  const detail0 = (data.errors as { detail?: string[] } | undefined)?.detail?.[0]
  if (detail0) return detail0

  // { detail: '...' }  ← ba'zi qo'lda qaytarilgan formatlar
  if (typeof data.detail === 'string') return data.detail

  // { message: '...' }
  if (typeof data.message === 'string') return data.message

  // { title: '...' }
  if (typeof data.title === 'string') return data.title

  return fallback
}
