import axios from 'axios';
import { BASE_URL } from '../../../shared/utils/constants';
import { getLoginDefaults } from '../../../shared/utils/helper';
import type {
  InboxRoom,
  ConversationResponseData,
  ChatMessage,
  SendMessagePayload,
} from '../types';

/**
 * Helper to get the current authentication token
 */
const getAuthToken = (): string => {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('userToken') ||
    ''
  );
};

/**
 * Resolves full media URL for files / images returned by backend
 */
export const formatChatMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${BASE_URL}/${cleanPath}`;
};

/**
 * Fetches the Live Chat Inbox room list
 */
export const fetchLiveChatInbox = async (adminUuid: string): Promise<InboxRoom[]> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const params = new URLSearchParams();
  params.append('platform', platform);
  params.append('language_code', language_code);
  params.append('action_when', 'live_chat_room_list');
  params.append('user_type', 'ADMIN');
  params.append('user_uuid', adminUuid);

  const response = await axios.post<{
    status: boolean;
    message: string;
    data: InboxRoom[];
  }>(`${BASE_URL}/v1/live-chat/inbox`, params.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (response.data && response.data.status) {
    return response.data.data || [];
  }
  throw new Error(response.data?.message || 'Failed to fetch chat inbox');
};

/**
 * Fetches messages for a specific conversation
 */
export const fetchLiveChatConversation = async (
  adminUuid: string,
  receiverType: 'CUSTOMER' | 'DRIVER',
  receiverUuid: string,
  page: number = 1,
  pageSize: number = 50
): Promise<ConversationResponseData> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const params = new URLSearchParams();
  params.append('platform', platform);
  params.append('language_code', language_code);
  params.append('action_when', 'live_chat_message_list');
  params.append('sender_type', 'ADMIN');
  params.append('user1_type', 'ADMIN');
  params.append('user1_uuid', adminUuid);
  params.append('receiver_type', receiverType);
  params.append('user2_type', receiverType);
  params.append('user2_uuid', receiverUuid);
  params.append('page', String(page));
  params.append('page_size', String(pageSize));

  const response = await axios.post<{
    status: boolean;
    message: string;
    data: ConversationResponseData;
  }>(`${BASE_URL}/v1/live-chat/conversation`, params.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data?.message || 'Failed to fetch conversation');
};

/**
 * Sends a live chat message (text, image file, or both)
 */
export const sendLiveChatMessage = async (
  adminUuid: string,
  payload: SendMessagePayload
): Promise<ChatMessage> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const formData = new FormData();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'live_chat_message_send');
  formData.append('sender_type', 'ADMIN');
  formData.append('sender_uuid', adminUuid);
  formData.append('receiver_type', payload.receiver_type);
  formData.append('receiver_uuid', payload.receiver_uuid);

  if (payload.message && payload.message.trim()) {
    formData.append('message', payload.message.trim());
  }

  if (payload.file) {
    formData.append('file', payload.file);
  }

  const response = await axios.post<{
    status: boolean;
    message: string;
    data: ChatMessage;
  }>(`${BASE_URL}/v1/live-chat/send`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data?.message || 'Failed to send message');
};

/**
 * Marks messages in a conversation as read
 */
export const markLiveChatRead = async (
  adminUuid: string,
  receiverType: 'CUSTOMER' | 'DRIVER',
  receiverUuid: string
): Promise<void> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const params = new URLSearchParams();
  params.append('platform', platform);
  params.append('language_code', language_code);
  params.append('action_when', 'live_chat_message_read');
  params.append('user1_type', 'ADMIN');
  params.append('user1_uuid', adminUuid);
  params.append('user2_type', receiverType);
  params.append('user2_uuid', receiverUuid);
  params.append('reader_uuid', adminUuid);

  try {
    await axios.post(`${BASE_URL}/v1/live-chat/read`, params.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  } catch (error) {
    // Non-fatal if marking read encounters an issue
    console.warn('Failed to mark chat as read:', error);
  }
};
