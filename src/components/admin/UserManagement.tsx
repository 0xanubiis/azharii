import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type User = {
  id: string;
  full_name: string;
  username: string;
  gender: string;
  college_id: string | null;
  department_id: string | null;
  colleges: { name_ar: string } | null;
  departments: { name_ar: string } | null;
  user_roles: { role: string }[];
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        colleges (name_ar),
        departments (name_ar),
        user_roles (role)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setUsers(data as any);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    // Remove existing roles
    await supabase.from('user_roles').delete().eq('user_id', userId);

    // Add new role
    const roleData = {
      user_id: userId,
      role: newRole as 'admin' | 'moderator' | 'publisher' | 'user',
    };

    const { error } = await supabase.from('user_roles').insert(roleData);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحديث الصلاحية',
      });
      return;
    }

    toast({
      title: 'تم التحديث',
      description: 'تم تحديث صلاحية المستخدم بنجاح',
    });

    fetchUsers();
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
      <h2 className="text-xl font-bold mb-4">إدارة المستخدمين</h2>
      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4 flex-1">
              <Avatar>
                <AvatarFallback>{user.full_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <div className="flex gap-2 mt-1">
                  {user.colleges && (
                    <Badge variant="outline">{user.colleges.name_ar}</Badge>
                  )}
                  {user.departments && (
                    <Badge variant="outline">{user.departments.name_ar}</Badge>
                  )}
                </div>
              </div>
            </div>
            <Select
              value={user.user_roles[0]?.role || 'user'}
              onValueChange={(value) => updateUserRole(user.id, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="moderator">مشرف</SelectItem>
                <SelectItem value="publisher">ناشر</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </Card>
  );
}
