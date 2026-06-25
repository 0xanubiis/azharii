import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { FileText, Download, Forward, Reply, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ForwardMessageDialog } from './ForwardMessageDialog';
import { getInitials } from '@/lib/initials';

type Message = {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  reply_to: string | null;
  file_url?: string | null;
  file_type?: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  replied_message?: {
    id: string;
    content: string | null;
    user_id: string;
    profiles: { full_name: string; username: string };
  } | null;
};

type MessageListProps = {
  messages: Message[];
  onReply: (message: Message) => void;
};

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function formatDayLabel(d: Date) {
  if (isToday(d)) return 'اليوم';
  if (isYesterday(d)) return 'الأمس';
  return format(d, 'EEEE d MMMM yyyy', { locale: ar });
}

function safeDate(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function MessageList({ messages, onReply }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showJump, setShowJump] = useState(false);

  // Auto-scroll to bottom when new messages, only if user is near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 400);
  };

  const renderMentions = (text: string) =>
    text.split(/(@\w+)/g).map((part, i) =>
      /^@\w+$/.test(part) ? (
        <span
          key={i}
          className="bg-primary/15 text-primary px-1 rounded font-semibold cursor-pointer hover:bg-primary/25 transition-colors"
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  const renderFile = (fileUrl: string, fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 max-w-md group/img"
        >
          <img
            src={fileUrl}
            alt="صورة مرفقة من المستخدم"
            loading="lazy"
            className="rounded-lg border border-border max-h-80 object-cover group-hover/img:opacity-95 transition"
          />
        </a>
      );
    }
    return (
      <div className="mt-2 flex items-center gap-2 p-2.5 bg-muted rounded-lg max-w-sm border border-border">
        <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="text-sm flex-1 truncate font-medium">ملف مرفق</span>
        <Button
          size="icon"
          variant="ghost"
          aria-label="تنزيل الملف"
          onClick={() => window.open(fileUrl, '_blank')}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Group consecutive same-author messages within window, with day dividers
  const grouped = useMemo(() => {
    type Item =
      | { kind: 'divider'; key: string; label: string }
      | { kind: 'msg'; key: string; msg: Message; grouped: boolean };
    const out: Item[] = [];
    let lastDay = '';
    let lastAuthor = '';
    let lastTs = 0;
    messages.forEach((m) => {
      const d = safeDate(m.created_at);
      const dayKey = d.toDateString();
      if (dayKey !== lastDay) {
        out.push({ kind: 'divider', key: 'd-' + dayKey, label: formatDayLabel(d) });
        lastDay = dayKey;
        lastAuthor = '';
        lastTs = 0;
      }
      const grouped =
        m.user_id === lastAuthor && d.getTime() - lastTs < GROUP_WINDOW_MS && !m.reply_to;
      out.push({ kind: 'msg', key: m.id, msg: m, grouped });
      lastAuthor = m.user_id;
      lastTs = d.getTime();
    });
    return out;
  }, [messages]);

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-auto px-3 md:px-6 py-4"
      >
        <ForwardMessageDialog
          open={!!forwardMessage}
          onClose={() => setForwardMessage(null)}
          message={forwardMessage}
        />

        {messages.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Reply className="h-9 w-9 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">ابدأ المحادثة</h3>
            <p className="text-muted-foreground text-sm">
              كن أول من يكتب رسالة في هذه القناة.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {grouped.map((item) =>
              item.kind === 'divider' ? (
                <div
                  key={item.key}
                  className="flex items-center gap-3 py-3 text-[11px] text-muted-foreground"
                >
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-semibold uppercase tracking-wider">{item.label}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              ) : (
                <MessageRow
                  key={item.key}
                  message={item.msg}
                  grouped={item.grouped}
                  onReply={onReply}
                  onForward={setForwardMessage}
                  renderMentions={renderMentions}
                  renderFile={renderFile}
                />
              ),
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {showJump && (
        <Button
          size="icon"
          onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-elevated h-10 w-10"
          aria-label="الذهاب إلى آخر رسالة"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

function MessageRow({
  message,
  grouped,
  onReply,
  onForward,
  renderMentions,
  renderFile,
}: {
  message: Message;
  grouped: boolean;
  onReply: (m: Message) => void;
  onForward: (m: Message) => void;
  renderMentions: (text: string) => React.ReactNode;
  renderFile: (url: string, type: string) => React.ReactNode;
}) {
  const ts = safeDate(message.created_at);
  const fullName = message.profiles?.full_name || 'مستخدم';
  const username = message.profiles?.username || 'user';

  return (
    <div
      className={`group relative flex gap-3 px-2 py-0.5 rounded-md hover:bg-hover transition-colors ${
        grouped ? '' : 'mt-3'
      }`}
    >
      {/* Avatar or hover timestamp gutter */}
      <div className="w-10 flex-shrink-0 flex items-start justify-center pt-1">
        {grouped ? (
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground transition-opacity">
            {format(ts, 'HH:mm', { locale: ar })}
          </span>
        ) : (
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/15 text-primary font-bold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {message.replied_message && (
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1 pr-1">
            <Reply className="h-3 w-3 rotate-180" />
            <span>
              ردًا على{' '}
              <span className="font-semibold text-foreground/80">
                {message.replied_message.profiles?.full_name || 'مستخدم'}
              </span>
              {message.replied_message.content && (
                <>
                  {': '}
                  <span className="line-clamp-1 inline">
                    {message.replied_message.content}
                  </span>
                </>
              )}
            </span>
          </div>
        )}

        {!grouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm">{fullName}</span>
            <span className="text-[11px] text-muted-foreground">@{username}</span>
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(ts, { addSuffix: true, locale: ar })}
            </span>
          </div>
        )}

        {message.content && (
          <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
            {renderMentions(message.content)}
          </p>
        )}
        {message.file_url && message.file_type && renderFile(message.file_url, message.file_type)}
      </div>

      {/* Hover action bar */}
      <div className="absolute -top-3 left-3 hidden group-hover:flex items-center gap-0.5 bg-popover border border-border rounded-md shadow-elevated p-0.5 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onReply(message)}
          aria-label="رد"
          title="رد"
        >
          <Reply className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onForward(message)}
          aria-label="تحويل"
          title="تحويل"
        >
          <Forward className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
