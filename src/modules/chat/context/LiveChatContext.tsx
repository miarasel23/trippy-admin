import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { AuthContextTrippy } from '../../../shared/hooks/useAuth';
import {
  fetchLiveChatInbox,
  fetchLiveChatConversation,
  sendLiveChatMessage,
  markLiveChatRead,
} from '../services/chatApi';
import {
  fetchCustomerListPaginated,
  type CustomerUserItem,
} from '../../customer/services/customerApi';
import {
  fetchRiderListPaginated,
  type RiderItem,
} from '../../rider/services/riderApi';
import { playIncomingMessageSound } from '../utils/sound';
import type {
  InboxRoom,
  ChatMessage,
  ActiveChatTarget,
  SendMessagePayload,
} from '../types';

export interface LiveChatContextType {
  rooms: InboxRoom[];
  loadingRooms: boolean;
  errorRooms: string | null;
  customers: CustomerUserItem[];
  loadingCustomers: boolean;
  customerPage: number;
  customerLimit: number;
  customerHasMore: boolean;
  onCustomerPageChange: (page: number) => void;
  onCustomerLimitChange: (limit: number) => void;
  drivers: RiderItem[];
  loadingDrivers: boolean;
  driverPage: number;
  driverLimit: number;
  driverHasMore: boolean;
  onDriverPageChange: (page: number) => void;
  onDriverLimitChange: (limit: number) => void;
  chatPage: number;
  chatLimit: number;
  onChatPageChange: (page: number) => void;
  onChatLimitChange: (limit: number) => void;
  activeTarget: ActiveChatTarget | null;
  messages: ChatMessage[];
  loadingMessages: boolean;
  errorMessages: string | null;
  sending: boolean;
  totalUnreadCount: number;
  lastSyncTime: Date | null;
  newIncomingMessageId: string | null;
  loadRooms: (showLoading?: boolean) => Promise<void>;
  loadCustomers: (page?: number, limit?: number, showLoading?: boolean) => Promise<void>;
  loadDrivers: (page?: number, limit?: number, showLoading?: boolean) => Promise<void>;
  loadMessages: (target: ActiveChatTarget, showLoading?: boolean) => Promise<void>;
  selectRoom: (room: InboxRoom) => void;
  selectCustomer: (customer: CustomerUserItem) => void;
  selectDriver: (driver: RiderItem) => void;
  startNewChat: (target: ActiveChatTarget) => void;
  closeActiveChat: () => void;
  sendMessage: (text?: string, file?: File | null) => Promise<boolean>;
  refreshAll: () => void;
  adminUuid: string;
}

export const LiveChatContext = createContext<LiveChatContextType | undefined>(undefined);

