import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Ban, Clock, UserX, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type LogEntry = {
  id: string;
  type: 'signup' | 'ban' | 'timeout' | 'kick' | 'notification';
  at: string;
  title: string;
  description?: string;
};

const ICONS: Record<LogEntry['type'], any> = {
  signup: UserPlus,
  ban: Ban,
  timeout: Clock,
  kick: UserX,
  notification: Bell,
};

const COLORS: Record<LogEntry['type'], string> = {
  signup: 'bg-primary/15 text-primary',
  ban: 'bg-destructive/15 text-destructive',
  timeout: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  kick: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  notification: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
};

const LABELS: Record<LogEntry['type'], string> = {
  signup: 'تسجيل جديد',
  ban: 'حظر',
  timeout: 'إيقاف مؤقت',
  kick: 'طرد',
  notification: 'إشعار عام',
};

export const ActivityLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const entries: LogEntry[] = [];

    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, full_name, username, created_at, banned_at, ban_reason, timeout_until, kicked_at')
      .order('created_at', { ascending: false })
      .limit(100);

    (recentUsers ?? []).forEach((p: any) => {
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
      .limit(50);

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
    setLogs(entries.slice(0, 200));
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل النشاط</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا يوجد نشاط لعرضه.</p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => {
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
        )}
      </CardContent>
    </Card>
  );
};
