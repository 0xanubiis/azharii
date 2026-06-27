import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  MessageSquare,
  UserPlus,
  FileText,
  Megaphone,
  Check,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type Notification = {
  id: string;
  type: 'mention' | 'news' | 'invitation' | 'file' | 'reply';
  title_ar: string;
  content_ar: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const channel = setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return null;

    const channel = supabase
      .channel(`notifications-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          
          // Show toast for new notification
          toast({
            title: (payload.new as Notification).title_ar,
            description: (payload.new as Notification).content_ar || undefined,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === payload.new.id ? (payload.new as Notification) : notif
            )
          );
        }
      )
      .subscribe();

    return channel;
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحديث حالة الإشعار',
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحديث الإشعارات',
      });
    } else {
      toast({
        title: 'تم بنجاح',
        description: 'تم تعليم جميع الإشعارات كمقروءة',
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'mention':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'reply':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'invitation':
        return <UserPlus className="h-5 w-5 text-purple-500" />;
      case 'file':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'news':
        return <Megaphone className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'mention':
        return 'إشارة';
      case 'reply':
        return 'رد';
      case 'invitation':
        return 'دعوة';
      case 'file':
        return 'ملف';
      case 'news':
        return 'خبر';
      default:
        return 'إشعار';
    }
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">الإشعارات</h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0
                ? `لديك ${unreadCount} إشعار غير مقروء`
                : 'لا توجد إشعارات جديدة'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm" className="self-start sm:self-auto">
              <CheckCheck className="h-4 w-4 ml-2" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              الكل ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              غير مقروء ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">لا توجد إشعارات</p>
                  <p className="text-sm mt-2">
                    {filter === 'unread'
                      ? 'جميع إشعاراتك مقروءة'
                      : 'ستظهر إشعاراتك هنا'}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {notification.title_ar}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        {notification.content_ar && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.content_ar}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                        </div>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="flex-shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;
