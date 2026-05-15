import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Alert, Space, Result } from 'antd'
import { MailOutlined, CarOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/authApi'
import { AxiosError } from 'axios'
import type { ApiError } from '@/types/auth'

const { Title, Text } = Typography

const schema = z.object({
  email: z.string().email("To'g'ri email kiriting"),
})
type FormData = z.infer<typeof schema>

export default function ResendConfirmationPage() {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: FormData) => {
    setServerError(null)
    setLoading(true)
    try {
      await authApi.resendConfirmation({ email: values.email })
      setSentEmail(values.email)
      setSent(true)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      setServerError(axiosErr.response?.data?.detail ?? 'Xatolik yuz berdi.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={styles.wrapper}>
        <Card style={styles.card}>
          <Result
            status="success"
            title="Xat yuborildi!"
            subTitle={
              <Text>
                <strong>{sentEmail}</strong> manziliga tasdiqlash xati qayta yuborildi.
              </Text>
            }
            extra={<Link to="/login"><Button type="primary">Kirish sahifasiga qaytish</Button></Link>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <Card style={styles.card}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={styles.header}>
            <CarOutlined style={styles.logo} />
            <Title level={4} style={{ margin: 0 }}>Tasdiqlash xatini qayta yuborish</Title>
            <Text type="secondary">Email manzilingizni kiriting</Text>
          </div>

          {serverError && <Alert message={serverError} type="error" showIcon />}

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
                  <Input {...field} prefix={<MailOutlined />} placeholder="jasur@example.com" size="large" />
                )}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Xat yuborish
            </Button>
          </Form>

          <div style={styles.footer}>
            <Link to="/login">← Kirishga qaytish</Link>
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
  logo: { fontSize: 36, color: '#1677ff' },
  footer: { textAlign: 'center' as const },
}
