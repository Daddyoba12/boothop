'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Send,
  ArrowLeft
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Message } from '@/lib/supabase';

type MessageWithProfile = Message & {
  sender_profile: {
    full_name: string;
  };
};

export default function ChatPage({ params }: { params: { matchId: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    initialize();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`messages:${params.matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${params.matchId}`,
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initialize = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      // Get match details
      const { data: match } = await supabase
        .from('delivery_matches')
        .select('booter_id, hooper_id')
        .eq('id', params.matchId)
        .single();

      if (!match) {
        throw new Error('Match not found');
      }

      // Get other user
      const otherUserId = match.booter_id === user.id ? match.hooper_id : match.booter_id;
      const { data: otherUserData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', otherUserId)
        .single();

      setOtherUser(otherUserData);

      await fetchMessages();

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', params.matchId)
        .eq('receiver_id', user.id);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:sender_id (
          full_name
        )
      `)
      .eq('match_id', params.matchId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as MessageWithProfile[]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUserId || !otherUser) return;

    setSending(true);

    try {
      const { data: match } = await supabase
        .from('delivery_matches')
        .select('booter_id, hooper_id')
        .eq('id', params.matchId)
        .single();

      if (!match) throw new Error('Match not found');

      const receiverId = match.booter_id === currentUserId ? match.hooper_id : match.booter_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: params.matchId,
          sender_id: currentUserId,
          receiver_id: receiverId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      // Update last_message_at in match
      await supabase
        .from('delivery_matches')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', params.matchId);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Package className="h-16 w-16 text-blue-600 animate-bounce" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {otherUser?.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{otherUser?.full_name}</div>
                  <div className="text-sm text-gray-500">Active</div>
                </div>
              </div>
            </div>
            
            <Link
              href={`/matches/${params.matchId}`}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              View Match Details
            </Link>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUserId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${
                      isOwnMessage ? 'order-2' : 'order-1'
                    }`}>
                      {!isOwnMessage && (
                        <div className="text-xs text-gray-500 mb-1">
                          {message.sender_profile.full_name}
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-5 w-5" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
