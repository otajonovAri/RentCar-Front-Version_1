import { BASE_URL } from './axiosInstance'

export type UploadFolder = 'cars' | 'avatars' | 'licenses' | 'drivers' | 'damages' | 'brands' | 'uploads'

export interface UploadResult {
  url:      string
  publicId: string
  size:     number
}

/**
 * Rasmni serverga yuklash (Cloudinary).
 * POST /api/upload?folder=cars  (multipart/form-data, field: "file")
 * Returns: { url, publicId, size }
 */
export async function uploadImage(
  file:   File,
  folder: UploadFolder = 'uploads',
): Promise<UploadResult> {
  const token = localStorage.getItem('accessToken') ?? ''

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}/api/upload?folder=${folder}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Yuklashda xatolik' }))
    throw new Error(err.message ?? 'Yuklashda xatolik')
  }

  return res.json() as Promise<UploadResult>
}

/**
 * Cloudinary'dan rasmni o'chirish.
 * DELETE /api/upload?publicId=rentcar/cars/abc123
 */
export async function deleteImage(publicId: string): Promise<void> {
  const token = localStorage.getItem('accessToken') ?? ''

  const res = await fetch(
    `${BASE_URL}/api/upload?publicId=${encodeURIComponent(publicId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  )

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ message: "O'chirishda xatolik" }))
    throw new Error(err.message ?? "O'chirishda xatolik")
  }
}
