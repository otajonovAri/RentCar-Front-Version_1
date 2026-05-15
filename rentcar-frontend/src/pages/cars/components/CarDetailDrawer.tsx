import { useEffect, useState } from 'react'
import {
  Drawer, Descriptions, Tag, Image, Space, Button, Popconfirm,
  message, Divider, Upload, Spin, theme,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, StarOutlined,
  ShoppingCartOutlined, LoadingOutlined, CalendarOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { carsApi } from '@/api/carsApi'
import { uploadImage } from '@/api/uploadApi'
import type { CarDetailDto, CarImage } from '@/types/cars'
import StatusBadge from '@/components/shared/StatusBadge'
import { useAuthStore } from '@/store/authStore'
import RentalFormModal from '@/pages/rentals/components/RentalFormModal'
import ReservationFormModal from '@/pages/reservations/components/ReservationFormModal'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  carId: number | null
  onClose: () => void
  onSuccess: () => void
}

export default function CarDetailDrawer({ carId, onClose, onSuccess }: Props) {
  const isMobile = useIsMobile()
  const [car, setCar] = useState<CarDetailDto | null>(null)
  const [carImages, setCarImages] = useState<CarImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [rentalModalOpen, setRentalModalOpen]           = useState(false)
  const [reservationModalOpen, setReservationModalOpen] = useState(false)

  const { hasRole, role } = useAuthStore()
  const { token } = theme.useToken()
  const canEdit     = hasRole(['Admin', 'SuperAdmin', 'Manager', 'Owner'])
  const canRent     = role === 'Customer' || role === 'Owner'
  const isAvailable = car?.status === 'Available'

  const reloadCar = async (id: number) => {
    const [carRes, imgsRes] = await Promise.all([
      carsApi.getById(id),
      carsApi.getImages(id).catch(() => ({ data: [] as CarImage[] })),
    ])
    setCar(carRes.data)
    setCarImages(imgsRes.data)
  }

  useEffect(() => {
    if (!carId) { setCar(null); setCarImages([]); return }
    setLoading(true)
    Promise.all([
      carsApi.getById(carId),
      carsApi.getImages(carId).catch(() => ({ data: [] as CarImage[] })),
    ])
      .then(([carRes, imgsRes]) => {
        setCar(carRes.data)
        setCarImages(imgsRes.data)
      })
      .catch(() => message.error("Mashina ma'lumotlarini olishda xatolik"))
      .finally(() => setLoading(false))
  }, [carId])

  // ── Rasm yuklash ─────────────────────────────────────────────────────────────
  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess: done, onError }) => {
    if (!carId) return
    setUploading(true)
    try {
      // 1. Faylni serverga yuklash → URL olish
      const result = await uploadImage(file as File)

      // 2. URL ni mashina rasmlari ro'yxatiga qo'shish
      //    Birinchi yuklangan rasm avtomatik asosiy (isMain) bo'ladi
      await carsApi.addImage(carId, {
        url: result.url,
        isMain: carImages.length === 0,
        displayOrder: carImages.length + 1,
      })

      message.success('Rasm muvaffaqiyatli yuklandi!')
      await reloadCar(carId)
      onSuccess()
      done?.('ok')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rasm yuklashda xatolik'
      message.error(msg)
      onError?.(new Error(msg))
    } finally {
      setUploading(false)
    }
  }

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      message.error('Faqat JPG, PNG, WebP yoki GIF yuklanadi!')
      return Upload.LIST_IGNORE
    }
    if (file.size / 1024 / 1024 >= 5) {
      message.error("Rasm 5 MB dan kichik bo'lishi kerak!")
      return Upload.LIST_IGNORE
    }
    return true
  }

  const handleSetMain = async (imageId: number) => {
    if (!carId) return
    try {
      await carsApi.setMainImage(carId, imageId)
      message.success("Asosiy rasm o'zgartirildi")
      await reloadCar(carId)
      onSuccess()
    } catch {
      message.error("Rasmni o'zgartirishda xatolik")
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!carId) return
    try {
      await carsApi.deleteImage(carId, imageId)
      message.success("Rasm o'chirildi")
      await reloadCar(carId)
      onSuccess()
    } catch {
      message.error("Rasmni o'chirishda xatolik")
    }
  }

  const carLabel = car ? `${car.brand} ${car.model} (${car.year})` : ''
  const features = car?.features ?? []
  const images   = carImages

  return (
    <>
      <Drawer
        title={car ? carLabel : 'Mashina'}
        open={!!carId}
        onClose={onClose}
        width={isMobile ? '100vw' : 620}
        loading={loading}
        extra={
          car && canRent && isAvailable && (
            <Space>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => setReservationModalOpen(true)}
              >
                Bron
              </Button>
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => setRentalModalOpen(true)}
              >
                Ijara
              </Button>
            </Space>
          )
        }
      >
        {car && (
          <>
            {/* Asosiy ma'lumotlar */}
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Davlat raqami">{car.licensePlate}</Descriptions.Item>
              <Descriptions.Item label="Rang">{car.color}</Descriptions.Item>
              <Descriptions.Item label="Kategoriya">{car.category}</Descriptions.Item>
              <Descriptions.Item label="Yoqilg'i">{car.fuelType}</Descriptions.Item>
              <Descriptions.Item label="Transmissiya">{car.transmissionType}</Descriptions.Item>
              <Descriptions.Item label="O'rindiqlar">{car.seatCount} ta</Descriptions.Item>
              <Descriptions.Item label="Probeg">{car.mileage.toLocaleString()} km</Descriptions.Item>
              <Descriptions.Item label="Kunlik narx">
                <span style={{ fontWeight: 600, color: token.colorPrimary }}>
                  {car.dailyRate.toLocaleString()} so'm
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Filial">{car.branchName}</Descriptions.Item>
              <Descriptions.Item label="Holat">
                <StatusBadge status={car.status} />
              </Descriptions.Item>
              {car.description && (
                <Descriptions.Item label="Tavsif" span={2}>{car.description}</Descriptions.Item>
              )}
            </Descriptions>

            {/* Xususiyatlar */}
            {features.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Xususiyatlar</div>
                <Space wrap>
                  {features.map((f) => <Tag key={f} color="blue">{f}</Tag>)}
                </Space>
              </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {/* Rasmlar */}
            <div>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>
                Rasmlar ({images.length})
              </div>

              <Image.PreviewGroup>
                <Space wrap align="start">
                  {images.map((img) => (
                    <div key={img.id} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          border: img.isMain ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}`,
                          borderRadius: 8,
                          overflow: 'hidden',
                          width: 120,
                          height: 90,
                        }}
                      >
                        <Image
                          src={img.url}
                          width={120}
                          height={90}
                          style={{ objectFit: 'cover', display: 'block' }}
                          preview={{ mask: "Ko'rish" }}
                        />
                      </div>
                      {img.isMain && (
                        <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>Asosiy</Tag>
                      )}
                      {canEdit && (
                        <Space style={{ marginTop: 4 }}>
                          {!img.isMain && (
                            <Button
                              size="small"
                              icon={<StarOutlined />}
                              onClick={() => handleSetMain(img.id)}
                              title="Asosiy qilish"
                            />
                          )}
                          <Popconfirm
                            title="Rasmni o'chirishni tasdiqlaysizmi?"
                            onConfirm={() => handleDeleteImage(img.id)}
                            okText="Ha"
                            cancelText="Yo'q"
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      )}
                    </div>
                  ))}

                  {/* Rasm yuklash — faqat admin/manager/owner uchun */}
                  {canEdit && (
                    <Upload
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      showUploadList={false}
                      customRequest={handleUpload}
                      beforeUpload={beforeUpload}
                      disabled={uploading}
                    >
                      <div
                        style={{
                          width: 120,
                          height: 90,
                          border: `1px dashed ${token.colorBorder}`,
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          color: token.colorTextTertiary,
                          fontSize: 12,
                          gap: 4,
                        }}
                      >
                        {uploading
                          ? <Spin indicator={<LoadingOutlined />} />
                          : <>
                              <PlusOutlined style={{ fontSize: 20 }} />
                              <span>Rasm qo'shish</span>
                            </>
                        }
                      </div>
                    </Upload>
                  )}
                </Space>
              </Image.PreviewGroup>
            </div>

            {/* Customer uchun pastki bron + ijara tugmalari */}
            {canRent && isAvailable && (
              <>
                <Divider />
                <Space direction="vertical" style={{ width: '100%' }} size={10}>
                  <Button
                    size="large"
                    block
                    icon={<CalendarOutlined />}
                    onClick={() => setReservationModalOpen(true)}
                  >
                    Bron qilish (Rezervatsiya)
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<ShoppingCartOutlined />}
                    onClick={() => setRentalModalOpen(true)}
                  >
                    Hozir ijaraga olish
                  </Button>
                </Space>
              </>
            )}
          </>
        )}
      </Drawer>

      {/* Ijara modali */}
      {car && (
        <RentalFormModal
          open={rentalModalOpen}
          onClose={() => setRentalModalOpen(false)}
          onSuccess={() => {
            setRentalModalOpen(false)
            onClose()
            onSuccess()
          }}
          prefilledCarId={car.id}
          carLabel={carLabel}
        />
      )}

      {/* Bron (Rezervatsiya) modali */}
      {car && (
        <ReservationFormModal
          open={reservationModalOpen}
          onClose={() => setReservationModalOpen(false)}
          onSuccess={() => {
            setReservationModalOpen(false)
            onClose()
            onSuccess()
          }}
          prefilledCarId={car.id}
          carLabel={carLabel}
        />
      )}
    </>
  )
}
