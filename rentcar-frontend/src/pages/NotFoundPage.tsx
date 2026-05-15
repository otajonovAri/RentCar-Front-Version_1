import { Result, Button } from 'antd'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="404"
        title="404"
        subTitle="Sahifa topilmadi."
        extra={<Link to="/"><Button type="primary">Bosh sahifaga qaytish</Button></Link>}
      />
    </div>
  )
}
