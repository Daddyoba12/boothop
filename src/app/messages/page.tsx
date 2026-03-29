'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  MessageSquare,
  Search,
  Clock
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

type Conversation = {
  match_id: string;
  other_user: {
    id: string;
    full_name: string;
  };
  last_message: {
    message: string;
    created_at: string;
    is_read: boolean;
  };
  delivery_requests: {
    item_name: string;
  };
};

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      // Fetch all matches for current user
      const { data: matches, error: matchesError } = await supabase
        .from('delivery_matches')
        .select(`
          id,
          booter_id,
          hooper_id,
          delivery_requests:request_id (
            item_name
          )
        `)
        .or(`booter_id.eq.${user.id},hooper_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      // For each match, get the last message and other user info
      const conversationsData = await Promise.all(
        matches.map(async (match) => {
          const otherUserId = match.booter_id === user.id ? match.hooper_id : match.booter_id;

          // Get other user profile
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', otherUserId)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('message, created_at, is_read, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            match_id: match.id,
            other_user: otherUser,
            last_message: lastMessage,
            delivery_requests: match.delivery_requests,
          };
        })
      );

      setConversations(conversationsData.filter(c => c.last_message) as unknown as Conversation[]);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">BootHop</span>
            </Link>
            <Link href="/hooper-dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Chat with Booters and Hoopers</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-blue-600 animate-bounce mx-auto mb-4" />
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No conversations yet</p>
            <p className="text-sm text-gray-500">Start a conversation when you match with someone</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {conversations.map((conversation) => (
              <Link
                key={conversation.match_id}
                href={`/messages/${conversation.match_id}`}
                className="block p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {conversation.other_user.full_name.charAt(0)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {conversation.other_user.full_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {conversation.delivery_requests.item_name}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(conversation.last_message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className={`text-sm truncate ${
                      !conversation.last_message.is_read && (conversation.last_message as any).sender_id !== currentUserId
                        ? 'font-semibold text-gray-900'
                        : 'text-gray-600'
                    }`}>
                      {conversation.last_message.message}
                    </p>
                  </div>

                  {!conversation.last_message.is_read && (conversation.last_message as any).sender_id !== currentUserId && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

