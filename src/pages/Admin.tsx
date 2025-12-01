import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Hash, MessageSquare, Bell, BarChart3 } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { CollegeManagement } from '@/components/admin/CollegeManagement';
import { ChannelManagement } from '@/components/admin/ChannelManagement';
import { MessageModeration } from '@/components/admin/MessageModeration';
import { NotificationManagement } from '@/components/admin/NotificationManagement';
import { SystemStatistics } from '@/components/admin/SystemStatistics';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-1">إدارة كاملة للمنصة</p>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="statistics" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">الإحصائيات</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">المستخدمين</span>
            </TabsTrigger>
            <TabsTrigger value="colleges" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">الكليات</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="hidden sm:inline">القنوات</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">الرسائل</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">الإشعارات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statistics">
            <SystemStatistics />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="colleges">
            <CollegeManagement />
          </TabsContent>

          <TabsContent value="channels">
            <ChannelManagement />
          </TabsContent>

          <TabsContent value="messages">
            <MessageModeration />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
