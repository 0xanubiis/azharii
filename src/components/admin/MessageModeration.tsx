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
    gender: 'male' | 'female' | null;
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
  const [collegeId, setCollegeId] = useState('');
  const [departmentId, setDepartmentId] = useState('all');
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');
  const [searchField, setSearchField] = useState<'all' | 'content' | 'user' | 'channel'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    Promise.all([fetchColleges(), fetchDepartments()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!collegeId) {
      setMessages([]);
      return;
    }
    fetchMessages(collegeId);
  }, [collegeId]);

  const fetchMessages = async (college: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('messages')
      .select(
        `id, content, created_at, file_url, channel_id, user_id,
         channels!inner(name_ar, department_id, college_id, gender),
         profiles(full_name, username, gender, college_id, department_id)`,
      )
      .eq('channels.college_id', college)
      .order('created_at', { ascending: false })
      .limit(500);
    setMessages((data as any) || []);
    setLoadingMessages(false);
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
    () => (collegeId ? departments.filter((d) => d.college_id === collegeId) : []),
    [departments, collegeId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      const msgDept = m.channels?.department_id || m.profiles?.department_id;
      if (departmentId !== 'all' && msgDept !== departmentId) return false;
      const msgGender = m.channels?.gender || m.profiles?.gender;
      if (gender !== 'all' && msgGender !== gender) return false;

      const created = new Date(m.created_at).getTime();
      if (fromDate && created < new Date(`${fromDate}T00:00:00`).getTime()) return false;
      if (toDate && created > new Date(`${toDate}T23:59:59`).getTime()) return false;

      if (q) {
        const content = (m.content || '').toLowerCase();
        const user = `${m.profiles?.full_name || ''} ${m.profiles?.username || ''}`.toLowerCase();
        const channel = (m.channels?.name_ar || '').toLowerCase();
        const hay =
          searchField === 'content'
            ? content
            : searchField === 'user'
              ? user
              : searchField === 'channel'
                ? channel
                : `${content} ${user} ${channel}`;
        const terms = q.split(/\s+/).filter(Boolean);
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [messages, search, searchField, departmentId, gender, fromDate, toDate]);

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
          اختر الكلية أولاً لعرض رسائلها (طلاب وطالبات معاً)، ثم صفِّ حسب القسم أو النوع.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالكلمات المفتاحية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-8"
            disabled={!collegeId}
          />
        </div>
        <Select value={searchField} onValueChange={(v: any) => setSearchField(v)} disabled={!collegeId}>
          <SelectTrigger><SelectValue placeholder="نطاق البحث" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">بحث في الكل</SelectItem>
            <SelectItem value="content">محتوى الرسالة</SelectItem>
            <SelectItem value="user">اسم المستخدم</SelectItem>
            <SelectItem value="channel">اسم القناة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={collegeId} onValueChange={(v) => { setCollegeId(v); setDepartmentId('all'); setGender('all'); setSearch(''); setFromDate(''); setToDate(''); }}>
          <SelectTrigger><SelectValue placeholder="اختر الكلية" /></SelectTrigger>
          <SelectContent>
            {colleges.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={departmentId} onValueChange={setDepartmentId} disabled={!collegeId}>
          <SelectTrigger><SelectValue placeholder="القسم" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأقسام</SelectItem>
            {visibleDepartments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={(v: any) => setGender(v)} disabled={!collegeId}>
          <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">طلاب وطالبات</SelectItem>
            <SelectItem value="male">طلاب فقط</SelectItem>
            <SelectItem value="female">طالبات فقط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">من تاريخ</label>
          <Input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFromDate(e.target.value)}
            disabled={!collegeId}
            className="w-[10.5rem]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">إلى تاريخ</label>
          <Input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            disabled={!collegeId}
            className="w-[10.5rem]"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!collegeId}
          onClick={() => {
            setSearch('');
            setSearchField('all');
            setDepartmentId('all');
            setGender('all');
            setFromDate('');
            setToDate('');
          }}
        >
          مسح الفلاتر
        </Button>
      </div>

      {!collegeId ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          اختر كلية من القائمة أعلاه لعرض الرسائل.
        </p>
      ) : loadingMessages ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <>
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
      </>
      )}
    </Card>
  );
}
