import React, { useState } from 'react';
import { useLiveChat } from '../hooks/useLiveChat';
import { ChatSidebarDirectory } from '../components/ChatSidebarDirectory';
import { ChatConversationView } from '../components/ChatConversationView';
import { NewChatModal } from '../components/NewChatModal';

export const LiveChatPage: React.FC = () => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const {
    rooms,
    loadingRooms,
    customers,
    loadingCustomers,
    drivers,
    loadingDrivers,
    activeTarget,
    messages,
    loadingMessages,
    sending,
    totalUnreadCount,
    newIncomingMessageId,
    selectRoom,
    selectCustomer,
    selectDriver,
    startNewChat,
    closeActiveChat,
    sendMessage,
    loadMessages,
    refreshAll,
  } = useLiveChat();

  return (
    <div className="flex flex-col h-[calc(100vh-118px)] min-h-[520px]">
      {/* Top Header Bar - Sleek & Compact */}
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-2 rounded-xl shadow-xs border border-gray-200/80 mb-2.5 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center text-sm font-bold shadow-xs">
            <i className="fa fa-comments"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-gray-900 tracking-tight">Live Chat Management</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Connected"></span>
            </div>
            <p className="text-[10px] text-gray-500">
              Direct real-time communication with Customers and Drivers (Live sync without reload)
            </p>
          </div>
        </div>

        {/* Quick Stats Badges & Actions */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-violet-50 border border-violet-200/80 rounded-lg text-[11px] font-semibold text-violet-700 flex items-center gap-1.5">
            <i className="fa fa-users text-[10px]"></i>
            <span>{customers.length} Customers</span>
          </div>

          <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
            <i className="fa fa-car text-[10px]"></i>
            <span>{drivers.length} Drivers</span>
          </div>

          {totalUnreadCount > 0 && (
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-800 flex items-center gap-1.5 animate-pulse">
              <i className="fa fa-bell text-[10px]"></i>
              <span>{totalUnreadCount} Unread</span>
            </div>
          )}

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa fa-plus text-[9px]"></i>
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen Container - Left Directory ALWAYS visible side-by-side with Right Conversation */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex-1 min-h-0 flex flex-row">
        {/* Left Column: Customer and Driver Directory (ALWAYS VISIBLE) */}
        <div className="w-80 sm:w-88 md:w-96 shrink-0 h-full border-r border-slate-800 flex flex-col bg-slate-950/90 z-10">
          <ChatSidebarDirectory
            rooms={rooms}
            loadingRooms={loadingRooms}
            customers={customers}
            loadingCustomers={loadingCustomers}
            drivers={drivers}
            loadingDrivers={loadingDrivers}
            activeTarget={activeTarget}
            onSelectRoom={selectRoom}
            onSelectCustomer={selectCustomer}
            onSelectDriver={selectDriver}
            onRefreshAll={refreshAll}
            onOpenManualModal={() => setIsManualModalOpen(true)}
          />
        </div>

        {/* Right Column: Conversation History & Chat Input (ALWAYS VISIBLE SIDE-BY-SIDE) */}
        <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-900">
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
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-900/60">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-2xl text-blue-400 mb-3 shadow-xl">
                <i className="fa fa-comments"></i>
              </div>
              <h2 className="text-sm font-bold text-slate-200">Select a Customer or Driver</h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
                Click on any customer or driver from the list on the left to immediately start or view their live conversation.
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-lg text-[11px] font-semibold">
                  <i className="fa fa-user mr-1"></i> Customer Chats
                </span>
                <span className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold">
                  <i className="fa fa-car mr-1"></i> Driver Chats
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual UUID Modal */}
      <NewChatModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onStartChat={(target) => startNewChat(target)}
      />
    </div>
  );
};

export default LiveChatPage;
