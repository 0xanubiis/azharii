import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Hash, Volume2, Video } from 'lucide-react';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { useToast } from '@/hooks/use-toast';
type ChannelData = {
  id: string;
  name_ar: string;
  type: 'text' | 'voice' | 'video';
  is_official: boolean;
};
type Message = {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  reply_to: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  replied_message?: {
    id: string;
    content: string | null;
    user_id: string;
    profiles: {
      full_name: string;
      username: string;
    };
  } | null;
};
const Channel = () => {
  const {
    channelId
  } = useParams();
  const {
    user,
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    author: string;
  } | null>(null);
  useEffect(() => {
    if (channelId) {
      fetchChannel();
      fetchMessages();
      setupRealtimeSubscription();
    }
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [channelId]);
  const fetchChannel = async () => {
    if (!channelId) return;
    const {
      data
    } = await supabase.from('channels').select('*').eq('id', channelId).single();
    if (data) {
      setChannel(data);
    }
    setLoading(false);
  };
  const fetchMessages = async () => {
    if (!channelId) return;
    const {
      data
    } = await supabase.from('messages').select(`
        *,
        profiles!messages_user_id_fkey (
          full_name,
          username,
          avatar_url
        ),
        replied_message:messages!messages_reply_to_fkey (
          id,
          content,
          user_id,
          profiles!messages_user_id_fkey (
            full_name,
            username
          )
        )
      `).eq('channel_id', channelId).order('created_at', {
      ascending: true
    }).limit(100);
    if (data) {
      setMessages(data as any);
    }
  };
  const setupRealtimeSubscription = () => {
    if (!channelId) return;
    const channel = supabase.channel(`channel-${channelId}`).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `channel_id=eq.${channelId}`
    }, async payload => {
      // Fetch the complete message with profile data
      const {
        data
      } = await supabase.from('messages').select(`
              *,
              profiles!messages_user_id_fkey (
                full_name,
                username,
                avatar_url
              ),
              replied_message:messages!messages_reply_to_fkey (
                id,
                content,
                user_id,
                profiles!messages_user_id_fkey (
                  full_name,
                  username
                )
              )
            `).eq('id', payload.new.id).single();
      if (data) {
        setMessages(prev => [...prev, data as any]);
      }
    }).subscribe();
    setRealtimeChannel(channel);
  };
  const handleSendMessage = async (content: string) => {
    if (!user || !channelId) return;
    const {
      error
    } = await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: user.id,
      content,
      reply_to: replyTo?.id || null
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ في إرسال الرسالة',
        description: error.message
      });
      throw error;
    }
  };
  const getChannelIcon = () => {
    switch (channel?.type) {
      case 'voice':
        return <Volume2 className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <Hash className="h-5 w-5" />;
    }
  };
  const canSendMessage = () => {
    if (!channel) return false;
    if (channel.is_official) {
      // Check if user has admin/moderator/publisher role
      // For now, official channels are read-only for regular users
      return false;
    }
    return true;
  };
  if (loading) {
    return <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>;
  }
  if (!channel) {
    return <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-lg text-muted-foreground">القناة غير موجودة</p>
        </Card>
      </div>;
  }
  return <div className="flex flex-col h-full" dir="rtl">
      {/* Channel Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center gap-3">
          {getChannelIcon()}
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{channel.name_ar}</h2>
            {channel.is_official && <p className="text-xs text-muted-foreground">قناة رسمية - للإدارة فقط</p>}
          </div>
        </div>
      </div>

      {/* Channel Content */}
      {channel.type === 'text' ? <>
          <MessageList messages={messages} onReply={message => setReplyTo({
        id: message.id,
        content: message.content || '',
        author: message.profiles.full_name
      })} className="px-0" />
          <MessageInput onSend={handleSendMessage} disabled={!canSendMessage()} isOfficial={channel.is_official} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
        </> : <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              {getChannelIcon()}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {channel.type === 'voice' ? 'قناة صوتية' : 'قناة فيديو'}
            </h3>
            <p className="text-muted-foreground">
              المكالمات الصوتية والمرئية قيد التطوير...
            </p>
          </div>
        </div>}
    </div>;
};
export default Channel;