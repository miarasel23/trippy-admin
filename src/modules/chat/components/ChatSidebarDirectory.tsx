import React, { useState, useMemo } from 'react';
import type { InboxRoom, ActiveChatTarget } from '../types';
import type { CustomerUserItem } from '../../customer/services/customerApi';
import type { RiderItem } from '../../rider/services/riderApi';

interface ChatSidebarDirectoryProps {
  rooms: InboxRoom[];
  loadingRooms: boolean;
  customers: CustomerUserItem[];
  loadingCustomers: boolean;
  customerPage?: number;
  customerLimit?: number;
  customerHasMore?: boolean;
  onCustomerPageChange?: (page: number) => void;
  onCustomerLimitChange?: (limit: number) => void;
  drivers: RiderItem[];
  loadingDrivers: boolean;
  driverPage?: number;
  driverLimit?: number;
  driverHasMore?: boolean;
  onDriverPageChange?: (page: number) => void;
  onDriverLimitChange?: (limit: number) => void;
  chatPage?: number;
  chatLimit?: number;
  onChatPageChange?: (page: number) => void;
  onChatLimitChange?: (limit: number) => void;
  activeTarget: ActiveChatTarget | null;
  onSelectRoom: (room: InboxRoom) => void;
  onSelectCustomer: (customer: CustomerUserItem) => void;
  onSelectDriver: (driver: RiderItem) => void;
  onRefreshAll?: () => void;
  onOpenManualModal?: () => void;
}

