import { useState } from 'react'

export function usePagination(defaultPageSize = 20) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const onChange = (newPage: number, newPageSize: number) => {
    setPage(newPage)
    setPageSize(newPageSize)
  }

  const reset = () => setPage(1)

  return { page, pageSize, onChange, reset }
}
