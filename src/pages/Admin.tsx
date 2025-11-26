import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Shield, Users, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type UserProfile = {
  id: string;
  full_name: string;
  username: string;
  gender: 'male' | 'female';
  avatar_url: string | null;
  college_id: string;
  department_id: string;
  created_at: string;
  colleges: {
    name_ar: string;
  };
  departments: {
    name_ar: string;
  };
};

type UserRole = {
  role: 'admin' | 'moderator' | 'publisher' | 'user';
};

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!data) {
      toast({
        variant: 'destructive',
        title: 'غير مصرح',
        description: 'ليس لديك صلاحيات الوصول لهذه الصفحة',
      });
      navigate('/home');
      return;
    }

    setIsAdmin(true);
  };

  const fetchUsers = async () => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select(`
        *,
        colleges(name_ar),
        departments(name_ar)
      `)
      .order('created_at', { ascending: false });

    if (profilesData) {
      setUsers(profilesData as any);

      // Fetch roles for all users
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in(
          'user_id',
          profilesData.map((p) => p.id)
        );

      if (rolesData) {
        const rolesMap: Record<string, UserRole[]> = {};
        rolesData.forEach((role) => {
          if (!rolesMap[role.user_id]) {
            rolesMap[role.user_id] = [];
          }
          rolesMap[role.user_id].push({ role: role.role as any });
        });
        setUserRoles(rolesMap);
      }
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, role: 'publisher' | 'moderator', action: 'add' | 'remove') => {
    if (action === 'add') {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'فشل إضافة الدور',
        });
        return;
      }

      toast({
        title: 'تم بنجاح',
        description: `تم إضافة دور ${role === 'publisher' ? 'الناشر' : 'المشرف'}`,
      });
    } else {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'فشل إزالة الدور',
        });
        return;
      }

      toast({
        title: 'تم بنجاح',
        description: `تم إزالة دور ${role === 'publisher' ? 'الناشر' : 'المشرف'}`,
      });
    }

    fetchUsers();
  };

  const hasRole = (userId: string, role: string) => {
    return userRoles[userId]?.some((r) => r.role === role) || false;
  };

  const getRoleBadges = (userId: string) => {
    const roles = userRoles[userId] || [];
    return roles.map((roleObj) => {
      const roleLabels = {
        admin: 'مدير',
        moderator: 'مشرف',
        publisher: 'ناشر',
        user: 'مستخدم',
      };
      const roleColors = {
        admin: 'destructive',
        moderator: 'default',
        publisher: 'secondary',
        user: 'outline',
      };

      return (
        <Badge
          key={roleObj.role}
          variant={roleColors[roleObj.role] as any}
          className="text-xs"
        >
          {roleLabels[roleObj.role]}
        </Badge>
      );
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            <p className="text-muted-foreground">إدارة المستخدمين والصلاحيات</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">الناشرون</p>
                <p className="text-2xl font-bold">
                  {Object.values(userRoles).filter((roles) =>
                    roles.some((r) => r.role === 'publisher')
                  ).length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">المشرفون</p>
                <p className="text-2xl font-bold">
                  {Object.values(userRoles).filter((roles) =>
                    roles.some((r) => r.role === 'moderator')
                  ).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مستخدم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Users List */}
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">المستخدمون</h2>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50"
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10">
                    {user.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {user.colleges?.name_ar} - {user.departments?.name_ar}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">{getRoleBadges(user.id)}</div>
                </div>
                <div className="flex gap-2">
                  {!hasRole(user.id, 'publisher') ? (
                    <Button
                      size="sm"
                      onClick={() => updateUserRole(user.id, 'publisher', 'add')}
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      منح دور ناشر
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => updateUserRole(user.id, 'publisher', 'remove')}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 ml-2" />
                      إزالة دور ناشر
                    </Button>
                  )}
                  {!hasRole(user.id, 'moderator') ? (
                    <Button
                      size="sm"
                      onClick={() => updateUserRole(user.id, 'moderator', 'add')}
                      variant="outline"
                    >
                      منح دور مشرف
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => updateUserRole(user.id, 'moderator', 'remove')}
                      variant="destructive"
                    >
                      إزالة دور مشرف
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