export const ChatSidebarDirectory: React.FC<ChatSidebarDirectoryProps> = ({
  rooms,
  loadingRooms,
  customers,
  loadingCustomers,
  customerPage = 1,
  customerLimit = 15,
  customerHasMore = true,
  onCustomerPageChange,
  onCustomerLimitChange,
  drivers,
  loadingDrivers,
  driverPage = 1,
  driverLimit = 15,
  driverHasMore = true,
  onDriverPageChange,
  onDriverLimitChange,
  chatPage,
  chatLimit,
  onChatPageChange,
  onChatLimitChange,
  activeTarget,
  onSelectRoom,
  onSelectCustomer,
  onSelectDriver,
  onRefreshAll,
  onOpenManualModal,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'drivers' | 'chats'>('customers');
  const [searchQuery, setSearchQuery] = useState('');

  // Local fallback for chat pagination
  const [localChatPage, setLocalChatPage] = useState(1);
  const [localChatLimit, setLocalChatLimit] = useState(15);

  const currentChatPage = chatPage !== undefined ? chatPage : localChatPage;
  const currentChatLimit = chatLimit !== undefined ? chatLimit : localChatLimit;
  const handleChatPageChange = onChatPageChange || setLocalChatPage;
  const handleChatLimitChange = onChatLimitChange || setLocalChatLimit;

  // Map of unread counts per user UUID from rooms
  const unreadMap = useMemo(() => {
    const map = new Map<string, number>();
    rooms.forEach((r) => {
      const isUnread =
        r.unread_count > 0 ||
        (r.last_message && !r.last_message.is_read && r.last_message.sender_type !== 'ADMIN');
      const count = r.unread_count > 0 ? r.unread_count : isUnread ? 1 : 0;
      if (count > 0) {
        if (r.customer_uuid) map.set(r.customer_uuid, count);
        if (r.driver_uuid) map.set(r.driver_uuid, count);
      }
    });
    return map;
  }, [rooms]);

  // Filter Customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        (c.full_name && c.full_name.toLowerCase().includes(q)) ||
        (c.phone_number && c.phone_number.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.uuid && c.uuid.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Filter Drivers
  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers;
    const q = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        (d.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d.phone_number && d.phone_number.toLowerCase().includes(q)) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.uuid && d.uuid.toLowerCase().includes(q))
    );
  }, [drivers, searchQuery]);

  // Filter Chats
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter((r) => {
      const name = (r.other_user_name || r.driver_name || r.customer_name || '').toLowerCase();
      const msg = (r.last_message?.message || '').toLowerCase();
      return name.includes(q) || msg.includes(q);
    });
  }, [rooms, searchQuery]);

  const chatTotalPages = Math.max(1, Math.ceil(filteredChats.length / currentChatLimit));
  const safeChatPage = Math.min(Math.max(1, currentChatPage), chatTotalPages);

  const paginatedChats = useMemo(() => {
    const start = (safeChatPage - 1) * currentChatLimit;
    return filteredChats.slice(start, start + currentChatLimit);
  }, [filteredChats, safeChatPage, currentChatLimit]);

  const totalUnreadChats = rooms.reduce((acc, r) => {
    const isUnread =
      r.unread_count > 0 ||
      (r.last_message && !r.last_message.is_read && r.last_message.sender_type !== 'ADMIN');
    return acc + (isUnread ? 1 : 0);
  }, 0);

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const isLoading =
    activeTab === 'customers'
      ? loadingCustomers
      : activeTab === 'drivers'
      ? loadingDrivers
      : loadingRooms;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Search & Actions Header */}
      <div className="p-3 border-b border-slate-800 space-y-2.5 bg-slate-950 shrink-0">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh button */}
          {onRefreshAll && (
            <button
              onClick={onRefreshAll}
              title="Refresh all lists"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            >
              <i className={`fa fa-refresh text-xs ${isLoading ? 'fa-spin text-blue-400' : ''}`}></i>
            </button>
          )}

          {/* Manual UUID trigger */}
          {onOpenManualModal && (
            <button
              onClick={onOpenManualModal}
              title="Enter custom UUID"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs border border-slate-800 transition shrink-0"
            >
              <i className="fa fa-plus"></i>
            </button>
          )}
        </div>

        {/* 3 Main Directory Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs">
          {/* Customers Tab */}
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <i className="fa fa-users text-[10px]"></i>
            <span>Customers</span>
            {customers.length > 0 && (
              <span
                className={`text-[9px] px-1 rounded-full font-bold ${
                  activeTab === 'customers' ? 'bg-violet-800 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {customers.length}
              </span>
            )}
          </button>

          {/* Drivers Tab */}
          <button
            onClick={() => setActiveTab('drivers')}
            className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'drivers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <i className="fa fa-car text-[10px]"></i>
            <span>Drivers</span>
            {drivers.length > 0 && (
              <span
                className={`text-[9px] px-1 rounded-full font-bold ${
                  activeTab === 'drivers' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {drivers.length}
              </span>
            )}
          </button>

          {/* Active Chats Tab */}
          <button
            onClick={() => setActiveTab('chats')}
            className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'chats'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <i className="fa fa-comments text-[10px]"></i>
            <span>Chats</span>
            {totalUnreadChats > 0 ? (
              <span className="text-[9px] px-1 bg-amber-400 text-slate-950 rounded-full font-black animate-pulse">
                {totalUnreadChats}
              </span>
            ) : rooms.length > 0 ? (
              <span
                className={`text-[9px] px-1 rounded-full font-bold ${
                  activeTab === 'chats' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {rooms.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Directory List Area - Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900 custom-scrollbar">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <i className="fa fa-circle-o-notch fa-spin text-xl text-blue-500"></i>
            <span className="text-xs">Loading {activeTab}...</span>
          </div>
        )}

        {/* CUSTOMERS LIST */}
        {!isLoading && activeTab === 'customers' && (
          filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4 text-slate-500">
              <i className="fa fa-users text-3xl mb-2 text-slate-700"></i>
              <p className="text-xs font-semibold text-slate-400">No customers found</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {searchQuery ? 'Try a different search term' : 'No customer records available'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isSelected = activeTarget?.receiver_uuid === customer.uuid;
              const displayName = customer.full_name || 'Customer User';
              const unreadCount = unreadMap.get(customer.uuid) || 0;

              return (
                <div
                  key={customer.uuid}
                  onClick={() => onSelectCustomer(customer)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-150 border-l-4 ${
                    isSelected
                      ? 'bg-violet-600/20 border-violet-500 text-white'
                      : unreadCount > 0
                      ? 'bg-amber-950/20 border-amber-400 hover:bg-slate-900'
                      : 'border-transparent hover:bg-slate-900/80 text-slate-300'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-violet-600 text-white'
                          : 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                      }`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center ring-2 ring-slate-950 shadow">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs truncate ${
                          isSelected || unreadCount > 0 ? 'font-bold text-white' : 'font-medium'
                        }`}
                      >
                        {displayName}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
                        CUSTOMER
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      {customer.phone_number && (
                        <span className="truncate">
                          <i className="fa fa-phone text-[9px] mr-1 text-slate-500"></i>
                          {customer.phone_number}
                        </span>
                      )}
                      {customer.email && (
                        <span className="truncate max-w-[120px]">
                          <i className="fa fa-envelope-o text-[9px] mr-1 text-slate-500"></i>
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* DRIVERS LIST */}
        {!isLoading && activeTab === 'drivers' && (
          filteredDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4 text-slate-500">
              <i className="fa fa-car text-3xl mb-2 text-slate-700"></i>
              <p className="text-xs font-semibold text-slate-400">No drivers found</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {searchQuery ? 'Try a different search term' : 'No driver records available'}
              </p>
            </div>
          ) : (
            filteredDrivers.map((driver) => {
              const isSelected = activeTarget?.receiver_uuid === driver.uuid;
              const displayName = driver.full_name || 'Driver User';
              const unreadCount = unreadMap.get(driver.uuid) || 0;

              return (
                <div
                  key={driver.uuid}
                  onClick={() => onSelectDriver(driver)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-150 border-l-4 ${
                    isSelected
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : unreadCount > 0
                      ? 'bg-amber-950/20 border-amber-400 hover:bg-slate-900'
                      : 'border-transparent hover:bg-slate-900/80 text-slate-300'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center ring-2 ring-slate-950 shadow">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Driver Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs truncate ${
                          isSelected || unreadCount > 0 ? 'font-bold text-white' : 'font-medium'
                        }`}
                      >
                        {displayName}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        DRIVER
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      {driver.phone_number && (
                        <span className="truncate">
                          <i className="fa fa-phone text-[9px] mr-1 text-slate-500"></i>
                          {driver.phone_number}
                        </span>
                      )}
                      {driver.email && (
                        <span className="truncate max-w-[120px]">
                          <i className="fa fa-envelope-o text-[9px] mr-1 text-slate-500"></i>
                          {driver.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* ACTIVE CHATS LIST */}
        {!isLoading && activeTab === 'chats' && (
          filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4 text-slate-500">
              <i className="fa fa-comments-o text-3xl mb-2 text-slate-700"></i>
              <p className="text-xs font-semibold text-slate-400">No active conversations</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Select a Customer or Driver above to start chatting
              </p>
            </div>
          ) : (
            paginatedChats.map((room) => {
              const isSelected = activeTarget?.conversation_uuid === room.conversation_uuid;
              const isDriver = !!room.driver_uuid;
              const isCustomer = !isDriver && !!room.customer_uuid;
              const roleLabel = isDriver ? 'DRIVER' : isCustomer ? 'CUSTOMER' : 'USER';
              const displayName =
                room.other_user_name || room.driver_name || room.customer_name || 'User';

              const hasUnread =
                room.unread_count > 0 ||
                (room.last_message &&
                  !room.last_message.is_read &&
                  room.last_message.sender_type !== 'ADMIN');

              return (
                <div
                  key={room.conversation_uuid}
                  onClick={() => onSelectRoom(room)}
                  className={`flex items-start gap-3 p-3 cursor-pointer transition-all duration-150 border-l-4 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : hasUnread
                      ? 'bg-amber-950/25 border-amber-400 hover:bg-slate-900'
                      : 'border-transparent hover:bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                        isDriver
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                      }`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    {hasUnread && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs truncate ${
                          hasUnread || isSelected ? 'font-bold text-white' : 'font-medium'
                        }`}
                      >
                        {displayName}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTime(room.last_message_at || room.last_message?.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p
                        className={`text-[11px] truncate flex-1 ${
                          hasUnread ? 'text-slate-200 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {room.last_message ? (
                          room.last_message.message ? (
                            room.last_message.message
                          ) : room.last_message.file_url ? (
                            <span className="inline-flex items-center gap-1 text-blue-400">
                              <i className="fa fa-picture-o text-[10px]"></i>
                              <span>Photo</span>
                            </span>
                          ) : (
                            'Attachment'
                          )
                        ) : (
                          <span className="text-slate-500 italic">No messages</span>
                        )}
                      </p>

                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase tracking-wider shrink-0 ${
                          isDriver
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        }`}
                      >
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Directory Footer with Pagination Controls */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400 shrink-0 select-none">
        {/* CUSTOMERS PAGINATION CONTROLS */}
        {activeTab === 'customers' && (
          <>
            <div className="flex items-center gap-1.5">
              <select
                value={customerLimit}
                onChange={(e) => onCustomerLimitChange?.(Number(e.target.value))}
                disabled={loadingCustomers}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-md px-1.5 py-0.5 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                title="Customers per page"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-[10px] text-slate-400 font-medium">
                {filteredCustomers.length} cust.
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onCustomerPageChange?.(customerPage - 1)}
                disabled={customerPage <= 1 || loadingCustomers}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-[10px] font-medium transition cursor-pointer"
                title="Previous Page"
              >
                <i className="fa fa-chevron-left text-[8px]"></i>
                <span>Prev</span>
              </button>

              <span className="px-2 py-0.5 rounded-md bg-violet-600/25 border border-violet-500/40 text-violet-300 font-bold text-[10px]">
                P. {customerPage}
              </span>

              <button
                type="button"
                onClick={() => onCustomerPageChange?.(customerPage + 1)}
                disabled={!customerHasMore || customers.length < customerLimit || loadingCustomers}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-[10px] font-medium transition cursor-pointer"
                title="Next Page"
              >
                <span>Next</span>
                <i className="fa fa-chevron-right text-[8px]"></i>
              </button>
            </div>
          </>
        )}

        {/* DRIVERS PAGINATION CONTROLS */}
        {activeTab === 'drivers' && (
          <>
            <div className="flex items-center gap-1.5">
              <select
                value={driverLimit}
                onChange={(e) => onDriverLimitChange?.(Number(e.target.value))}
                disabled={loadingDrivers}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-md px-1.5 py-0.5 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                title="Drivers per page"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-[10px] text-slate-400 font-medium">
                {filteredDrivers.length} driv.
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDriverPageChange?.(driverPage - 1)}
                disabled={driverPage <= 1 || loadingDrivers}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-[10px] font-medium transition cursor-pointer"
                title="Previous Page"
              >
                <i className="fa fa-chevron-left text-[8px]"></i>
                <span>Prev</span>
              </button>

              <span className="px-2 py-0.5 rounded-md bg-emerald-600/25 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                P. {driverPage}
              </span>

              <button
                type="button"
                onClick={() => onDriverPageChange?.(driverPage + 1)}
                disabled={!driverHasMore || drivers.length < driverLimit || loadingDrivers}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-[10px] font-medium transition cursor-pointer"
                title="Next Page"
              >
                <span>Next</span>
                <i className="fa fa-chevron-right text-[8px]"></i>
              </button>
            </div>
          </>
        )}

        {/* ACTIVE CHATS PAGINATION CONTROLS */}
        {activeTab === 'chats' && (
          <>
            <div className="flex items-center gap-1.5">
              <select
                value={currentChatLimit}
                onChange={(e) => handleChatLimitChange(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-md px-1.5 py-0.5 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                title="Chats per page"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-[10px] text-slate-400 font-medium">
                {filteredChats.length} chats
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleChatPageChange(Math.max(1, safeChatPage - 1))}
                disabled={safeChatPage <= 1}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-[10px] font-medium transition cursor-pointer"
                title="Previous Page"
              >
                <i className="fa fa-chevron-left text-[8px]"></i>
                <span>Prev</span>
              </button>

              <span className="px-2 py-0.5 rounded-md bg-blue-600/25 border border-blue-500/40 text-blue-300 font-bold text-[10px]">
                {safeChatPage}/{chatTotalPages}
              </span>

              <button
                type="button"
                onClick={() => handleChatPageChange(Math.min(chatTotalPages, safeChatPage + 1))}
                disabled={safeChatPage >= chatTotalPages}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-[10px] font-medium transition cursor-pointer"
                title="Next Page"
              >
                <span>Next</span>
                <i className="fa fa-chevron-right text-[8px]"></i>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
