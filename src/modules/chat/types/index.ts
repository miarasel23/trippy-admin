export type UserRoleType = 'ADMIN' | 'CUSTOMER' | 'DRIVER';

export interface ChatMessage {
  uuid: string;
  conversation_uuid: string;
  sender_type: UserRoleType;
  sender_uuid: string;
  sender_name: string;
  message: string | null;
  file_url: string | null;
  file_type: string | null;
  is_read: boolean;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface InboxRoom {
  conversation_uuid: string;
  customer_uuid: string | null;
  customer_name: string | null;
  driver_uuid: string | null;
  driver_name: string | null;
  admin_uuid: string | null;
  admin_name: string | null;
  other_user_name: string | null;
  unread_count: number;
  last_message: ChatMessage | null;
  last_message_at: string | null;
}

export interface ConversationResponseData {
  user1_type: string;
  user1_uuid: string;
  user1_name: string;
  user2_type: string;
  user2_uuid: string;
  user2_name: string;
  total: number;
  page: number;
  page_size: number;
  messages: ChatMessage[];
}

export interface SendMessagePayload {
  receiver_type: 'CUSTOMER' | 'DRIVER';
  receiver_uuid: string;
  message?: string;
  file?: File | null;
}

export interface ActiveChatTarget {
  conversation_uuid?: string;
  receiver_type: 'CUSTOMER' | 'DRIVER';
  receiver_uuid: string;
  receiver_name: string;
  avatar_url?: string | null;
}
