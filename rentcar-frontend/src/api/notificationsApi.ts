import api from './axiosInstance'
import type { NotificationDto, NotificationsFilter } from '@/types/notifications'
import type { PaginatedResponse } from '@/types/common'

export const notificationsApi = {
  getAll: (params: NotificationsFilter) =>
    api.get<PaginatedResponse<NotificationDto>>('/api/notifications', { params }),

  markRead: (id: number) =>
    api.patch<void>(`/api/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<void>('/api/notifications/read-all'),
}
