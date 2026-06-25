import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Check, X } from 'lucide-react';

type Invitation = {
  id: string;
  status: string;
  created_at: string;
  sender_profile?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  receiver_profile?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
};

type UserProfile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
};

export default function Invitations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;

    // Fetch sent invitations
    const { data: sent } = await supabase
      .from('invitations')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch receiver profiles for sent invitations
    if (sent && sent.length > 0) {
      const receiverIds = sent.map(inv => inv.receiver_id);
      const { data: receiverProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', receiverIds);

      const sentWithProfiles = sent.map(inv => ({
        ...inv,
        receiver_profile: receiverProfiles?.find(p => p.id === inv.receiver_id) || null
      }));
      setSentInvitations(sentWithProfiles as any);
    } else {
      setSentInvitations([]);
    }

    // Fetch received invitations
    const { data: received } = await supabase
      .from('invitations')
      .select('*')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch sender profiles for received invitations
    if (received && received.length > 0) {
      const senderIds = received.map(inv => inv.sender_id);
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', senderIds);

      const receivedWithProfiles = received.map(inv => ({
        ...inv,
        sender_profile: senderProfiles?.find(p => p.id === inv.sender_id) || null
      }));
      setReceivedInvitations(receivedWithProfiles as any);
    } else {
      setReceivedInvitations([]);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(10);

    if (error) {
      toast({
        title: 'خطأ في البحث',
        description: 'حدث خطأ أثناء البحث عن المستخدمين',
        variant: 'destructive',
      });
    } else {
      setSearchResults(data || []);
    }
    setLoading(false);
  };

  const sendInvitation = async (receiverId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('invitations')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
      });

    if (error) {
      toast({
        title: 'فشل إرسال الدعوة',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم إرسال الدعوة',
        description: 'تم إرسال دعوتك بنجاح',
      });
      setSearchQuery('');
      setSearchResults([]);
      fetchInvitations();
    }
  };

  const respondToInvitation = async (invitationId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('invitations')
      .update({ status })
      .eq('id', invitationId);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الرد على الدعوة',
        variant: 'destructive',
      });
    } else {
      toast({
        title: status === 'accepted' ? 'تم قبول الدعوة' : 'تم رفض الدعوة',
        description: status === 'accepted' ? 'تمت إضافة الصديق بنجاح' : 'تم رفض الدعوة',
      });
      fetchInvitations();
    }
  };

  return (
    <div className="h-full overflow-y-auto" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">الدعوات</h1>


        {/* Search Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث عن مستخدمين
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder="ابحث باسم المستخدم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={loading}>
              بحث
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{profile.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profile.full_name}</p>
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendInvitation(profile.id)}
                  >
                    <UserPlus className="h-4 w-4 ml-2" />
                    إرسال دعوة
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Invitations Tabs */}
        <Tabs defaultValue="received">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">الدعوات المستلمة</TabsTrigger>
            <TabsTrigger value="sent">الدعوات المرسلة</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {receivedInvitations.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                لا توجد دعوات مستلمة
              </Card>
            ) : (
              receivedInvitations.map((invitation) => (
                <Card key={invitation.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={invitation.sender_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {invitation.sender_profile?.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{invitation.sender_profile?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          @{invitation.sender_profile?.username}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          الحالة: {invitation.status === 'pending' ? 'قيد الانتظار' : invitation.status === 'accepted' ? 'مقبولة' : 'مرفوضة'}
                        </p>
                      </div>
                    </div>
                    {invitation.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => respondToInvitation(invitation.id, 'accepted')}
                        >
                          <Check className="h-4 w-4 ml-2" />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => respondToInvitation(invitation.id, 'rejected')}
                        >
                          <X className="h-4 w-4 ml-2" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentInvitations.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                لم ترسل أي دعوات بعد
              </Card>
            ) : (
              sentInvitations.map((invitation) => (
                <Card key={invitation.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={invitation.receiver_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {invitation.receiver_profile?.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{invitation.receiver_profile?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          @{invitation.receiver_profile?.username}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          الحالة: {invitation.status === 'pending' ? 'قيد الانتظار' : invitation.status === 'accepted' ? 'مقبولة' : 'مرفوضة'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
