import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Alert, Space, DatePicker, Row, Col, Result } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, CarOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Dayjs } from 'dayjs'
import { authApi } from '@/api/authApi'
import type { ApiError } from '@/types/auth'
import { AxiosError } from 'axios'

const { Title, Text } = Typography

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Ism kamida 2 ta belgi'),
    lastName: z.string().min(2, 'Familya kamida 2 ta belgi'),
    email: z.string().email("To'g'ri email kiriting"),
    phoneNumber: z
      .string()
      .regex(/^\+998\d{9}$/, "Telefon formati: +998901234567"),
    dateOfBirth: z.string().min(1, "Tug'ilgan sana kiritilishi shart"),
    password: z
      .string()
      .min(8, 'Parol kamida 8 ta belgi')
      .regex(/[A-Z]/, 'Kamida bitta katta harf')
      .regex(/[0-9]/, 'Kamida bitta raqam'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Parollar mos emas',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '+998',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        dateOfBirth: values.dateOfBirth,
        password: values.password,
      })
      setRegisteredEmail(values.email)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const data = axiosErr.response?.data
      if (data?.errors) {
        setFieldErrors(data.errors)
      } else {
        setServerError(data?.detail ?? 'Xatolik yuz berdi. Qayta urinib ko\'ring.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (registeredEmail) {
    return (
      <div style={styles.wrapper}>
        <Card style={styles.card}>
          <Result
            status="success"
            title="Ro'yxatdan o'tdingiz!"
            subTitle={
              <>
                <Text>
                  <strong>{registeredEmail}</strong> manziliga tasdiqlash xati yuborildi.
                </Text>
                <br />
                <Text type="secondary">Emailingizni oching va havolani bosing.</Text>
              </>
            }
            extra={[
              <Link key="resend" to="/resend-confirmation">
                <Button>Xat kelmadimi? Qayta yuborish</Button>
              </Link>,
              <Link key="login" to="/login">
                <Button type="primary">Kirishga o'tish</Button>
              </Link>,
            ]}
          />
        </Card>
      </div>
    )
  }

  const getFieldError = (backendKey: string, formError?: string) => {
    const beErrors = fieldErrors[backendKey]
    return beErrors?.[0] ?? formError
  }

  return (
    <div style={styles.wrapper}>
      <Card style={styles.card}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={styles.header}>
            <CarOutlined style={styles.logo} />
            <Title level={3} style={{ margin: 0 }}>RentCar</Title>
            <Text type="secondary">Yangi hisob yaratish</Text>
          </div>

          {serverError && <Alert message={serverError} type="error" showIcon />}

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="Ism"
                  validateStatus={getFieldError('FirstName', errors.firstName?.message) ? 'error' : ''}
                  help={getFieldError('FirstName', errors.firstName?.message)}
                >
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} prefix={<UserOutlined />} placeholder="Jasur" size="large" />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Familya"
                  validateStatus={getFieldError('LastName', errors.lastName?.message) ? 'error' : ''}
                  help={getFieldError('LastName', errors.lastName?.message)}
                >
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} prefix={<UserOutlined />} placeholder="Toshmatov" size="large" />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Email"
              validateStatus={getFieldError('Email', errors.email?.message) ? 'error' : ''}
              help={getFieldError('Email', errors.email?.message)}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input {...field} prefix={<MailOutlined />} placeholder="jasur@example.com" size="large" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Telefon"
              validateStatus={getFieldError('PhoneNumber', errors.phoneNumber?.message) ? 'error' : ''}
              help={getFieldError('PhoneNumber', errors.phoneNumber?.message)}
            >
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <Input {...field} prefix={<PhoneOutlined />} placeholder="+998901234567" size="large" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Tug'ilgan sana"
              validateStatus={getFieldError('DateOfBirth', errors.dateOfBirth?.message) ? 'error' : ''}
              help={getFieldError('DateOfBirth', errors.dateOfBirth?.message)}
            >
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: '100%' }}
                    size="large"
                    format="DD.MM.YYYY"
                    placeholder="15.05.1995"
                    disabledDate={(d: Dayjs) => d && d.isAfter(new Date())}
                    onChange={(date: Dayjs | null) => {
                      field.onChange(date ? date.format('YYYY-MM-DD') : '')
                    }}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Parol"
              validateStatus={getFieldError('Password', errors.password?.message) ? 'error' : ''}
              help={getFieldError('Password', errors.password?.message)}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} prefix={<LockOutlined />} placeholder="••••••••" size="large" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Parolni tasdiqlash"
              validateStatus={errors.confirmPassword ? 'error' : ''}
              help={errors.confirmPassword?.message}
            >
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} prefix={<LockOutlined />} placeholder="••••••••" size="large" />
                )}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Ro'yxatdan o'tish
            </Button>
          </Form>

          <div style={styles.footer}>
            <Text type="secondary">Hisobingiz bormi? </Text>
            <Link to="/login">Kirish</Link>
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
    maxWidth: 480,
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
  logo: { fontSize: 40, color: '#1677ff' },
  footer: { textAlign: 'center' as const },
}
