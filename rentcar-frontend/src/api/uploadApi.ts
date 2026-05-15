import { BASE_URL } from './axiosInstance'

export interface UploadResult {
  url: string
  fileName: string
  size: number
}

/**
 * Rasmni serverga yuklash.
 * POST /api/upload  (multipart/form-data, field: "file")
 * Returns: { url, fileName, size }
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const token = localStorage.getItem('accessToken') ?? ''

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Yuklashda xatolik' }))
    throw new Error(err.message ?? 'Yuklashda xatolik')
  }

  return res.json() as Promise<UploadResult>
}
