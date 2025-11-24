import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type Message = {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  reply_to: string | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  replied_message?: {
    id: string;
    content: string | null;
    user_id: string;
    profiles: {
      full_name: string;
      username: string;
    };
  } | null;
};

type MessageListProps = {
  messages: Message[];
  onReply: (message: Message) => void;
};

export function MessageList({ messages, onReply }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ar,
      });
    } catch {
      return 'الآن';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد رسائل بعد. كن أول من يبدأ المحادثة!</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3 hover:bg-accent/5 p-2 rounded-lg transition-colors group">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {message.profiles.full_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {message.profiles.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{message.profiles.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.created_at)}
                  </span>
                  <button
                    onClick={() => onReply(message)}
                    className="mr-auto text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    رد
                  </button>
                </div>
                {message.replied_message && (
                  <div className="bg-muted/30 border-r-2 border-primary pr-2 py-1 mb-2 text-xs">
                    <span className="text-muted-foreground">
                      رد على <span className="font-semibold">{message.replied_message.profiles.full_name}</span>:
                    </span>
                    <p className="text-muted-foreground line-clamp-1">
                      {message.replied_message.content}
                    </p>
                  </div>
                )}
                <p className="text-sm break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
