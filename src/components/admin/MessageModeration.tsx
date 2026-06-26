import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type Message = {
  id: string;
  content: string | null;
  created_at: string;
  file_url: string | null;
  channel_id: string;
  user_id: string;
  channels: {
    name_ar: string;
    department_id: string | null;
    college_id: string | null;
  } | null;
  profiles: {
    full_name: string;
    username: string;
    gender: 'male' | 'female' | null;
    college_id: string | null;
    department_id: string | null;
  } | null;
};

type College = { id: string; name_ar: string };
type Department = { id: string; name_ar: string; college_id: string };

export function MessageModeration() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [collegeId, setCollegeId] = useState('all');
  const [departmentId, setDepartmentId] = useState('all');
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');

  useEffect(() => {
    Promise.all([fetchMessages(), fetchColleges(), fetchDepartments()]).finally(() =>
      setLoading(false),
    );
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select(
        `id, content, created_at, file_url, channel_id, user_id,
         channels(name_ar, department_id, college_id),
         profiles(full_name, username, gender, college_id, department_id)`,
      )
      .order('created_at', { ascending: false })
      .limit(500);
    if (data) setMessages(data as any);
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

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الرسالة' });
      return;
    }
    toast({ title: 'تم الحذف', description: 'تم حذف الرسالة بنجاح' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const visibleDepartments = useMemo(
    () => (collegeId === 'all' ? departments : departments.filter((d) => d.college_id === collegeId)),
    [departments, collegeId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      const msgCollege = m.channels?.college_id || m.profiles?.college_id;
      const msgDept = m.channels?.department_id || m.profiles?.department_id;
      if (collegeId !== 'all' && msgCollege !== collegeId) return false;
      if (departmentId !== 'all' && msgDept !== departmentId) return false;
      if (gender !== 'all' && m.profiles?.gender !== gender) return false;
      if (q) {
        const hay = `${m.content || ''} ${m.profiles?.full_name || ''} ${m.profiles?.username || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [messages, search, collegeId, departmentId, gender]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">إدارة الرسائل</h2>
        <p className="text-sm text-muted-foreground">
          مراقبة الرسائل في كل الأقسام (طلاب وطالبات) — مع إمكانية الحذف.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المحتوى..."
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
      </div>

      <p className="text-xs text-muted-foreground mb-3">إجمالي: {filtered.length} رسالة</p>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">لا توجد رسائل مطابقة.</p>
        )}
        {filtered.map((m) => (
          <div key={m.id} className="flex items-start justify-between gap-3 p-4 border rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-semibold">{m.profiles?.full_name || 'مستخدم'}</span>
                <span className="text-xs text-muted-foreground">@{m.profiles?.username}</span>
                {m.profiles?.gender && (
                  <Badge variant={m.profiles.gender === 'female' ? 'secondary' : 'outline'}>
                    {m.profiles.gender === 'female' ? 'طالبة' : 'طالب'}
                  </Badge>
                )}
                {m.channels?.name_ar && <Badge variant="outline">#{m.channels.name_ar}</Badge>}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ar })}
                </span>
              </div>
              {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
              {m.file_url && <Badge variant="secondary" className="mt-1">مرفق</Badge>}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMessage(m.id)}
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
