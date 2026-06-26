import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function NotificationManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    title_ar: '',
    content_ar: '',
    type: 'news' as const,
    target: 'all',
    user_id: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, username');
    if (data) setUsers(data);
  };

  const sendNotification = async () => {
    if (!notification.title_ar.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'عنوان الإشعار مطلوب',
      });
      return;
    }

    if (notification.target === 'all') {
      // Send to all users
      const notifications = users.map((user) => ({
        user_id: user.id,
        title_ar: notification.title_ar,
        content_ar: notification.content_ar,
        type: notification.type,
      }));

      const { error } = await supabase.from('notifications').insert(notifications);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'فشل إرسال الإشعارات',
        });
        return;
      }
    } else {
      // Send to specific user
      const { error } = await supabase.from('notifications').insert({
        user_id: notification.user_id,
        title_ar: notification.title_ar,
        content_ar: notification.content_ar,
        type: notification.type,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'فشل إرسال الإشعار',
        });
        return;
      }
    }

    toast({
      title: 'تم الإرسال',
      description: 'تم إرسال الإشعارات بنجاح',
    });

    setNotification({
      title_ar: '',
      content_ar: '',
      type: 'news',
      target: 'all',
      user_id: '',
    });
    setDialogOpen(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">إدارة الإشعارات</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Send className="h-4 w-4 ml-2" />
          إرسال إشعار
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إرسال إشعار جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">العنوان</label>
                <Input
                  value={notification.title_ar}
                  onChange={(e) =>
                    setNotification({ ...notification, title_ar: e.target.value })
                  }
                  placeholder="عنوان الإشعار"
                />
              </div>
              <div>
                <label className="text-sm font-medium">المحتوى</label>
                <Textarea
                  value={notification.content_ar}
                  onChange={(e) =>
                    setNotification({ ...notification, content_ar: e.target.value })
                  }
                  placeholder="محتوى الإشعار..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">النوع</label>
                <Select
                  value={notification.type}
                  onValueChange={(value: any) =>
                    setNotification({ ...notification, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">أخبار</SelectItem>
                    <SelectItem value="mention">إشارة</SelectItem>
                    <SelectItem value="invitation">دعوة</SelectItem>
                    <SelectItem value="file">ملف</SelectItem>
                    <SelectItem value="reply">رد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">الهدف</label>
                <Select
                  value={notification.target}
                  onValueChange={(value) =>
                    setNotification({ ...notification, target: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستخدمين</SelectItem>
                    <SelectItem value="specific">مستخدم محدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {notification.target === 'specific' && (
                <div>
                  <label className="text-sm font-medium">المستخدم</label>
                  <Select
                    value={notification.user_id}
                    onValueChange={(value) =>
                      setNotification({ ...notification, user_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستخدم" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} (@{user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={sendNotification} className="w-full">
                إرسال
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-sm text-muted-foreground">
        استخدم هذه الأداة لإرسال إشعارات لجميع المستخدمين أو مستخدمين محددين
      </p>
    </Card>
  );
}
