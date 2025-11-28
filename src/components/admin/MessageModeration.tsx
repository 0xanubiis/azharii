import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type Message = {
  id: string;
  content: string | null;
  created_at: string;
  file_url: string | null;
  channels: { name_ar: string };
  profiles: { full_name: string; username: string };
};

export function MessageModeration() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        channels(name_ar),
        profiles(full_name, username)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      setMessages(data as any);
    }
    setLoading(false);
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف الرسالة',
      });
      return;
    }

    toast({
      title: 'تم الحذف',
      description: 'تم حذف الرسالة بنجاح',
    });

    fetchMessages();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">إدارة الرسائل</h2>
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex items-start justify-between p-4 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{message.profiles.full_name}</span>
                <span className="text-sm text-muted-foreground">
                  @{message.profiles.username}
                </span>
                <Badge variant="outline">{message.channels.name_ar}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </span>
              </div>
              {message.content && (
                <p className="text-sm">{message.content}</p>
              )}
              {message.file_url && (
                <Badge variant="secondary" className="mt-1">
                  مرفق
                </Badge>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMessage(message.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
