export type ConversationStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed'

export interface ConversationDto {
  id:               number
  subject:          string
  status:           ConversationStatus
  rentalId:         number | null
  createdByUserId:  number
  createdByName:    string
  createdAt:        string
  resolvedAt:       string | null
  participantCount: number
  messageCount:     number
  lastMessageBody:  string | null
  lastMessageAt:    string | null
  unreadCount:      number
}

export interface MessageDto {
  id:             number
  conversationId: number
  senderId:       number
  senderName:     string
  body:           string
  status:         string
  sentAt:         string
  isEdited:       boolean
  isDeleted:      boolean
}
