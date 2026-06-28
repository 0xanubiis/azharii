import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/initials';

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
    profiles: { full_name: string; username: string };
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
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; author: string } | null>(
    null,
  );

  useEffect(() => {
    if (!dmChannelId || !user) return;
    setLoading(true);
    setMessages([]);
    setOtherUser(null);
    fetchDMChannel();
    fetchMessages();
    setupRealtimeSubscription();
    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmChannelId, user?.id]);

  const fetchDMChannel = async () => {
    if (!dmChannelId || !user) return;
    try {
      const { data: channel } = await supabase
        .from('dm_channels')
        .select('user1_id, user2_id')
        .eq('id', dmChannelId)
        .maybeSingle();
      if (!channel) {
        setLoading(false);
        return;
      }
      const otherUserId = channel.user1_id === user.id ? channel.user2_id : channel.user1_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', otherUserId)
        .maybeSingle();
      if (profile) setOtherUser(profile);
    } catch (error) {
      console.error('Error fetching DM channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!dmChannelId) return;
    try {
      const { data } = await supabase
        .from('dm_messages')
        .select(`*, profiles:sender_id ( full_name, username, avatar_url )`)
        .eq('dm_channel_id', dmChannelId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (!data) return;
      const withReplies = await Promise.all(
        data.map(async (msg: any) => {
          if (msg.reply_to) {
            const { data: repliedMsg } = await supabase
              .from('dm_messages')
              .select(`id, content, sender_id, profiles:sender_id ( full_name, username )`)
              .eq('id', msg.reply_to)
              .maybeSingle();
            return { ...msg, replied_message: repliedMsg as any };
          }
          return { ...msg, replied_message: null };
        }),
      );
      setMessages(withReplies as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!dmChannelId) return;
    const ch = supabase
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
            .select(`*, profiles:sender_id ( full_name, username, avatar_url )`)
            .eq('id', payload.new.id)
            .maybeSingle();
          if (!data) return;
          let withReply: any = { ...data, replied_message: null };
          if ((data as any).reply_to) {
            const { data: repliedMsg } = await supabase
              .from('dm_messages')
              .select(`id, content, sender_id, profiles:sender_id ( full_name, username )`)
              .eq('id', (data as any).reply_to)
              .maybeSingle();
            withReply = { ...data, replied_message: repliedMsg as any };
          }
          setMessages((prev) =>
            prev.some((m) => m.id === withReply.id) ? prev : [...prev, withReply as Message],
          );
        },
      )
      .subscribe();
    realtimeRef.current = ch;
  };

  const handleSendMessage = async (content: string, fileUrl?: string, fileType?: string) => {
    if (!user || !dmChannelId) return;
    const { error } = await supabase.from('dm_messages').insert({
      dm_channel_id: dmChannelId,
      sender_id: user.id,
      content: content || null,
      file_url: fileUrl || null,
      file_type: fileType || null,
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
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="p-8 text-center max-w-sm">
          <p className="text-lg font-semibold">المحادثة غير موجودة</p>
          <p className="text-sm text-muted-foreground mt-2">
            ربما تم حذفها أو لا تملك صلاحية الوصول إليها.
          </p>
          <Button className="mt-4" onClick={() => navigate('/dm')}>
            العودة للمحادثات
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm px-3 md:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dm')}
          className="md:hidden"
          aria-label="رجوع"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarFallback className="bg-primary/15 text-primary font-bold">
            {getInitials(otherUser.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold truncate">{otherUser.full_name}</h2>
          <p className="text-[11px] text-muted-foreground truncate">@{otherUser.username}</p>
        </div>
      </div>

      <MessageList
        messages={messages.map((msg) => ({
          ...msg,
          user_id: msg.sender_id,
          replied_message: msg.replied_message
            ? { ...msg.replied_message, user_id: msg.replied_message.sender_id }
            : null,
        }))}
        onReply={(message) =>
          setReplyTo({
            id: message.id,
            content: message.content || '',
            author: message.profiles?.full_name || 'مستخدم',
          })
        }
      />

      <MessageInput
        onSend={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        dmChannelId={dmChannelId}
      />
    </div>
  );
};

export default DirectMessageChat;
