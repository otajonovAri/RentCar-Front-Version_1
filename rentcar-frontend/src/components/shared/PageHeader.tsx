import { Typography, Space } from 'antd'

const { Title, Text } = Typography

interface PageHeaderProps {
  title: string
  subtitle?: string
  extra?: React.ReactNode
}

export default function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div style={styles.wrapper}>
      <div>
        <Title level={4} style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 20px)' }}>{title}</Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </div>
      {extra && <Space>{extra}</Space>}
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
}
