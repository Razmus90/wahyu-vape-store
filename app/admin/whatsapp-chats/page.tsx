'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { Send, MessageSquare, Clock, User, Search } from 'lucide-react';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export default function WhatsAppChatsPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch chats
  const { data: chatsData, error: chatsSWRError, mutate: mutateChats } = useSWR(
    `/api/whatsapp/chats?search=${debouncedSearch}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  // Fetch messages for selected chat
  const { data: messagesData, error: messagesSWRError, mutate: mutateMessages } = useSWR(
    selectedChat ? `/api/whatsapp/messages/${selectedChat}` : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  const chats = chatsData?.success ? (chatsData.data || []) : [];
  const messages = messagesData?.success ? (messagesData.data || []) : [];
  const chatsError = chatsData?.success === false ? chatsData.error : (chatsSWRError ? String(chatsSWRError) : '');
  const messagesError = messagesData?.success === false ? messagesData.error : (messagesSWRError ? String(messagesSWRError) : '');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !selectedChat) return;
    setSending(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chatId: selectedChat, text: message }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage('');
        mutateMessages();
        mutateChats();
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const selectedChatName = chats.find((c: any) => c.id === selectedChat)?.name || selectedChat;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5" />
            WhatsApp Chats
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        {chatsError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 m-4 rounded-lg">
            {chatsError}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && !chatsError ? (
            <p className="text-gray-500 text-sm text-center py-8">No chats yet</p>
          ) : (
            chats.map((chat: any) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800 transition-colors ${
                  selectedChat === chat.id ? 'bg-gray-800' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-bold text-white' : 'font-medium text-white'}`}>
                          {chat.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{chat.id.replace('@c.us', '').replace('@g.us', '')}</p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-amber-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{chat.lastMessage || 'No messages'}</p>
                  </div>
                  {chat.lastTimestamp && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(chat.lastTimestamp)}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-white font-medium">{selectedChatName}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No messages yet</p>
              ) : (
                messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from_me ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        msg.from_me
                          ? 'bg-amber-500 text-gray-900'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.from_me ? 'text-gray-700' : 'text-gray-400'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-amber-500"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