export const LiveChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContextTrippy);

  const [rooms, setRooms] = useState<InboxRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  const [errorRooms, setErrorRooms] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);
  const [customerPage, setCustomerPage] = useState<number>(1);
  const [customerLimit, setCustomerLimit] = useState<number>(15);
  const [customerHasMore, setCustomerHasMore] = useState<boolean>(true);

  const [drivers, setDrivers] = useState<RiderItem[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState<boolean>(false);
  const [driverPage, setDriverPage] = useState<number>(1);
  const [driverLimit, setDriverLimit] = useState<number>(15);
  const [driverHasMore, setDriverHasMore] = useState<boolean>(true);

  const [chatPage, setChatPage] = useState<number>(1);
  const [chatLimit, setChatLimit] = useState<number>(15);

  const customerPageRef = useRef<number>(customerPage);
  customerPageRef.current = customerPage;
  const customerLimitRef = useRef<number>(customerLimit);
  customerLimitRef.current = customerLimit;

  const driverPageRef = useRef<number>(driverPage);
  driverPageRef.current = driverPage;
  const driverLimitRef = useRef<number>(driverLimit);
  driverLimitRef.current = driverLimit;

  const [activeTarget, setActiveTarget] = useState<ActiveChatTarget | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [newIncomingMessageId, setNewIncomingMessageId] = useState<string | null>(null);

  const activeTargetRef = useRef<ActiveChatTarget | null>(activeTarget);
  activeTargetRef.current = activeTarget;

  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  const roomsRef = useRef<InboxRoom[]>(rooms);
  roomsRef.current = rooms;

  const isFetchingMessagesRef = useRef<boolean>(false);
  const isFetchingRoomsRef = useRef<boolean>(false);

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
      if (!adminUuid || isFetchingRoomsRef.current) return;

      if (showLoading) setLoadingRooms(true);
      setErrorRooms(null);
      isFetchingRoomsRef.current = true;

      try {
        const incomingRooms = await fetchLiveChatInbox(adminUuid);

        // Check if any new unread message arrived in any room
        const prevRooms = roomsRef.current;
        let hasNewIncomingUnread = false;

        incomingRooms.forEach((newRoom) => {
          const prevRoom = prevRooms.find(
            (p) => p.conversation_uuid === newRoom.conversation_uuid
          );
          const isNotCurrentlyOpen =
            !activeTargetRef.current ||
            (newRoom.driver_uuid &&
              activeTargetRef.current.receiver_uuid !== newRoom.driver_uuid) ||
            (newRoom.customer_uuid &&
              activeTargetRef.current.receiver_uuid !== newRoom.customer_uuid);

          if (
            isNotCurrentlyOpen &&
            newRoom.last_message &&
            !newRoom.last_message.is_read &&
            newRoom.last_message.sender_type !== 'ADMIN'
          ) {
            if (!prevRoom?.last_message || prevRoom.last_message.uuid !== newRoom.last_message.uuid) {
              hasNewIncomingUnread = true;
            }
          }
        });

        if (hasNewIncomingUnread) {
          playIncomingMessageSound();
        }

        setRooms(incomingRooms);
        setLastSyncTime(new Date());
      } catch (err: any) {
        console.error('Failed to load chat inbox:', err);
        setErrorRooms(err.message || 'Failed to load inbox');
      } finally {
        isFetchingRoomsRef.current = false;
        if (showLoading) setLoadingRooms(false);
      }
    },
    [getAdminUuid]
  );

  // Fetch Customers list with pagination
  const loadCustomers = useCallback(
    async (page?: number, limit?: number, showLoading = true) => {
      const targetPage = page ?? customerPageRef.current;
      const targetLimit = limit ?? customerLimitRef.current;

      if (showLoading) setLoadingCustomers(true);
      try {
        const response = await fetchCustomerListPaginated(targetPage, targetLimit);
        const data = response.data || [];
        setCustomers(data);
        setCustomerPage(response.page || targetPage);
        setCustomerLimit(response.limit || targetLimit);
        setCustomerHasMore(data.length >= targetLimit);
      } catch (err: any) {
        console.error('Failed to load customers:', err);
        setCustomers([]);
      } finally {
        if (showLoading) setLoadingCustomers(false);
      }
    },
    []
  );

  // Fetch Drivers list with pagination
  const loadDrivers = useCallback(
    async (page?: number, limit?: number, showLoading = true) => {
      const targetPage = page ?? driverPageRef.current;
      const targetLimit = limit ?? driverLimitRef.current;

      if (showLoading) setLoadingDrivers(true);
      try {
        const response = await fetchRiderListPaginated(targetPage, targetLimit);
        const data = response.data || [];
        setDrivers(data);
        setDriverPage(response.page || targetPage);
        setDriverLimit(response.limit || targetLimit);
        setDriverHasMore(data.length >= targetLimit);
      } catch (err: any) {
        console.error('Failed to load drivers:', err);
        setDrivers([]);
      } finally {
        if (showLoading) setLoadingDrivers(false);
      }
    },
    []
  );

  // Pagination Change Handlers
  const onCustomerPageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1) return;
      setCustomerPage(newPage);
      loadCustomers(newPage, customerLimitRef.current, true);
    },
    [loadCustomers]
  );

  const onCustomerLimitChange = useCallback(
    (newLimit: number) => {
      setCustomerLimit(newLimit);
      setCustomerPage(1);
      loadCustomers(1, newLimit, true);
    },
    [loadCustomers]
  );

  const onDriverPageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1) return;
      setDriverPage(newPage);
      loadDrivers(newPage, driverLimitRef.current, true);
    },
    [loadDrivers]
  );

  const onDriverLimitChange = useCallback(
    (newLimit: number) => {
      setDriverLimit(newLimit);
      setDriverPage(1);
      loadDrivers(1, newLimit, true);
    },
    [loadDrivers]
  );

  const onChatPageChange = useCallback((newPage: number) => {
    if (newPage < 1) return;
    setChatPage(newPage);
  }, []);

  const onChatLimitChange = useCallback((newLimit: number) => {
    setChatLimit(newLimit);
    setChatPage(1);
  }, []);

  // Fetch Messages for active chat
  const loadMessages = useCallback(
    async (target: ActiveChatTarget, showLoading = true) => {
      const adminUuid = getAdminUuid();
      if (!adminUuid || isFetchingMessagesRef.current) return;

      if (showLoading) setLoadingMessages(true);
      setErrorMessages(null);
      isFetchingMessagesRef.current = true;

      try {
        const data = await fetchLiveChatConversation(
          adminUuid,
          target.receiver_type,
          target.receiver_uuid,
          1,
          50
        );

        const newMessagesList = data.messages || [];
        const prevMessagesList = messagesRef.current;

        // Check if there are brand-new messages from the recipient
        const prevIds = new Set(prevMessagesList.map((m) => m.uuid));
        const newIncoming = newMessagesList.filter(
          (m) => !prevIds.has(m.uuid) && m.sender_type !== 'ADMIN'
        );

        if (newIncoming.length > 0 && prevMessagesList.length > 0) {
          playIncomingMessageSound();
          const latestNew = newIncoming[newIncoming.length - 1];
          setNewIncomingMessageId(latestNew.uuid);
          setTimeout(() => setNewIncomingMessageId(null), 4000);
        }

        // Only update state if message count or last message differs to avoid unnecessary re-renders
        const lastOldUuid = prevMessagesList[prevMessagesList.length - 1]?.uuid;
        const lastNewUuid = newMessagesList[newMessagesList.length - 1]?.uuid;

        if (
          prevMessagesList.length !== newMessagesList.length ||
          lastOldUuid !== lastNewUuid ||
          showLoading
        ) {
          setMessages(newMessagesList);
        }

        // Mark as read if any message was unread
        const hasUnreadFromOther = newMessagesList.some(
          (m) => !m.is_read && m.sender_type !== 'ADMIN'
        );
        if (hasUnreadFromOther) {
          markLiveChatRead(adminUuid, target.receiver_type, target.receiver_uuid);
        }

        // Optimistically clear unread count for this room locally
        setRooms((prev) =>
          prev.map((r) => {
            const isMatch =
              (target.receiver_type === 'CUSTOMER' && r.customer_uuid === target.receiver_uuid) ||
              (target.receiver_type === 'DRIVER' && r.driver_uuid === target.receiver_uuid) ||
              (target.conversation_uuid && r.conversation_uuid === target.conversation_uuid);

            if (isMatch) {
              return {
                ...r,
                unread_count: 0,
                last_message: r.last_message ? { ...r.last_message, is_read: true } : null,
              };
            }
            return r;
          })
        );

        setLastSyncTime(new Date());
      } catch (err: any) {
        console.error('Failed to load conversation:', err);
        if (showLoading) {
          setErrorMessages(err.message || 'Failed to load messages');
        }
      } finally {
        isFetchingMessagesRef.current = false;
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
        room.other_user_name || room.driver_name || room.customer_name || 'User';

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
      const existingRoom = roomsRef.current.find((r) => r.customer_uuid === customer.uuid);
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
    [loadMessages]
  );

  // Select a Driver directly
  const selectDriver = useCallback(
    (driver: RiderItem) => {
      const existingRoom = roomsRef.current.find((r) => r.driver_uuid === driver.uuid);
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
    [loadMessages]
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

        // Append message to active message list immediately
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

  // Refresh all data
  const refreshAll = useCallback(() => {
    loadRooms(false);
    loadCustomers(customerPageRef.current, customerLimitRef.current, false);
    loadDrivers(driverPageRef.current, driverLimitRef.current, false);
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
      loadCustomers(1, customerLimitRef.current, true);
      loadDrivers(1, driverLimitRef.current, true);
    }
  }, [getAdminUuid, loadRooms, loadCustomers, loadDrivers]);

  // Real-Time Polling Engine:
  // - When conversation is active: poll conversation every 2 seconds (2000ms)
  // - Poll inbox rooms every 3.5 seconds (3500ms)
  useEffect(() => {
    const adminUuid = getAdminUuid();
    if (!adminUuid) return;

    // 1. High-frequency conversation polling (2000ms)
    const conversationInterval = setInterval(() => {
      const current = activeTargetRef.current;
      if (current && !isFetchingMessagesRef.current) {
        loadMessages(current, false);
      }
    }, 2000);

    // 2. Inbox directory polling (3500ms)
    const inboxInterval = setInterval(() => {
      if (!isFetchingRoomsRef.current) {
        loadRooms(false);
      }
    }, 3500);

    // 3. Instant sync on window focus or tab visibility change
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadRooms(false);
        const current = activeTargetRef.current;
        if (current) {
          loadMessages(current, false);
        }
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      clearInterval(conversationInterval);
      clearInterval(inboxInterval);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [getAdminUuid, loadRooms, loadMessages]);

  const value: LiveChatContextType = {
    rooms,
    loadingRooms,
    errorRooms,
    customers,
    loadingCustomers,
    customerPage,
    customerLimit,
    customerHasMore,
    onCustomerPageChange,
    onCustomerLimitChange,
    drivers,
    loadingDrivers,
    driverPage,
    driverLimit,
    driverHasMore,
    onDriverPageChange,
    onDriverLimitChange,
    chatPage,
    chatLimit,
    onChatPageChange,
    onChatLimitChange,
    activeTarget,
    messages,
    loadingMessages,
    errorMessages,
    sending,
    totalUnreadCount,
    lastSyncTime,
    newIncomingMessageId,
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

  return <LiveChatContext.Provider value={value}>{children}</LiveChatContext.Provider>;
};

export const useLiveChat = (): LiveChatContextType => {
  const context = useContext(LiveChatContext);
  if (!context) {
    throw new Error('useLiveChat must be used within a LiveChatProvider');
  }
  return context;
};

export default LiveChatProvider;
