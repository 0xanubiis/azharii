import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Reply as ReplyIcon, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type MessageInputProps = {
  onSend: (content: string, fileUrl?: string, fileType?: string) => Promise<void>;
  disabled?: boolean;
  isOfficial?: boolean;
  replyTo: { id: string; content: string; author: string } | null;
  onCancelReply: () => void;
  channelId?: string;
  dmChannelId?: string;
};

export function MessageInput({
  onSend,
  disabled,
  isOfficial,
  replyTo,
  onCancelReply,
  channelId,
  dmChannelId,
}: MessageInputProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [content]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'حجم الملف كبير جداً',
        description: 'الحد الأقصى لحجم الملف هو 10 ميجابايت',
      });
      return;
    }
    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) return null;
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('message-files')
        .upload(fileName, selectedFile);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('message-files').getPublicUrl(fileName);
      return { url: publicUrl, type: selectedFile.type };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'فشل رفع الملف',
        description: 'حدث خطأ أثناء رفع الملف',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const createMentionNotifications = async (text: string) => {
    const mentions = [...text.matchAll(/@(\w+)/g)].map((m) => m[1]);
    if (!mentions.length) return;
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', mentions);
    if (!mentionedUsers?.length) return;
    const notifications = mentionedUsers.map((u) => ({
      user_id: u.id,
      type: 'mention' as const,
      title_ar: 'تم الإشارة إليك',
      content_ar: `ذكرك في ${channelId ? 'قناة' : 'محادثة خاصة'}`,
      link: channelId ? `/channel/${channelId}` : `/dm/${dmChannelId}`,
    }));
    await supabase.from('notifications').insert(notifications);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !selectedFile) || sending || uploading) return;
    setSending(true);
    try {
      let fileUrl: string | undefined;
      let fileType: string | undefined;
      if (selectedFile) {
        const r = await uploadFile();
        if (r) {
          fileUrl = r.url;
          fileType = r.type;
        }
      }
      await onSend(content.trim(), fileUrl, fileType);
      if (content.trim()) await createMentionNotifications(content.trim());
      setContent('');
      setSelectedFile(null);
      onCancelReply();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error sending message:', err);
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

  if (disabled) {
    return (
      <div className="border-t border-border p-4 bg-card/50">
        <p className="text-sm text-muted-foreground text-center">
          {isOfficial
            ? '🔒 هذه قناة رسمية — يمكن للإدارة والناشرين فقط النشر هنا.'
            : 'لا يمكنك إرسال رسائل في هذه القناة.'}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card/60 backdrop-blur-sm flex-shrink-0">
      {replyTo && (
        <div className="px-4 pt-3 pb-2 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
          <div className="text-sm flex items-center gap-2 min-w-0">
            <ReplyIcon className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-muted-foreground">رد على </span>
              <span className="font-semibold">{replyTo.author}</span>
              <p className="text-muted-foreground line-clamp-1 text-xs">{replyTo.content}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="h-7 w-7"
            aria-label="إلغاء الرد"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-3 md:p-4">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-md border border-border">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="h-4 w-4 text-primary" />
            ) : (
              <Paperclip className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm flex-1 truncate font-medium">{selectedFile.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(0)} ك.ب
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="h-6 w-6"
              aria-label="إزالة الملف"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-background border border-border rounded-xl px-2 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            aria-label="إرفاق ملف"
            title="إرفاق ملف"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك… (Enter للإرسال، Shift+Enter لسطر جديد)"
            rows={1}
            className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[36px] max-h-[200px] py-1.5 px-1 text-sm leading-relaxed"
            dir="auto"
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!content.trim() && !selectedFile) || sending || uploading}
            className="h-9 w-9 flex-shrink-0 rounded-lg"
            aria-label="إرسال"
          >
            {sending || uploading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
          استخدم <span className="font-semibold text-primary">@</span> للإشارة إلى مستخدم
        </p>
      </form>
    </div>
  );
}
