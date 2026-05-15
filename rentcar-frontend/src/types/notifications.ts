export interface NotificationDto {
  id: number
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface NotificationsFilter {
  userId: number
  page: number
  pageSize: number
  unreadOnly?: boolean
}
