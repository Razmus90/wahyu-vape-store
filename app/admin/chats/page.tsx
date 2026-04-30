'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, User, Bot } from 'lucide-react';
import { ChatSession, ChatMessage } from '@/lib/supabase';

export default function AdminChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  useEffect(() => {
    fetch('/api/admin/chats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSessions(data.data);
          if (data.data.length > 0) {
            setSelectedSession(data.data[0]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Chat History</h1>
        <p className="text-gray-400 text-sm">View customer chat sessions</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
          <div className="bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No chat sessions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
          {/* Session List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-white font-semibold text-sm">Sessions</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-4 border-b border-gray-800/50 transition-colors ${
                    selectedSession?.id === session.id ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {session.customer_name || 'Anonymous'}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {session.customer_email || session.session_token?.slice(0, 12) + '...'}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">{formatDate(session.last_active_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            {selectedSession ? (
              <>
                <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {selectedSession.customer_name || 'Anonymous'}
                    </p>
                    <p className="text-gray-500 text-xs">{selectedSession.customer_email || ''}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedSession.chat_messages?.map((msg: ChatMessage) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-gray-900" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gray-700 text-gray-200 rounded-tr-sm'
                            : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}
                  {(!selectedSession.chat_messages || selectedSession.chat_messages.length === 0) && (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No messages in this session</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Select a session to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
