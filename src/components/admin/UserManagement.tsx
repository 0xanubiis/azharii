import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/initials';
import { Search, Ban, LogOut, Clock, ShieldCheck, MoreVertical } from 'lucide-react';

type User = {
  id: string;
  full_name: string;
  username: string;
  gender: 'male' | 'female';
  college_id: string | null;
  department_id: string | null;
  banned_at: string | null;
  ban_reason: string | null;
  timeout_until: string | null;
  kicked_at: string | null;
  colleges: { name_ar: string } | null;
  departments: { name_ar: string } | null;
  user_roles: { role: string }[];
};

type College = { id: string; name_ar: string };
type Department = { id: string; name_ar: string; college_id: string };

export function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [collegeId, setCollegeId] = useState<string>('all');
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');
  const [role, setRole] = useState<string>('all');

  useEffect(() => {
    Promise.all([fetchUsers(), fetchColleges(), fetchDepartments()]).finally(() =>
      setLoading(false),
    );
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `*, colleges (name_ar), departments (name_ar), user_roles (role)`,
        )
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching users:', error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل المستخدمين' });
        return;
      }
      if (data) setUsers(data as any);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل المستخدمين' });
    }
  };

  const fetchColleges = async () => {
    const { data } = await supabase.from('colleges').select('id, name_ar').order('name_ar');
    if (data) setColleges(data);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('id, name_ar, college_id')
      .order('name_ar');
    if (data) setDepartments(data);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: newRole as 'admin' | 'moderator' | 'publisher' | 'user',
    });
    if (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث الصلاحية' });
      return;
    }
    toast({ title: 'تم التحديث', description: 'تم تحديث صلاحية المستخدم بنجاح' });
    fetchUsers();
  };

  const patchProfile = async (userId: string, patch: Record<string, any>, successMsg: string) => {
    const { error } = await (supabase.from('profiles') as any).update(patch).eq('id', userId);
    if (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
      return;
    }
    toast({ title: 'تم', description: successMsg });
    fetchUsers();
  };

  const banUser = async (u: User) => {
    const reason = window.prompt('سبب الحظر (اختياري):', u.ban_reason || '') ?? '';
    if (!confirm(`حظر ${u.full_name} نهائياً؟`)) return;
    await patchProfile(
      u.id,
      { banned_at: new Date().toISOString(), ban_reason: reason || null },
      'تم حظر المستخدم',
    );
  };

  const unbanUser = (u: User) =>
    patchProfile(u.id, { banned_at: null, ban_reason: null }, 'تم رفع الحظر');

  const timeoutUser = async (u: User) => {
    const raw = window.prompt('مدة التقييد بالدقائق:', '60');
    if (!raw) return;
    const mins = parseInt(raw, 10);
    if (!mins || mins < 1) return toast({ variant: 'destructive', title: 'خطأ', description: 'مدة غير صالحة' });
    const until = new Date(Date.now() + mins * 60000).toISOString();
    await patchProfile(u.id, { timeout_until: until }, `تم تقييد المستخدم لمدة ${mins} دقيقة`);
  };

  const clearTimeout = (u: User) =>
    patchProfile(u.id, { timeout_until: null }, 'تم رفع التقييد');

  const kickUser = async (u: User) => {
    if (!confirm(`طرد ${u.full_name} وتسجيل خروجه فوراً؟`)) return;
    await patchProfile(u.id, { kicked_at: new Date().toISOString() }, 'تم طرد المستخدم');
  };


  const visibleDepartments = useMemo(
    () => (collegeId === 'all' ? departments : departments.filter((d) => d.college_id === collegeId)),
    [departments, collegeId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (collegeId !== 'all' && u.college_id !== collegeId) return false;
      if (departmentId !== 'all' && u.department_id !== departmentId) return false;
      if (gender !== 'all' && u.gender !== gender) return false;
      if (role !== 'all' && (u.user_roles[0]?.role || 'user') !== role) return false;
      if (q && !(u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [users, search, collegeId, departmentId, gender, role]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">إدارة المستخدمين</h2>
        <p className="text-sm text-muted-foreground">
          فلتر المستخدمين حسب الكلية، القسم، والنوع — ثم عيّن الصلاحية المناسبة.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-8"
          />
        </div>
        <Select value={collegeId} onValueChange={(v) => { setCollegeId(v); setDepartmentId('all'); }}>
          <SelectTrigger><SelectValue placeholder="الكلية" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الكليات</SelectItem>
            {colleges.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger><SelectValue placeholder="القسم" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأقسام</SelectItem>
            {visibleDepartments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={(v: any) => setGender(v)}>
          <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="male">طلاب</SelectItem>
            <SelectItem value="female">طالبات</SelectItem>
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue placeholder="الصلاحية" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الصلاحيات</SelectItem>
            <SelectItem value="admin">مدير</SelectItem>
            <SelectItem value="moderator">مشرف</SelectItem>
            <SelectItem value="publisher">ناشر</SelectItem>
            <SelectItem value="user">مستخدم</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-3">إجمالي: {filtered.length} مستخدم</p>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">لا يوجد مستخدمون مطابقون.</p>
        )}
        {filtered.map((u) => (
          <div
            key={u.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar>
                <AvatarFallback className="bg-primary/15 text-primary">
                  {getInitials(u.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{u.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant={u.gender === 'female' ? 'secondary' : 'outline'}>
                    {u.gender === 'female' ? 'طالبة' : 'طالب'}
                  </Badge>
                  {u.colleges && <Badge variant="outline">{u.colleges.name_ar}</Badge>}
                  {u.departments && <Badge variant="outline">{u.departments.name_ar}</Badge>}
                </div>
              </div>
            </div>
            <Select
              value={u.user_roles[0]?.role || 'user'}
              onValueChange={(value) => updateUserRole(u.id, value)}
            >
              <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
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
