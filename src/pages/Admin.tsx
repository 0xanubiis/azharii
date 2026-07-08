import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Hash, MessageSquare, Bell, BarChart3, ScrollText } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { CollegeManagement } from '@/components/admin/CollegeManagement';
import { ChannelManagement } from '@/components/admin/ChannelManagement';
import { MessageModeration } from '@/components/admin/MessageModeration';
import { NotificationManagement } from '@/components/admin/NotificationManagement';
import { SystemStatistics } from '@/components/admin/SystemStatistics';
import { ActivityLogs } from '@/components/admin/ActivityLogs';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      checkAdminAccess();
    }
  }, [user, authLoading]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user has admin role
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (error || !data) {
      console.error('Admin access denied:', error);
      navigate('/');
      return;
    }

    // Additional check: Only allow specific admin email
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser?.user?.email !== 'evidence404@proton.me') {
      console.error('Only evidence404@proton.me can access admin dashboard');
      navigate('/');
      return;
    }

    setIsAdmin(true);
    setChecking(false);
  };

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { value: 'statistics', label: 'الإحصائيات', icon: BarChart3 },
    { value: 'users', label: 'المستخدمين', icon: Users },
    { value: 'colleges', label: 'الكليات', icon: Building2 },
    { value: 'channels', label: 'القنوات', icon: Hash },
    { value: 'messages', label: 'الرسائل', icon: MessageSquare },
    { value: 'notifications', label: 'الإشعارات', icon: Bell },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background" dir="rtl">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">لوحة التحكم</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة كاملة للمنصة</p>
          </div>
        </header>

        <Tabs defaultValue="statistics" className="space-y-6">
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="inline-flex w-auto min-w-full gap-1 p-1">
              {tabs.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="flex items-center gap-2 whitespace-nowrap">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="statistics"><SystemStatistics /></TabsContent>
          <TabsContent value="users"><UserManagement /></TabsContent>
          <TabsContent value="colleges"><CollegeManagement /></TabsContent>
          <TabsContent value="channels"><ChannelManagement /></TabsContent>
          <TabsContent value="messages"><MessageModeration /></TabsContent>
          <TabsContent value="notifications"><NotificationManagement /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
