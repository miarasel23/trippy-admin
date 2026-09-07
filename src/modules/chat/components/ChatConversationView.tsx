import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ActiveChatTarget } from '../types';
import { formatChatMediaUrl } from '../services/chatApi';

interface ChatConversationViewProps {
  target: ActiveChatTarget;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  onBack?: () => void;
  onSendMessage: (text?: string, file?: File | null) => Promise<boolean>;
  onRefresh?: () => void;
}

export const ChatConversationView: React.FC<ChatConversationViewProps> = ({
  target,
  messages,
  loading,
  sending,
  onBack,
  onSendMessage,
  onRefresh,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (e.g. max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Send
  const handleSend = async () => {
    if ((!inputText.trim() && !selectedFile) || sending) return;

    const textToSend = inputText;
    const fileToSend = selectedFile;

    // Clear inputs immediately for snappy feel
    setInputText('');
    removeSelectedFile();

    const success = await onSendMessage(textToSend, fileToSend);
    if (!success) {
      // Restore if failed
      setInputText(textToSend);
      setSelectedFile(fileToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isDriver = target.receiver_type === 'DRIVER';

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 relative">
      {/* Header */}
      <div className="h-14 px-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Back to inbox"
            >
              <i className="fa fa-arrow-left text-xs"></i>
            </button>
          )}

          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              isDriver
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
            }`}
          >
            {target.receiver_name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                {target.receiver_name}
              </h3>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                  isDriver
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                }`}
              >
                {target.receiver_type}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
              UUID: {target.receiver_uuid}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh messages"
            >
              <i className={`fa fa-refresh text-xs ${loading ? 'fa-spin text-blue-400' : ''}`}></i>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-900/50">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <i className="fa fa-circle-o-notch fa-spin text-xl text-blue-500"></i>
            <span className="text-xs">Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2 text-slate-500">
              <i className="fa fa-comment-o text-xl"></i>
            </div>
            <p className="text-xs font-semibold text-slate-300">No messages yet</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Start conversation with {target.receiver_name} by typing a message below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender_type === 'ADMIN';
            const fullFileUrl = msg.file_url ? formatChatMediaUrl(msg.file_url) : null;
            const isImage =
              msg.file_type?.toLowerCase() === 'file' ||
              msg.file_type?.toLowerCase() === 'image' ||
              (msg.file_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(msg.file_url));

            return (
              <div
                key={msg.uuid}
                className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Name tag for recipient messages */}
                {!isAdmin && (
                  <span className="text-[10px] text-slate-400 font-medium ml-1 mb-0.5">
                    {msg.sender_name || target.receiver_name}
                  </span>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-2.5 shadow-sm space-y-1.5 ${
                    isAdmin
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                  }`}
                >
                  {/* Image attachment */}
                  {fullFileUrl && (
                    <div className="overflow-hidden rounded-xl bg-slate-950/40 max-w-xs">
                      {isImage ? (
                        <img
                          src={fullFileUrl}
                          alt="Attachment"
                          className="w-full max-h-56 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setPreviewModalImg(fullFileUrl)}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              'https://placehold.co/400x300?text=Attachment+Unavailable';
                          }}
                        />
                      ) : (
                        <a
                          href={fullFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 text-xs text-blue-300 underline hover:text-blue-200"
                        >
                          <i className="fa fa-file text-sm"></i>
                          <span>View Attached File</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Text Message */}
                  {msg.message && (
                    <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                      {msg.message}
                    </p>
                  )}

                  {/* Timestamp & Status */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] pt-0.5 ${
                      isAdmin ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isAdmin && (
                      <i
                        className={`fa ${
                          msg.is_read ? 'fa-check-circle text-emerald-300' : 'fa-check'
                        } text-[9px]`}
                        title={msg.is_read ? 'Read' : 'Sent'}
                      ></i>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview Box */}
      {selectedFile && (
        <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt="File preview"
                className="w-10 h-10 object-cover rounded-md border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-slate-800 rounded-md flex items-center justify-center text-slate-400 shrink-0">
                <i className="fa fa-file"></i>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={removeSelectedFile}
            className="p-1 text-slate-400 hover:text-red-400 rounded-full hover:bg-slate-800 transition-colors"
            title="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/95 shrink-0">
        <div className="flex items-center gap-1.5">
          {/* File attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              selectedFile
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Attach image (JPEG, PNG)"
          >
            <i className="fa fa-paperclip text-sm"></i>
          </button>

          {/* Text input */}
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedFile) || sending}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-sm flex items-center justify-center w-9 h-9"
            title="Send Message"
          >
            {sending ? (
              <i className="fa fa-circle-o-notch fa-spin text-xs"></i>
            ) : (
              <i className="fa fa-paper-plane text-xs"></i>
            )}
          </button>
        </div>
      </div>

      {/* Full Image Preview Lightbox Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute -top-10 right-0 text-white text-lg bg-slate-800/80 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            <img
              src={previewModalImg}
              alt="Enlarged preview"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
