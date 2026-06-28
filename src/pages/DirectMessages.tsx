import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/initials';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type Connection = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
};

type DMChannel = {
  id: string;
  user1_id: string;
  user2_id: string;
  other_user: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: { content: string; created_at: string };
};

const DirectMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dmChannels, setDmChannels] = useState<DMChannel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchConnections();
    fetchDMChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchConnections = async () => {
    if (!user) return;
    try {
      const { data: invitations } = await supabase
        .from('invitations')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (!invitations) return;
      const userIds = new Set<string>();
      invitations.forEach((inv) => {
        if (inv.sender_id !== user.id) userIds.add(inv.sender_id);
        if (inv.receiver_id !== user.id) userIds.add(inv.receiver_id);
      });
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', Array.from(userIds));
      if (profiles) setConnections(profiles);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchDMChannels = async () => {
    if (!user) return;
    try {
      const { data: channels } = await supabase
        .from('dm_channels')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      if (!channels) {
        setLoading(false);
        return;
      }
      const channelsWithData = await Promise.all(
        channels.map(async (channel) => {
          const otherUserId = channel.user1_id === user.id ? channel.user2_id : channel.user1_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();
          const { data: lastMessage } = await supabase
            .from('dm_messages')
            .select('content, created_at')
            .eq('dm_channel_id', channel.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          return {
            ...channel,
            other_user:
              profile || { id: otherUserId, full_name: 'مستخدم', username: 'user', avatar_url: null },
            last_message: lastMessage || undefined,
          };
        }),
      );
      setDmChannels(channelsWithData);
    } catch (error) {
      console.error('Error fetching DM channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDM = async (userId: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('dm_channels')
      .select('id')
      .or(
        `and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`,
      )
      .maybeSingle();
    if (existing) {
      navigate(`/dm/${existing.id}`);
      return;
    }
    const { data: newChannel, error } = await supabase
      .from('dm_channels')
      .insert({ user1_id: user.id, user2_id: userId })
      .select()
      .single();
    if (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إنشاء المحادثة' });
      return;
    }
    navigate(`/dm/${newChannel.id}`);
  };

  const filteredConnections = connections.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">المحادثات الخاصة</h1>
          <p className="text-muted-foreground text-sm">تواصل مع زملائك المقبولين</p>
        </header>

        {dmChannels.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              محادثاتك ({dmChannels.length})
            </h2>
            <Card className="overflow-hidden p-1">
              {dmChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => navigate(`/dm/${channel.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-hover transition-colors text-right"
                >
                  <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/15 text-primary font-bold">
                      {getInitials(channel.other_user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold truncate">{channel.other_user.full_name}</p>
                      {channel.last_message?.created_at && (
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(channel.last_message.created_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {channel.last_message?.content || 'ابدأ المحادثة'}
                    </p>
                  </div>
                </button>
              ))}
            </Card>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            اتصالاتك
          </h2>
          <Card className="p-4">
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن اتصال…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {filteredConnections.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>لا توجد اتصالات</p>
                <p className="text-sm mt-1">اقبل دعوات الأصدقاء لبدء المحادثات.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConnections.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-2.5 rounded-md hover:bg-hover transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/15 text-primary font-bold">
                        {getInitials(c.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{c.username}</p>
                    </div>
                    <Button onClick={() => startDM(c.id)} size="sm">
                      <MessageSquare className="h-4 w-4 ml-1.5" />
                      محادثة
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
};

export default DirectMessages;
