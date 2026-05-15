import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd'
import { MailOutlined, LockOutlined, CarOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import type { ApiError } from '@/types/auth'
import { AxiosError } from 'axios'

const { Title, Text } = Typography

const loginSchema = z.object({
  email: z.string().email("To'g'ri email kiriting"),
  password: z.string().min(6, 'Parol kamida 6 ta belgi'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginForm) => {
    setServerError(null)
    setLoading(true)
    try {
      const { data } = await authApi.login(values)
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      })
      // Customer va Owner → o'z shaxsiy sahifasiga, admin rollar → boshqaruv panelga
      const destination =
        data.role === 'Customer' || data.role === 'Owner'
          ? '/my-rentals'
          : '/dashboard'
      navigate(destination, { replace: true })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const detail = axiosErr.response?.data?.detail
      const status = axiosErr.response?.status
      if (status === 403) {
        setServerError('Email tasdiqlanmagan. Iltimos emailingizni tasdiqlang.')
      } else {
        setServerError(detail ?? 'Email yoki parol noto\'g\'ri.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <Card style={styles.card}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={styles.header}>
            <CarOutlined style={styles.logo} />
            <Title level={3} style={{ margin: 0 }}>RentCar</Title>
            <Text type="secondary">Boshqaruv tizimiga kirish</Text>
          </div>

          {serverError && (
            <Alert
              message={serverError}
              type="error"
              showIcon
              action={
                serverError.includes('tasdiqlanmagan') ? (
                  <Link to="/resend-confirmation">Qayta yuborish</Link>
                ) : undefined
              }
            />
          )}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined />}
                    placeholder="jasur@example.com"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Parol"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Kirish
            </Button>
          </Form>

          <div style={styles.footer}>
            <Text type="secondary">Hisobingiz yo'qmi? </Text>
            <Link to="/register">Ro'yxatdan o'tish</Link>
          </div>
        </Space>
      </Card>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 40,
    color: '#1677ff',
  },
  footer: {
    textAlign: 'center' as const,
  },
}
