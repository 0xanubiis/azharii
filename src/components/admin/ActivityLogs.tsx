import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2, UserPlus, Ban, Clock, UserX, Bell, Search, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type LogType = 'signup' | 'ban' | 'timeout' | 'kick' | 'notification';

type LogEntry = {
  id: string;
  type: LogType;
  at: string;
  title: string;
  description?: string;
};

const ICONS: Record<LogType, any> = {
  signup: UserPlus,
  ban: Ban,
  timeout: Clock,
  kick: UserX,
  notification: Bell,
};

const COLORS: Record<LogType, string> = {
  signup: 'bg-primary/15 text-primary',
  ban: 'bg-destructive/15 text-destructive',
  timeout: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  kick: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  notification: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
};

const LABELS: Record<LogType, string> = {
  signup: 'تسجيل جديد',
  ban: 'حظر',
  timeout: 'إيقاف مؤقت',
  kick: 'طرد',
  notification: 'إشعار عام',
};

const PAGE_SIZES = [10, 25, 50, 100];

export const ActivityLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | LogType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const entries: LogEntry[] = [];

    const [{ data: recentUsers }, { data: mods }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, username, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.rpc('admin_moderation_list'),
    ]);

    const modByUser = new Map<string, any>();
    (mods ?? []).forEach((m: any) => modByUser.set(m.user_id, m));

    (recentUsers ?? []).forEach((row: any) => {
      const p = { ...row, ...(modByUser.get(row.id) ?? {}) };

      entries.push({
        id: `signup-${p.id}`,
        type: 'signup',
        at: p.created_at,
        title: `${p.full_name} (@${p.username})`,
        description: 'انضم إلى المنصة',
      });
      if (p.banned_at) {
        entries.push({
          id: `ban-${p.id}`,
          type: 'ban',
          at: p.banned_at,
          title: `${p.full_name} (@${p.username})`,
          description: p.ban_reason || 'تم حظر الحساب',
        });
      }
      if (p.timeout_until) {
        entries.push({
          id: `timeout-${p.id}`,
          type: 'timeout',
          at: p.timeout_until,
          title: `${p.full_name} (@${p.username})`,
          description: `إيقاف مؤقت حتى ${new Date(p.timeout_until).toLocaleString('ar')}`,
        });
      }
      if (p.kicked_at) {
        entries.push({
          id: `kick-${p.id}`,
          type: 'kick',
          at: p.kicked_at,
          title: `${p.full_name} (@${p.username})`,
          description: 'تم إخراج الحساب من الجلسة',
        });
      }
    });

    const { data: notifs } = await supabase
      .from('notifications')
      .select('id, title, body, created_at, type')
      .order('created_at', { ascending: false })
      .limit(200);

    (notifs ?? []).forEach((n: any) => {
      entries.push({
        id: `notif-${n.id}`,
        type: 'notification',
        at: n.created_at,
        title: n.title || 'إشعار',
        description: n.body,
      });
    });

    entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    setLogs(entries);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null;
    return logs.filter((l) => {
      if (typeFilter !== 'all' && l.type !== typeFilter) return false;
      if (q) {
        const hay = `${l.title} ${l.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const ts = new Date(l.at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      return true;
    });
  }, [logs, search, typeFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, dateFrom, dateTo, pageSize]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle>سجل النشاط</CardTitle>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="h-4 w-4 absolute top-2.5 right-3 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الوصف..."
              className="pr-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {(Object.keys(LABELS) as LogType[]).map((t) => (
                <SelectItem key={t} value={t}>{LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="عدد لكل صفحة" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / صفحة</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">من تاريخ</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">إلى تاريخ</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button variant="ghost" size="sm" onClick={resetFilters}>مسح الفلاتر</Button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد نتائج مطابقة.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {paged.map((log) => {
                const Icon = ICONS[log.type];
                let when = '';
                try {
                  when = formatDistanceToNow(new Date(log.at), { addSuffix: true, locale: ar });
                } catch {
                  when = new Date(log.at).toLocaleString('ar');
                }
                return (
                  <li
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3"
                  >
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${COLORS[log.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{LABELS[log.type]}</Badge>
                        <span className="text-sm font-semibold truncate">{log.title}</span>
                      </div>
                      {log.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{log.description}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">{when}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
              <p className="text-xs text-muted-foreground">
                عرض {(currentPage - 1) * pageSize + 1}
                {' - '}
                {Math.min(currentPage * pageSize, filtered.length)} من {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>
                <span className="text-xs">{currentPage} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1"
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
