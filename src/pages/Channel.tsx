import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card } from '@/components/ui/card';
import { Hash, Volume2, Video, Loader2, ShieldAlert } from 'lucide-react';
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
    profiles: { full_name: string; username: string };
  } | null;
};

const Channel = () => {
  const { channelId } = useParams();
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  const { toast } = useToast();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; author: string } | null>(
    null,
  );

  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    setMessages([]);
    setChannel(null);
    fetchChannel();
    fetchMessages();
    setupRealtimeSubscription();
    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const fetchChannel = async () => {
    if (!channelId) return;
    const { data } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .maybeSingle();
    if (data) setChannel(data as ChannelData);
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!channelId) return;
    const { data } = await supabase
      .from('messages')
      .select(
        `*, profiles!messages_user_id_fkey ( full_name, username, avatar_url )`,
      )
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (!data) return;
    const withReplies = await Promise.all(
      data.map(async (msg: any) => {
        if (msg.reply_to) {
          const { data: repliedMsg } = await supabase
            .from('messages')
            .select(
              `id, content, user_id, profiles!messages_user_id_fkey ( full_name, username )`,
            )
            .eq('id', msg.reply_to)
            .maybeSingle();
          return { ...msg, replied_message: repliedMsg };
        }
        return { ...msg, replied_message: null };
      }),
    );
    setMessages(withReplies as Message[]);
  };

  const setupRealtimeSubscription = () => {
    if (!channelId) return;
    const ch = supabase
      .channel(`channel-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(`*, profiles!messages_user_id_fkey ( full_name, username, avatar_url )`)
            .eq('id', payload.new.id)
            .maybeSingle();
          if (!data) return;
          let withReply: any = { ...data, replied_message: null };
          if ((data as any).reply_to) {
            const { data: repliedMsg } = await supabase
              .from('messages')
              .select(
                `id, content, user_id, profiles!messages_user_id_fkey ( full_name, username )`,
              )
              .eq('id', (data as any).reply_to)
              .maybeSingle();
            withReply = { ...data, replied_message: repliedMsg };
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
    if (!user || !channelId) return;
    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: user.id,
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

  const channelIcon =
    channel?.type === 'voice' ? (
      <Volume2 className="h-5 w-5 text-muted-foreground" />
    ) : channel?.type === 'video' ? (
      <Video className="h-5 w-5 text-muted-foreground" />
    ) : (
      <Hash className="h-5 w-5 text-muted-foreground" />
    );

  const canSendMessage = () => {
    if (!channel) return false;
    if (channel.is_official) return hasRole('admin') || hasRole('publisher');
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }
  if (!channel) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="p-8 text-center max-w-sm">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-semibold">القناة غير موجودة</p>
          <p className="text-sm text-muted-foreground mt-2">
            ربما تم حذفها أو ليس لديك صلاحية الوصول إليها.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      {/* Channel header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        {channelIcon}
        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-lg font-semibold truncate">{channel.name_ar}</h2>
          {channel.is_official && (
            <p className="text-[11px] text-accent flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              قناة رسمية — النشر للإدارة والناشرين فقط
            </p>
          )}
        </div>
      </div>

      {channel.type === 'text' ? (
        <>
          <MessageList
            messages={messages}
            onReply={(m) =>
              setReplyTo({
                id: m.id,
                content: m.content || '',
                author: m.profiles?.full_name || 'مستخدم',
              })
            }
          />
          <MessageInput
            onSend={handleSendMessage}
            disabled={!canSendMessage()}
            isOfficial={channel.is_official}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            channelId={channelId}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand text-primary-foreground mb-4 shadow-elevated">
              {channelIcon}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {channel.type === 'voice' ? 'قناة صوتية' : 'قناة فيديو'}
            </h3>
            <p className="text-muted-foreground">المكالمات الصوتية والمرئية قيد التطوير…</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;
