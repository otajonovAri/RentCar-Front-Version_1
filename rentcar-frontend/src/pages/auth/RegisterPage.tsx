import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input, Button, Typography, Alert, Row, Col, DatePicker } from 'antd'
import {
  MailOutlined, LockOutlined, UserOutlined,
  PhoneOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Dayjs } from 'dayjs'
import { authApi } from '@/api/authApi'
import { useThemeStore } from '@/store/themeStore'
import type { ApiError } from '@/types/auth'
import { AxiosError } from 'axios'

const { Title, Text } = Typography

const schema = z
  .object({
    firstName:       z.string().min(2, 'Kamida 2 ta belgi'),
    lastName:        z.string().min(2, 'Kamida 2 ta belgi'),
    email:           z.string().email("To'g'ri email kiriting"),
    phoneNumber:     z.string().regex(/^\+998\d{9}$/, 'Format: +998901234567'),
    dateOfBirth:     z.string().min(1, "Tug'ilgan sana kiritilishi shart"),
    password:        z
      .string()
      .min(8, 'Kamida 8 ta belgi')
      .regex(/[A-Z]/, 'Kamida 1 ta katta harf')
      .regex(/[0-9]/, 'Kamida 1 ta raqam'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Parollar mos emas',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof schema>

export default function RegisterPage() {
  const isDark      = useThemeStore((s) => s.isDark)
  const navigate    = useNavigate()
  const [serverError, setServerError]       = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]       = useState<Record<string, string[]>>({})
  const [loading,     setLoading]           = useState(false)
  const [registered,  setRegistered]        = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '',
      phoneNumber: '+998', dateOfBirth: '',
      password: '', confirmPassword: '',
    },
  })

  const onSubmit = async (v: RegisterForm) => {
    setServerError(null); setFieldErrors({}); setLoading(true)
    try {
      await authApi.register({
        firstName:   v.firstName,
        lastName:    v.lastName,
        email:       v.email,
        phoneNumber: v.phoneNumber,
        dateOfBirth: v.dateOfBirth,
        password:    v.password,
      })
      setRegistered(v.email)
    } catch (err) {
      const e = err as AxiosError<ApiError>
      const d = e.response?.data
      if (d?.errors) setFieldErrors(d.errors)
      else setServerError(d?.detail ?? "Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally { setLoading(false) }
  }

  const fe = (key: string, msg?: string) => fieldErrors[key]?.[0] ?? msg

  /* ── Theme ── */
  const pageBg     = isDark ? '#0a0a0a' : 'linear-gradient(135deg, #f0f4ff 0%, #f5f5f5 100%)'
  const cardBg     = isDark ? '#141414' : '#ffffff'
  const cardShadow = isDark ? '0 4px 32px rgba(0,0,0,0.4)' : '0 4px 32px rgba(0,0,0,0.08)'
  const titleColor = isDark ? '#ffffff' : '#111111'
  const iconColor  = { color: '#bbb' }

  /* ── Success screen ── */
  if (registered) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: pageBg, padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380, background: cardBg,
          borderRadius: 16, padding: '40px 28px', boxShadow: cardShadow, textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 56, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3} style={{ color: titleColor, marginBottom: 8 }}>
            Muvaffaqiyatli!
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            <strong style={{ color: isDark ? '#fff' : '#333' }}>{registered}</strong> ga
            {' '}tasdiqlash xati yuborildi.
          </Text>
          <Button type="primary" size="large" block style={{ borderRadius: 8, fontWeight: 600 }}
            onClick={() => navigate('/login', { replace: true })}>
            Kirishga o'tish
          </Button>
          <div style={{ marginTop: 16 }}>
            <Link to="/resend-confirmation" style={{ fontSize: 13 }}>
              Xat kelmadimi? Qayta yuborish
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
          Ro'yxatdan o'ting
        </Text>

        {serverError && (
          <Alert message={serverError} type="error" showIcon closable
            onClose={() => setServerError(null)}
            style={{ marginBottom: 16, borderRadius: 8 }} />
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Ism / Familya */}
          <Row gutter={10}>
            <Col span={12}>
              <div>
                <Controller name="firstName" control={control} render={({ field }) => (
                  <Input {...field} prefix={<UserOutlined style={iconColor}/>}
                    placeholder="Ism" size="large"
                    status={fe('FirstName', errors.firstName?.message) ? 'error' : ''}
                    style={{ borderRadius: 8 }} />
                )}/>
                {fe('FirstName', errors.firstName?.message) && (
                  <Text type="danger" style={{ fontSize: 11, marginTop: 3, display: 'block' }}>
                    {fe('FirstName', errors.firstName?.message)}
                  </Text>
                )}
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Controller name="lastName" control={control} render={({ field }) => (
                  <Input {...field} prefix={<UserOutlined style={iconColor}/>}
                    placeholder="Familya" size="large"
                    status={fe('LastName', errors.lastName?.message) ? 'error' : ''}
                    style={{ borderRadius: 8 }} />
                )}/>
                {fe('LastName', errors.lastName?.message) && (
                  <Text type="danger" style={{ fontSize: 11, marginTop: 3, display: 'block' }}>
                    {fe('LastName', errors.lastName?.message)}
                  </Text>
                )}
              </div>
            </Col>
          </Row>

          {/* Email */}
          <div>
            <Controller name="email" control={control} render={({ field }) => (
              <Input {...field} prefix={<MailOutlined style={iconColor}/>}
                placeholder="Email" size="large"
                status={fe('Email', errors.email?.message) ? 'error' : ''}
                style={{ borderRadius: 8 }} />
            )}/>
            {fe('Email', errors.email?.message) && (
              <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                {fe('Email', errors.email?.message)}
              </Text>
            )}
          </div>

          {/* Telefon */}
          <div>
            <Controller name="phoneNumber" control={control} render={({ field }) => (
              <Input {...field} prefix={<PhoneOutlined style={iconColor}/>}
                placeholder="+998901234567" size="large"
                status={fe('PhoneNumber', errors.phoneNumber?.message) ? 'error' : ''}
                style={{ borderRadius: 8 }} />
            )}/>
            {fe('PhoneNumber', errors.phoneNumber?.message) && (
              <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                {fe('PhoneNumber', errors.phoneNumber?.message)}
              </Text>
            )}
          </div>

          {/* Tug'ilgan sana */}
          <div>
            <Controller name="dateOfBirth" control={control} render={({ field }) => (
              <DatePicker
                style={{ width: '100%', borderRadius: 8 }}
                size="large"
                format="DD.MM.YYYY"
                placeholder="Tug'ilgan sana"
                status={fe('DateOfBirth', errors.dateOfBirth?.message) ? 'error' : ''}
                disabledDate={(d: Dayjs) => d && d.isAfter(new Date())}
                onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              />
            )}/>
            {fe('DateOfBirth', errors.dateOfBirth?.message) && (
              <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                {fe('DateOfBirth', errors.dateOfBirth?.message)}
              </Text>
            )}
          </div>

          {/* Parol */}
          <div>
            <Controller name="password" control={control} render={({ field }) => (
              <Input.Password {...field} prefix={<LockOutlined style={iconColor}/>}
                placeholder="Parol (kamida 8 belgi)" size="large"
                status={fe('Password', errors.password?.message) ? 'error' : ''}
                style={{ borderRadius: 8 }} />
            )}/>
            {fe('Password', errors.password?.message) && (
              <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                {fe('Password', errors.password?.message)}
              </Text>
            )}
          </div>

          {/* Parolni tasdiqlash */}
          <div>
            <Controller name="confirmPassword" control={control} render={({ field }) => (
              <Input.Password {...field} prefix={<LockOutlined style={iconColor}/>}
                placeholder="Parolni tasdiqlash" size="large"
                status={errors.confirmPassword ? 'error' : ''}
                style={{ borderRadius: 8 }} />
            )}/>
            {errors.confirmPassword && (
              <Text type="danger" style={{ fontSize: 12, marginTop: 3, display: 'block' }}>
                {errors.confirmPassword.message}
              </Text>
            )}
          </div>

          <Button type="primary" htmlType="submit" size="large" block loading={loading}
            style={{ borderRadius: 8, fontWeight: 600, marginTop: 4 }}>
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
