import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hash, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type ForwardMessageDialogProps = {
  open: boolean;
  onClose: () => void;
  message: {
    content: string | null;
    file_url?: string | null;
    file_type?: string | null;
    profiles: {
      full_name: string;
    };
  } | null;
};

type Channel = {
  id: string;
  name_ar: string;
  is_official: boolean;
};

type DMChannel = {
  id: string;
  otherUser: {
    full_name: string;
    username: string;
  };
};

export function ForwardMessageDialog({ open, onClose, message }: ForwardMessageDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dmChannels, setDMChannels] = useState<DMChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    if (open) {
      fetchChannels();
      fetchDMChannels();
    }
  }, [open]);

  const fetchChannels = async () => {
    if (!profile) return;
    setLoading(true);
    
    const { data } = await supabase
      .from('channels')
      .select('id, name_ar, is_official')
      .or(`department_id.eq.${profile.department_id},college_id.eq.${profile.college_id}`)
      .eq('is_official', false);
    
    if (data) {
      setChannels(data);
    }
    setLoading(false);
  };

  const fetchDMChannels = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('dm_channels')
      .select('id, user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    
    if (data) {
      const dmList = await Promise.all(
        data.map(async (dm) => {
          const otherUserId = dm.user1_id === user.id ? dm.user2_id : dm.user1_id;
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', otherUserId)
            .maybeSingle();
          
          return {
            id: dm.id,
            otherUser: otherProfile || { full_name: 'مستخدم', username: 'user' },
          };
        })
      );
      setDMChannels(dmList);
    }
  };

  const handleForwardToChannel = async (channelId: string) => {
    if (!user || !message) return;
    
    setForwarding(true);
    const forwardedContent = `📤 رسالة محولة من ${message.profiles.full_name}:\n${message.content || ''}`;
    
    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: user.id,
      content: forwardedContent,
      file_url: message.file_url || null,
      file_type: message.file_type || null,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ في تحويل الرسالة',
        description: error.message,
      });
    } else {
      toast({
        title: 'تم تحويل الرسالة',
        description: 'تم إرسال الرسالة بنجاح',
      });
      onClose();
    }
    setForwarding(false);
  };

  const handleForwardToDM = async (dmChannelId: string) => {
    if (!user || !message) return;
    
    setForwarding(true);
    const forwardedContent = `📤 رسالة محولة من ${message.profiles.full_name}:\n${message.content || ''}`;
    
    const { error } = await supabase.from('dm_messages').insert({
      dm_channel_id: dmChannelId,
      sender_id: user.id,
      content: forwardedContent,
      file_url: message.file_url || null,
      file_type: message.file_type || null,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ في تحويل الرسالة',
        description: error.message,
      });
    } else {
      toast({
        title: 'تم تحويل الرسالة',
        description: 'تم إرسال الرسالة بنجاح',
      });
      onClose();
    }
    setForwarding(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تحويل الرسالة</DialogTitle>
        </DialogHeader>
        
        {message && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
            <p className="text-muted-foreground text-xs mb-1">الرسالة:</p>
            <p className="line-clamp-2">{message.content || '(ملف مرفق)'}</p>
          </div>
        )}

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="channels" className="flex-1">
              <Hash className="h-4 w-4 ml-1" />
              القنوات
            </TabsTrigger>
            <TabsTrigger value="dm" className="flex-1">
              <MessageCircle className="h-4 w-4 ml-1" />
              الرسائل الخاصة
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="channels">
            <ScrollArea className="h-[200px]">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : channels.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لا توجد قنوات متاحة</p>
              ) : (
                <div className="space-y-1">
                  {channels.map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleForwardToChannel(channel.id)}
                      disabled={forwarding}
                    >
                      <Hash className="h-4 w-4 ml-2" />
                      {channel.name_ar}
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="dm">
            <ScrollArea className="h-[200px]">
              {dmChannels.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لا توجد محادثات</p>
              ) : (
                <div className="space-y-1">
                  {dmChannels.map((dm) => (
                    <Button
                      key={dm.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleForwardToDM(dm.id)}
                      disabled={forwarding}
                    >
                      <MessageCircle className="h-4 w-4 ml-2" />
                      {dm.otherUser.full_name}
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
