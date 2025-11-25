import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: string;
  content: string | null;
  created_at: string;
  sender_id: string;
  reply_to: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  replied_message?: {
    id: string;
    content: string | null;
    sender_id: string;
    profiles: {
      full_name: string;
      username: string;
    };
  } | null;
};

const DirectMessageChat = () => {
  const { dmChannelId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<{
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    author: string;
  } | null>(null);

  useEffect(() => {
    if (dmChannelId) {
      fetchDMChannel();
      fetchMessages();
      setupRealtimeSubscription();
    }

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [dmChannelId]);

  const fetchDMChannel = async () => {
    if (!dmChannelId || !user) return;

    const { data: channel } = await supabase
      .from('dm_channels')
      .select('user1_id, user2_id')
      .eq('id', dmChannelId)
      .single();

    if (!channel) {
      setLoading(false);
      return;
    }

    const otherUserId = channel.user1_id === user.id ? channel.user2_id : channel.user1_id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', otherUserId)
      .single();

    if (profile) {
      setOtherUser(profile);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!dmChannelId) return;

    const { data } = await supabase
      .from('dm_messages')
      .select(`
        *,
        profiles!dm_messages_sender_id_fkey (
          full_name,
          username,
          avatar_url
        ),
        replied_message:dm_messages!dm_messages_reply_to_fkey (
          id,
          content,
          sender_id,
          profiles!dm_messages_sender_id_fkey (
            full_name,
            username
          )
        )
      `)
      .eq('dm_channel_id', dmChannelId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data as any);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!dmChannelId) return;

    const channel = supabase
      .channel(`dm-${dmChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `dm_channel_id=eq.${dmChannelId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('dm_messages')
            .select(`
              *,
              profiles!dm_messages_sender_id_fkey (
                full_name,
                username,
                avatar_url
              ),
              replied_message:dm_messages!dm_messages_reply_to_fkey (
                id,
                content,
                sender_id,
                profiles!dm_messages_sender_id_fkey (
                  full_name,
                  username
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as any]);
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !dmChannelId) return;

    const { error } = await supabase.from('dm_messages').insert({
      dm_channel_id: dmChannelId,
      sender_id: user.id,
      content,
      reply_to: replyTo?.id || null,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ في إرسال الرسالة',
        description: error.message,
      });
      throw error;
    }

    setReplyTo(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-lg text-muted-foreground">المحادثة غير موجودة</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* DM Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dm')}
            className="lg:hidden"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10">{otherUser.full_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{otherUser.full_name}</h2>
            <p className="text-sm text-muted-foreground">@{otherUser.username}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages.map((msg) => ({
          ...msg,
          user_id: msg.sender_id,
          replied_message: msg.replied_message ? {
            ...msg.replied_message,
            user_id: msg.replied_message.sender_id,
          } : null,
        }))}
        onReply={(message) =>
          setReplyTo({
            id: message.id,
            content: message.content || '',
            author: message.profiles.full_name,
          })
        }
      />

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default DirectMessageChat;
