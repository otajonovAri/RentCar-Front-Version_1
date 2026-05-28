import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Input, Button, Typography, Alert } from 'antd'
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/authApi'
import { useThemeStore } from '@/store/themeStore'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/auth'

const { Title, Text } = Typography

const schema = z.object({
  newPassword: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lsin"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Parollar bir-biriga mos emas',
  path: ['confirmPassword'],
})
type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const isDark      = useThemeStore((s) => s.isDark)
  const navigate    = useNavigate()
  const [searchParams] = useSearchParams()
  const token       = searchParams.get('token') ?? ''
  const email       = searchParams.get('email') ?? ''

  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (v: FormValues) => {
    if (!token || !email) {
      setError("Havola noto'g'ri yoki muddati o'tgan. Qaytadan so'rov yuboring.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      await authApi.resetPassword({ email, token, newPassword: v.newPassword })
      setDone(true)
    } catch (err) {
      const e = err as AxiosError<ApiError>
      setError(
        e.response?.data?.errors?.['detail']?.[0] ??
        e.response?.data?.detail ??
        "Parolni tiklashda xatolik. Havola eskirgan bo'lishi mumkin."
      )
    } finally {
      setLoading(false)
    }
  }

  const pageBg     = isDark ? '#0a0a0a' : 'linear-gradient(135deg, #f0f4ff 0%, #f5f5f5 100%)'
  const cardBg     = isDark ? '#141414' : '#ffffff'
  const cardShadow = isDark ? '0 4px 32px rgba(0,0,0,0.4)' : '0 4px 32px rgba(0,0,0,0.08)'
  const titleColor = isDark ? '#ffffff' : '#111111'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: pageBg, padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 380, background: cardBg,
        borderRadius: 16, padding: '32px 28px', boxShadow: cardShadow,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#1677ff"/>
            <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="10" r="2" fill="white"/>
          </svg>
          <Title level={4} style={{ margin: 0, color: titleColor }}>RentCar</Title>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 52, color: '#52c41a', marginBottom: 16, display: 'block' }} />
            <Title level={4} style={{ color: titleColor, marginBottom: 8 }}>Parol yangilandi!</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
              Yangi parolingiz bilan tizimga kiring.
            </Text>
            <Button
              type="primary"
              block
              size="large"
              style={{ borderRadius: 8 }}
              onClick={() => navigate('/login', { replace: true })}
            >
              Kirish sahifasiga o'tish
            </Button>
          </div>
        ) : (
          <>
            <Title level={3} style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 20, color: titleColor }}>
              Yangi parol o'rnatish
            </Title>
            {email && (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16, fontSize: 13 }}>
                {email}
              </Text>
            )}

            {(!token || !email) && (
              <Alert
                type="error"
                showIcon
                message="Havola noto'g'ri"
                description={
                  <span>
                    Bu havola noto'g'ri yoki muddati o'tgan.{' '}
                    <Link to="/forgot-password">Qaytadan so'rov yuboring.</Link>
                  </span>
                }
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined style={{ color: '#bbb' }} />}
                      placeholder="Yangi parol"
                      size="large"
                      status={errors.newPassword ? 'error' : ''}
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
                {errors.newPassword && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {errors.newPassword.message}
                  </Text>
                )}
              </div>

              <div>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined style={{ color: '#bbb' }} />}
                      placeholder="Parolni qayta kiriting"
                      size="large"
                      status={errors.confirmPassword ? 'error' : ''}
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
                {errors.confirmPassword && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                disabled={!token || !email}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Parolni yangilash
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ fontSize: 13 }}>
                Kirish sahifasiga qaytish
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
