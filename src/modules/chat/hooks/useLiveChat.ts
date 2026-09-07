import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AuthContextTrippy } from '../../../shared/hooks/useAuth';
import {
  fetchLiveChatInbox,
  fetchLiveChatConversation,
  sendLiveChatMessage,
  markLiveChatRead,
} from '../services/chatApi';
import { fetchCustomerList, type CustomerUserItem } from '../../customer/services/customerApi';
import { fetchRiderList, type RiderItem } from '../../rider/services/riderApi';
import type {
  InboxRoom,
  ChatMessage,
  ActiveChatTarget,
  SendMessagePayload,
} from '../types';

export const useLiveChat = () => {
  const auth = useContext(AuthContextTrippy);
  const [rooms, setRooms] = useState<InboxRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  const [errorRooms, setErrorRooms] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);

  const [drivers, setDrivers] = useState<RiderItem[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState<boolean>(false);

  const [activeTarget, setActiveTarget] = useState<ActiveChatTarget | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);

  const activeTargetRef = useRef<ActiveChatTarget | null>(activeTarget);
  activeTargetRef.current = activeTarget;

  // Retrieve admin UUID safely
  const getAdminUuid = useCallback((): string => {
    if (auth?.user?.uuid) return auth.user.uuid;
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed?.uuid) return parsed.uuid;
      }
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed?.uuid) return parsed.uuid;
      }
    } catch (e) {
      console.error('Error parsing stored user data for admin UUID:', e);
    }
    return '';
  }, [auth?.user]);

  // Fetch Inbox Rooms
  const loadRooms = useCallback(
    async (showLoading = true) => {
      const adminUuid = getAdminUuid();
      if (!adminUuid) return;

      if (showLoading) setLoadingRooms(true);
      setErrorRooms(null);
      try {
        const data = await fetchLiveChatInbox(adminUuid);
        setRooms(data);
      } catch (err: any) {
        console.error('Failed to load chat inbox:', err);
        setErrorRooms(err.message || 'Failed to load inbox');
      } finally {
        if (showLoading) setLoadingRooms(false);
      }
    },
    [getAdminUuid]
  );

  // Fetch Customers
  const loadCustomers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingCustomers(true);
    try {
      const data = await fetchCustomerList();
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    } finally {
      if (showLoading) setLoadingCustomers(false);
    }
  }, []);

  // Fetch Drivers
  const loadDrivers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingDrivers(true);
    try {
      const data = await fetchRiderList();
      setDrivers(data || []);
    } catch (err: any) {
      console.error('Failed to load drivers:', err);
    } finally {
      if (showLoading) setLoadingDrivers(false);
    }
  }, []);

  // Fetch Messages for active chat
  const loadMessages = useCallback(
    async (target: ActiveChatTarget, showLoading = true) => {
      const adminUuid = getAdminUuid();
      if (!adminUuid) return;

      if (showLoading) setLoadingMessages(true);
      setErrorMessages(null);
      try {
        const data = await fetchLiveChatConversation(
          adminUuid,
          target.receiver_type,
          target.receiver_uuid,
          1,
          50
        );
        setMessages(data.messages || []);

        // Also mark as read
        markLiveChatRead(adminUuid, target.receiver_type, target.receiver_uuid);

        // Optimistically clear unread count for this room locally
        setRooms((prev) =>
          prev.map((r) => {
            const isMatch =
              (target.receiver_type === 'CUSTOMER' &&
                r.customer_uuid === target.receiver_uuid) ||
              (target.receiver_type === 'DRIVER' &&
                r.driver_uuid === target.receiver_uuid) ||
              (target.conversation_uuid &&
                r.conversation_uuid === target.conversation_uuid);

            if (isMatch) {
              return {
                ...r,
                unread_count: 0,
                last_message: r.last_message
                  ? { ...r.last_message, is_read: true }
                  : null,
              };
            }
            return r;
          })
        );
      } catch (err: any) {
        console.error('Failed to load conversation:', err);
        setErrorMessages(err.message || 'Failed to load messages');
      } finally {
        if (showLoading) setLoadingMessages(false);
      }
    },
    [getAdminUuid]
  );

  // Select a room from the inbox
  const selectRoom = useCallback(
    (room: InboxRoom) => {
      const receiverType = room.driver_uuid ? 'DRIVER' : 'CUSTOMER';
      const receiverUuid = (room.driver_uuid || room.customer_uuid || '') as string;
      const receiverName =
        room.other_user_name ||
        room.driver_name ||
        room.customer_name ||
        'User';

      const target: ActiveChatTarget = {
        conversation_uuid: room.conversation_uuid,
        receiver_type: receiverType,
        receiver_uuid: receiverUuid,
        receiver_name: receiverName,
      };

      setActiveTarget(target);
      loadMessages(target, true);
    },
    [loadMessages]
  );

  // Select a Customer directly
  const selectCustomer = useCallback(
    (customer: CustomerUserItem) => {
      // Check if existing room matches
      const existingRoom = rooms.find((r) => r.customer_uuid === customer.uuid);
      const target: ActiveChatTarget = {
        conversation_uuid: existingRoom?.conversation_uuid,
        receiver_type: 'CUSTOMER',
        receiver_uuid: customer.uuid,
        receiver_name: customer.full_name || 'Customer User',
        avatar_url: customer.profile_picture,
      };
      setActiveTarget(target);
      loadMessages(target, true);
    },
    [rooms, loadMessages]
  );

  // Select a Driver directly
  const selectDriver = useCallback(
    (driver: RiderItem) => {
      // Check if existing room matches
      const existingRoom = rooms.find((r) => r.driver_uuid === driver.uuid);
      const target: ActiveChatTarget = {
        conversation_uuid: existingRoom?.conversation_uuid,
        receiver_type: 'DRIVER',
        receiver_uuid: driver.uuid,
        receiver_name: driver.full_name || 'Driver User',
        avatar_url: driver.profile_picture,
      };
      setActiveTarget(target);
      loadMessages(target, true);
    },
    [rooms, loadMessages]
  );

  // Start new chat with target
  const startNewChat = useCallback(
    (target: ActiveChatTarget) => {
      setActiveTarget(target);
      loadMessages(target, true);
    },
    [loadMessages]
  );

  // Close active chat
  const closeActiveChat = useCallback(() => {
    setActiveTarget(null);
    setMessages([]);
    loadRooms(false);
  }, [loadRooms]);

  // Send a message
  const sendMessage = useCallback(
    async (text?: string, file?: File | null): Promise<boolean> => {
      const adminUuid = getAdminUuid();
      const currentTarget = activeTargetRef.current;
      if (!adminUuid || !currentTarget) return false;

      setSending(true);
      try {
        const payload: SendMessagePayload = {
          receiver_type: currentTarget.receiver_type,
          receiver_uuid: currentTarget.receiver_uuid,
          message: text,
          file: file,
        };

        const newMsg = await sendLiveChatMessage(adminUuid, payload);

        // Append message to active message list
        setMessages((prev) => [...prev, newMsg]);

        // Refresh inbox in background
        loadRooms(false);
        return true;
      } catch (err: any) {
        console.error('Failed to send message:', err);
        alert(err.message || 'Failed to send message');
        return false;
      } finally {
        setSending(false);
      }
    },
    [getAdminUuid, loadRooms]
  );

  // Refresh all
  const refreshAll = useCallback(() => {
    loadRooms(false);
    loadCustomers(false);
    loadDrivers(false);
    if (activeTargetRef.current) {
      loadMessages(activeTargetRef.current, false);
    }
  }, [loadRooms, loadCustomers, loadDrivers, loadMessages]);

  // Calculate total unread count across all rooms
  const totalUnreadCount = rooms.reduce((acc, room) => {
    const unread = room.unread_count || 0;
    const hasUnreadLastMessage =
      room.last_message &&
      !room.last_message.is_read &&
      room.last_message.sender_type !== 'ADMIN';
    return acc + (unread > 0 ? unread : hasUnreadLastMessage ? 1 : 0);
  }, 0);

  // Initial load
  useEffect(() => {
    const adminUuid = getAdminUuid();
    if (adminUuid) {
      loadRooms(true);
      loadCustomers(true);
      loadDrivers(true);
    }
  }, [getAdminUuid, loadRooms, loadCustomers, loadDrivers]);

  // Periodic polling for inbox (every 8s) and active conversation (every 4s)
  useEffect(() => {
    const adminUuid = getAdminUuid();
    if (!adminUuid) return;

    const interval = setInterval(() => {
      loadRooms(false);
      if (activeTargetRef.current) {
        loadMessages(activeTargetRef.current, false);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [getAdminUuid, loadRooms, loadMessages]);

  return {
    rooms,
    loadingRooms,
    errorRooms,
    customers,
    loadingCustomers,
    drivers,
    loadingDrivers,
    activeTarget,
    messages,
    loadingMessages,
    errorMessages,
    sending,
    totalUnreadCount,
    loadRooms,
    loadCustomers,
    loadDrivers,
    loadMessages,
    selectRoom,
    selectCustomer,
    selectDriver,
    startNewChat,
    closeActiveChat,
    sendMessage,
    refreshAll,
    adminUuid: getAdminUuid(),
  };
};
