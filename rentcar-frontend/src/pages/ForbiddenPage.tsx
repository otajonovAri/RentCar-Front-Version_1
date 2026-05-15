import { Result, Button } from 'antd'
import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="403"
        title="403"
        subTitle="Bu sahifaga kirish huquqingiz yo'q."
        extra={<Link to="/dashboard"><Button type="primary">Dashboardga qaytish</Button></Link>}
      />
    </div>
  )
}
