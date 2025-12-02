import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  last_message?: {
    content: string;
    created_at: string;
  };
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
    fetchConnections();
    fetchDMChannels();
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    // Get accepted invitations
    const { data: invitations } = await supabase
      .from('invitations')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (!invitations) return;

    // Get unique user IDs
    const userIds = new Set<string>();
    invitations.forEach((inv) => {
      if (inv.sender_id !== user.id) userIds.add(inv.sender_id);
      if (inv.receiver_id !== user.id) userIds.add(inv.receiver_id);
    });

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', Array.from(userIds));

    if (profiles) {
      setConnections(profiles);
    }
  };

  const fetchDMChannels = async () => {
    if (!user) return;

    const { data: channels } = await supabase
      .from('dm_channels')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (!channels) {
      setLoading(false);
      return;
    }

    // Fetch other users and last messages
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
          other_user: profile || { id: otherUserId, full_name: 'مستخدم', username: 'user', avatar_url: null },
          last_message: lastMessage || undefined,
        };
      })
    );

    setDmChannels(channelsWithData);
    setLoading(false);
  };

  const startDM = async (userId: string) => {
    if (!user) return;

    // Check if DM channel already exists
    const { data: existing } = await supabase
      .from('dm_channels')
      .select('id')
      .or(
        `and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`
      )
      .maybeSingle();

    if (existing) {
      navigate(`/dm/${existing.id}`);
      return;
    }

    // Create new DM channel
    const { data: newChannel, error } = await supabase
      .from('dm_channels')
      .insert({
        user1_id: user.id,
        user2_id: userId,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إنشاء المحادثة',
      });
      return;
    }

    navigate(`/dm/${newChannel.id}`);
  };

  const filteredConnections = connections.filter(
    (conn) =>
      conn.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">المحادثات الخاصة</h1>
          <p className="text-muted-foreground">تواصل مع اتصالاتك المقبولة</p>
        </div>

        {/* Existing DM Channels */}
        {dmChannels.length > 0 && (
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">محادثاتك</h2>
            <div className="space-y-2">
              {dmChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => navigate(`/dm/${channel.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-right"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10">
                      {channel.other_user.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{channel.other_user.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {channel.last_message?.content || 'ابدأ المحادثة'}
                    </p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Connections */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">اتصالاتك</h2>

          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن اتصال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {filteredConnections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد اتصالات</p>
              <p className="text-sm mt-1">اقبل الدعوات لبدء المحادثات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10">
                      {connection.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{connection.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{connection.username}</p>
                  </div>
                  <Button onClick={() => startDM(connection.id)} size="sm">
                    <MessageSquare className="h-4 w-4 ml-2" />
                    محادثة
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DirectMessages;
