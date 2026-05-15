import api from './axiosInstance'
import type { ConversationDto, MessageDto } from '@/types/conversations'
import type { PaginatedResponse } from '@/types/common'

export const conversationsApi = {
  // O'z suhbatlarini olish (userId va status bo'yicha filter)
  getAll: (params: { userId?: number; status?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResponse<ConversationDto>>('/api/conversations', { params }),

  // Suhbat xabarlarini olish
  getMessages: (conversationId: number, page = 1, pageSize = 50) =>
    api.get<PaginatedResponse<MessageDto>>(
      `/api/conversations/${conversationId}/messages`,
      { params: { page, pageSize } }
    ),

  // Xabar yuborish
  sendMessage: (conversationId: number, senderId: number, body: string) =>
    api.post<MessageDto>(`/api/conversations/${conversationId}/messages`, {
      senderId,
      body,
    }),

  // O'qilgan deb belgilash
  markRead: (conversationId: number, userId: number) =>
    api.patch(`/api/conversations/${conversationId}/read`, null, {
      params: { userId },
    }),

  // O'qilmagan xabarlar soni (navbar badge)
  getUnreadCount: (userId: number) =>
    api.get<number>('/api/conversations/unread-count', { params: { userId } }),

  // Suhbatni yopish (admin)
  close: (conversationId: number) =>
    api.patch(`/api/conversations/${conversationId}/close`),
}
