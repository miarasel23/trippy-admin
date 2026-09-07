import React, { useState, useMemo } from 'react';
import type { InboxRoom } from '../types';

interface ChatInboxListProps {
  rooms: InboxRoom[];
  loading: boolean;
  activeRoomUuid?: string;
  onSelectRoom: (room: InboxRoom) => void;
  onRefresh?: () => void;
  onStartNewChat?: () => void;
}

export const ChatInboxList: React.FC<ChatInboxListProps> = ({
  rooms,
  loading,
  activeRoomUuid,
  onSelectRoom,
  onRefresh,
  onStartNewChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'CUSTOMER' | 'DRIVER' | 'unread'>('all');

  // Format date nicely
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

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const isDriver = !!room.driver_uuid;
      const isCustomer = !!room.customer_uuid;
      const otherName = (
        room.other_user_name ||
        room.driver_name ||
        room.customer_name ||
        ''
      ).toLowerCase();
      const lastMsg = (room.last_message?.message || '').toLowerCase();
      const matchesSearch =
        otherName.includes(searchTerm.toLowerCase()) ||
        lastMsg.includes(searchTerm.toLowerCase());

      const isUnread =
        room.unread_count > 0 ||
        (room.last_message &&
          !room.last_message.is_read &&
          room.last_message.sender_type !== 'ADMIN');

      if (!matchesSearch) return false;

      if (filterType === 'CUSTOMER') return isCustomer;
      if (filterType === 'DRIVER') return isDriver;
      if (filterType === 'unread') return isUnread;
      return true;
    });
  }, [rooms, searchTerm, filterType]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Search & Top Action Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2.5 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh inbox"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <i className={`fa fa-refresh text-xs ${loading ? 'fa-spin text-blue-400' : ''}`}></i>
            </button>
          )}

          {onStartNewChat && (
            <button
              onClick={onStartNewChat}
              title="New Chat"
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-xs flex items-center gap-1 px-2.5 font-medium shadow-sm"
            >
              <i className="fa fa-plus text-xs"></i>
              <span>New</span>
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'CUSTOMER', label: 'Customers' },
            { id: 'DRIVER', label: 'Drivers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room List Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
        {loading && rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <i className="fa fa-circle-o-notch fa-spin text-xl text-blue-500"></i>
            <span className="text-xs">Loading conversations...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 px-4 text-center">
            <i className="fa fa-comments-o text-3xl mb-2 text-slate-600"></i>
            <p className="text-xs font-medium text-slate-300">No conversations found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {searchTerm
                ? 'Try a different search term'
                : 'Chat messages will appear here once started'}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isSelected = activeRoomUuid === room.conversation_uuid;
            const isDriver = !!room.driver_uuid;
            const isCustomer = !isDriver && !!room.customer_uuid;
            const roleLabel = isDriver ? 'DRIVER' : isCustomer ? 'CUSTOMER' : 'USER';
            const displayName =
              room.other_user_name ||
              room.driver_name ||
              room.customer_name ||
              'User';

            // Check unread condition: is_read === false or unread_count > 0
            const hasUnread =
              room.unread_count > 0 ||
              (room.last_message &&
                !room.last_message.is_read &&
                room.last_message.sender_type !== 'ADMIN');

            return (
              <div
                key={room.conversation_uuid}
                onClick={() => onSelectRoom(room)}
                className={`relative flex items-start gap-3 p-3 cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? 'bg-blue-600/20 border-l-4 border-blue-500'
                    : hasUnread
                    ? 'bg-blue-950/40 border-l-4 border-amber-400 hover:bg-slate-800/80'
                    : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                }`}
              >
                {/* Avatar with Role Badge */}
                <div className="relative shrink-0 mt-0.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                      isDriver
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                    }`}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  {/* Status dot */}
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                      hasUnread ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-xs truncate ${
                          hasUnread ? 'font-bold text-white' : 'font-medium text-slate-200'
                        }`}
                      >
                        {displayName}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0 ${
                          isDriver
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        }`}
                      >
                        {roleLabel}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] shrink-0 ${
                        hasUnread ? 'text-amber-400 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {formatTime(room.last_message_at || room.last_message?.created_at)}
                    </span>
                  </div>

                  {/* Last Message Snippet */}
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <p
                      className={`text-[11px] truncate flex-1 ${
                        hasUnread
                          ? 'text-slate-200 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {room.last_message ? (
                        room.last_message.message ? (
                          room.last_message.message
                        ) : room.last_message.file_url ? (
                          <span className="inline-flex items-center gap-1 text-blue-400">
                            <i className="fa fa-picture-o text-[10px]"></i>
                            <span>Photo attachment</span>
                          </span>
                        ) : (
                          'No content'
                        )
                      ) : (
                        <span className="text-slate-500 italic">No messages yet</span>
                      )}
                    </p>

                    {/* Unread Pill Badge */}
                    {hasUnread && (
                      <span className="shrink-0 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow">
                        {room.unread_count > 0 ? room.unread_count : 1}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
