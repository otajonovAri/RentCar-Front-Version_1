import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input, Button, Typography, Alert, Row, Col, DatePicker, Divider } from 'antd'
import {
  MailOutlined, LockOutlined, UserOutlined, PhoneOutlined,
} from '@ant-design/icons'
import { useGoogleLogin } from '@react-oauth/google'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Dayjs } from 'dayjs'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import type { ApiError, AuthResponseDto } from '@/types/auth'
import { AxiosError } from 'axios'

const { Title, Text } = Typography

const schema = z
  .object({
    firstName:       z.string().min(2, 'Kamida 2 ta belgi'),
    lastName:        z.string().min(2, 'Kamida 2 ta belgi'),
    email:           z.string().email("To'g'ri email kiriting"),
    phoneNumber:     z.string().min(9, "Telefon raqam kiritilishi shart"),
    dateOfBirth:     z.string().min(1, "Tug'ilgan sana kiritilishi shart"),
    password:        z.string().min(6, 'Kamida 6 ta belgi'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Parollar mos emas',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate   = useNavigate()
  const setAuth    = useAuthStore((s) => s.setAuth)
  const isDark     = useThemeStore((s) => s.isDark)

  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [loading,     setLoading]     = useState(false)
  const [gLoading,    setGLoading]    = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '',
      phoneNumber: '+998', dateOfBirth: '',
      password: '', confirmPassword: '',
    },
  })

  const redirectAfterAuth = (data: AuthResponseDto) => {
    setAuth({
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken,
      userId:       data.userId,
      fullName:     data.fullName,
      email:        data.email,
      role:         data.role,
      avatarUrl:    data.avatarUrl ?? null,
    })
    navigate(
      data.role === 'Customer' || data.role === 'Owner' ? '/my-rentals' : '/dashboard',
      { replace: true },
    )
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setServerError(null); setFieldErrors({}); setGLoading(true)
      try {
        const { data } = await authApi.googleLogin(tokenResponse.access_token)
        redirectAfterAuth(data)
      } catch (err) {
        const e = err as AxiosError<ApiError>
        setServerError(
          e.response?.data?.errors?.['detail']?.[0] ??
          e.response?.data?.detail ??
          'Google orqali kirishda xatolik.'
        )
      } finally { setGLoading(false) }
    },
    onError: () => setServerError('Google orqali kirishda xatolik yuz berdi.'),
  })

  const onSubmit = async (v: RegisterForm) => {
    setServerError(null); setFieldErrors({}); setLoading(true)
    try {
      const { data } = await authApi.register({
        firstName:   v.firstName,
        lastName:    v.lastName,
        email:       v.email,
        phoneNumber: v.phoneNumber,
        dateOfBirth: v.dateOfBirth,
        password:    v.password,
      })

      if (!data.emailVerificationRequired && data.accessToken) {
        // Email service ishlamagan holda backend avtomatik login ma'lumotlarini bersa
        redirectAfterAuth({
          accessToken:       data.accessToken,
          refreshToken:      data.refreshToken!,
          userId:            data.userId!,
          fullName:          data.fullName!,
          email:             data.email,
          role:              data.role!,
          accessTokenExpiry: '',
          avatarUrl:         null,
        })
      } else {
        // OTP tasdiqlash sahifasiga yo'naltirish
        const params = new URLSearchParams({ email: data.email })
        if (data.botUsername) params.set('bot', data.botUsername)
        navigate(`/verify-email?${params.toString()}`, { replace: true })
      }
    } catch (err) {
      const e = err as AxiosError<ApiError>
      const d = e.response?.data
      // "detail" kalit xato — uni serverError sifatida ko'rsat
      if (d?.errors?.['detail']) {
        setServerError(d.errors['detail'][0])
      } else if (d?.detail) {
        setServerError(d.detail)
      } else if (d?.errors) {
        setFieldErrors(d.errors)
      } else {
        setServerError("Xatolik yuz berdi. Qayta urinib ko'ring.")
      }
    } finally { setLoading(false) }
  }

  const fe = (key: string, msg?: string) => fieldErrors[key]?.[0] ?? msg

  /* ── Theme ── */
  const pageBg     = isDark
    ? '#0a0a0a'
    : 'linear-gradient(135deg, #f0f4ff 0%, #f5f5f5 100%)'
  const cardBg     = isDark ? '#141414' : '#ffffff'
  const cardShadow = isDark
    ? '0 4px 32px rgba(0,0,0,0.4)'
    : '0 4px 32px rgba(0,0,0,0.08)'
  const titleColor = isDark ? '#ffffff' : '#111111'
  const ic         = { color: '#bbb' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: pageBg, padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 440, background: cardBg,
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

        <Title level={3} style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 20, color: titleColor }}>
          Yangi hisob
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24, fontSize: 13 }}>
          Ro'yxatdan o'ting va darhol foydalaning
        </Text>

        {/* Google tugmasi */}
        <Button
          size="large"
          block
          loading={gLoading}
          onClick={() => googleLogin()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            height: 44, borderRadius: 8,
            border:      isDark ? '1.5px solid #333' : '1.5px solid #e0e0e0',
            background:  isDark ? '#1f1f1f' : '#ffffff',
            fontWeight:  500, fontSize: 14,
            color:       isDark ? '#e0e0e0' : '#333333',
            boxShadow:   isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: 16,
          }}
          icon={
            !gLoading && (
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
            )
          }
        >
          Google bilan ro'yxatdan o'tish
        </Button>

        <Divider style={{ margin: '0 0 16px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>yoki email bilan</Text>
        </Divider>

        {serverError && (
          <Alert
            showIcon closable
            onClose={() => setServerError(null)}
            style={{ marginBottom: 16, borderRadius: 8 }}
            type="error"
            message={serverError}
            description={
              serverError.includes('allaqachon ro\'yxatdan o\'tgan') ? (
                <span>
                  <Link to="/login" style={{ fontWeight: 600 }}>Kirish sahifasiga o'tish →</Link>
                </span>
              ) : null
            }
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Ism / Familya */}
          <Row gutter={10}>
            <Col span={12}>
              <Controller name="firstName" control={control} render={({ field }) => (
                <div>
                  <Input {...field} prefix={<UserOutlined style={ic}/>}
                    placeholder="Ism" size="large"
                    status={fe('FirstName', errors.firstName?.message) ? 'error' : ''}
                    style={{ borderRadius: 8 }} />
                  {fe('FirstName', errors.firstName?.message) && (
                    <Text type="danger" style={{ fontSize: 11, marginTop: 3, display: 'block' }}>
                      {fe('FirstName', errors.firstName?.message)}
                    </Text>
                  )}
                </div>
              )}/>
            </Col>
            <Col span={12}>
              <Controller name="lastName" control={control} render={({ field }) => (
                <div>
                  <Input {...field} prefix={<UserOutlined style={ic}/>}
                    placeholder="Familya" size="large"
                    status={fe('LastName', errors.lastName?.message) ? 'error' : ''}
                    style={{ borderRadius: 8 }} />
                  {fe('LastName', errors.lastName?.message) && (
                    <Text type="danger" style={{ fontSize: 11, marginTop: 3, display: 'block' }}>
                      {fe('LastName', errors.lastName?.message)}
                    </Text>
                  )}
                </div>
              )}/>
            </Col>
          </Row>

          {/* Email */}
          <Controller name="email" control={control} render={({ field }) => (
            <div>
              <Input {...field} prefix={<MailOutlined style={ic}/>}
                placeholder="Email" size="large"
                status={fe('Email', errors.email?.message) ? 'error' : ''}
                style={{ borderRadius: 8 }} />
              {fe('Email', errors.email?.message) && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                  {fe('Email', errors.email?.message)}
                </Text>
              )}
            </div>
          )}/>

          {/* Telefon */}
          <Controller name="phoneNumber" control={control} render={({ field }) => (
            <div>
              <Input {...field} prefix={<PhoneOutlined style={ic}/>}
                placeholder="+998901234567" size="large"
                status={fe('PhoneNumber', errors.phoneNumber?.message) ? 'error' : ''}
                style={{ borderRadius: 8 }} />
              {fe('PhoneNumber', errors.phoneNumber?.message) && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                  {fe('PhoneNumber', errors.phoneNumber?.message)}
                </Text>
              )}
            </div>
          )}/>

          {/* Tug'ilgan sana */}
          <Controller name="dateOfBirth" control={control} render={({ field }) => (
            <div>
              <DatePicker
                style={{ width: '100%', borderRadius: 8 }} size="large"
                format="DD.MM.YYYY" placeholder="Tug'ilgan sana"
                status={fe('DateOfBirth', errors.dateOfBirth?.message) ? 'error' : ''}
                disabledDate={(d: Dayjs) => d && d.isAfter(new Date())}
                onChange={(date: Dayjs | null) =>
                  field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              />
              {fe('DateOfBirth', errors.dateOfBirth?.message) && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                  {fe('DateOfBirth', errors.dateOfBirth?.message)}
                </Text>
              )}
            </div>
          )}/>

          {/* Parol */}
          <Controller name="password" control={control} render={({ field }) => (
            <div>
              <Input.Password {...field} prefix={<LockOutlined style={ic}/>}
                placeholder="Parol (kamida 6 belgi)" size="large"
                status={fe('Password', errors.password?.message) ? 'error' : ''}
                style={{ borderRadius: 8 }} />
              {fe('Password', errors.password?.message) && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                  {fe('Password', errors.password?.message)}
                </Text>
              )}
            </div>
          )}/>

          {/* Tasdiqlash */}
          <Controller name="confirmPassword" control={control} render={({ field }) => (
            <div>
              <Input.Password {...field} prefix={<LockOutlined style={ic}/>}
                placeholder="Parolni tasdiqlash" size="large"
                status={errors.confirmPassword ? 'error' : ''}
                style={{ borderRadius: 8 }} />
              {errors.confirmPassword && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </div>
          )}/>

          <Button type="primary" htmlType="submit" size="large" block loading={loading}
            style={{ borderRadius: 8, fontWeight: 600, marginTop: 6 }}>
            Ro'yxatdan o'tish
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>Hisobingiz bormi? </Text>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 500 }}>Kirish</Link>
        </div>
      </div>
    </div>
  )
}
