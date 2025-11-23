import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

type MessageInputProps = {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  isOfficial?: boolean;
};

export function MessageInput({ onSend, disabled, isOfficial }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await onSend(content.trim());
      setContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (disabled || isOfficial) {
    return (
      <div className="border-t border-border p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          {isOfficial
            ? 'هذه قناة رسمية - يمكن للإدارة فقط النشر هنا'
            : 'لا يمكنك إرسال رسائل في هذه القناة'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-4 bg-card">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك هنا... (Enter للإرسال، Shift+Enter للسطر الجديد)"
          className="resize-none min-h-[60px] max-h-[120px]"
          dir="auto"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || sending}
          className="h-[60px] w-[60px] flex-shrink-0"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        استخدم Shift+Enter لإضافة سطر جديد
      </p>
    </form>
  );
}
