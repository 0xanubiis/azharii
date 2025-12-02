import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { FileText, Download, Forward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ForwardMessageDialog } from './ForwardMessageDialog';

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
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

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

  const renderMentions = (text: string) => {
    // Replace @username with styled mentions
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.match(/^@\w+$/)) {
        return (
          <span key={index} className="text-primary font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderFile = (fileUrl: string, fileType: string) => {
    const isImage = fileType.startsWith('image/');
    
    if (isImage) {
      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 max-w-sm"
        >
          <img
            src={fileUrl}
            alt="مرفق"
            className="rounded-lg border border-border max-h-64 object-cover hover:opacity-90 transition-opacity"
          />
        </a>
      );
    }

    return (
      <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-md max-w-sm">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm flex-1 truncate">مرفق</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(fileUrl, '_blank')}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <ForwardMessageDialog
        open={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        message={forwardMessage}
      />
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
                  <div className="mr-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onReply(message)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      رد
                    </button>
                    <button
                      onClick={() => setForwardMessage(message)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Forward className="h-3 w-3" />
                      تحويل
                    </button>
                  </div>
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
                {message.content && (
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {renderMentions(message.content)}
                  </p>
                )}
                {message.file_url && message.file_type && renderFile(message.file_url, message.file_type)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
