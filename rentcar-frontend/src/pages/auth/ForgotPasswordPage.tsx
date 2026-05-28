import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input, Button, Typography, Alert } from 'antd'
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/authApi'
import { useThemeStore } from '@/store/themeStore'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/auth'

const { Title, Text } = Typography

const schema = z.object({
  email: z.string().email("To'g'ri email kiriting"),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const isDark   = useThemeStore((s) => s.isDark)
  const [sent,   setSent]   = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [error,  setError]  = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (v: FormValues) => {
    setError(null)
    setLoading(true)
    try {
      await authApi.forgotPassword({ email: v.email })
      setSentTo(v.email)
      setSent(true)
    } catch (err) {
      const e = err as AxiosError<ApiError>
      setError(
        e.response?.data?.errors?.['detail']?.[0] ??
        e.response?.data?.detail ??
        "So'rov yuborishda xatolik yuz berdi."
      )
    } finally {
      setLoading(false)
    }
  }

  const pageBg   = isDark ? '#0a0a0a' : 'linear-gradient(135deg, #f0f4ff 0%, #f5f5f5 100%)'
  const cardBg   = isDark ? '#141414' : '#ffffff'
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

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 52, color: '#52c41a', marginBottom: 16, display: 'block' }} />
            <Title level={4} style={{ color: titleColor, marginBottom: 8 }}>Email yuborildi!</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, lineHeight: 1.6 }}>
              <strong>{sentTo}</strong> manziliga parolni tiklash havolasi yuborildi.
            </Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 24 }}>
              Agar email kelmasa, spam papkasini tekshiring.
            </Text>
            <Link to="/login">
              <Button type="primary" icon={<ArrowLeftOutlined />} block size="large" style={{ borderRadius: 8 }}>
                Kirish sahifasiga qaytish
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Title level={3} style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 20, color: titleColor }}>
              Parolni tiklash
            </Title>
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24, fontSize: 13 }}>
              Email manzilingizni kiriting — tiklash havolasi yuboramiz
            </Text>

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
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<MailOutlined style={{ color: '#bbb' }} />}
                      placeholder="Email manzilingiz"
                      size="large"
                      status={errors.email ? 'error' : ''}
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
                {errors.email && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    {errors.email.message}
                  </Text>
                )}
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Havolani yuborish
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ fontSize: 13 }}>
                <ArrowLeftOutlined style={{ marginRight: 6 }} />
                Kirish sahifasiga qaytish
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
