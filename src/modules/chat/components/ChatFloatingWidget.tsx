import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLiveChat } from '../hooks/useLiveChat';
import { ChatInboxList } from './ChatInboxList';
import { ChatConversationView } from './ChatConversationView';
import { NewChatModal } from './NewChatModal';

export const ChatFloatingWidget: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const {
    rooms,
    loadingRooms,
    activeTarget,
    messages,
    loadingMessages,
    sending,
    totalUnreadCount,
    newIncomingMessageId,
    loadRooms,
    loadMessages,
    selectRoom,
    startNewChat,
    closeActiveChat,
    sendMessage,
  } = useLiveChat();

  // If user is currently on the dedicated Live Chat page, hide floating widget to avoid layout clash
  if (location.pathname === '/dashboard/live-chat') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) - Always visible in bottom-right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Live Chat"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none ring-4 ring-white/20"
          >
            <i className="fa fa-commenting text-xl transition-transform group-hover:rotate-6"></i>

            {/* Pulsing glow ring if unread messages */}
            {totalUnreadCount > 0 && (
              <span className="absolute -inset-1 rounded-full bg-blue-500/40 animate-ping pointer-events-none" />
            )}

            {/* Unread Pill Badge */}
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 bg-amber-500 text-slate-950 font-black text-[11px] rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 animate-bounce">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Docked Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[380px] sm:w-[410px] h-[550px] max-h-[calc(100vh-5rem)] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80 bg-slate-900 text-white flex flex-col animate-in slide-in-from-bottom-5 duration-200">
          {/* Top Title Bar */}
          <div className="h-12 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-xs font-bold truncate">Trippy Live Chat</span>
              {totalUnreadCount > 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {totalUnreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* New chat modal trigger */}
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Start new conversation"
              >
                <i className="fa fa-plus text-xs"></i>
              </button>

              {/* Expand to Full Page */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard/live-chat');
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Open in full screen"
              >
                <i className="fa fa-arrows-alt text-xs"></i>
              </button>

              {/* Minimize */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <i className="fa fa-minus text-xs"></i>
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close chat"
              >
                <i className="fa fa-times text-xs"></i>
              </button>
            </div>
          </div>

          {/* Body: Inbox List or Active Conversation */}
          <div className="flex-1 min-h-0 relative">
            {activeTarget ? (
              <ChatConversationView
                target={activeTarget}
                messages={messages}
                loading={loadingMessages}
                sending={sending}
                newIncomingMessageId={newIncomingMessageId}
                onBack={closeActiveChat}
                onSendMessage={sendMessage}
                onRefresh={() => loadMessages(activeTarget, false)}
              />
            ) : (
              <ChatInboxList
                rooms={rooms}
                loading={loadingRooms}
                onSelectRoom={selectRoom}
                onRefresh={() => loadRooms(false)}
                onStartNewChat={() => setIsNewChatOpen(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Manual Target Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onStartChat={(target) => {
          startNewChat(target);
          setIsNewChatOpen(false);
          setIsOpen(true);
        }}
      />
    </>
  );
};

export default ChatFloatingWidget;
