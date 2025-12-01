import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X } from 'lucide-react';
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

export function MessageInput({ onSend, disabled, isOfficial, replyTo, onCancelReply, channelId, dmChannelId }: MessageInputProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
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

  const uploadFile = async (): Promise<{ url: string; type: string } | null> => {
    if (!selectedFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('message-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-files')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        type: selectedFile.type,
      };
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

  const createMentionNotifications = async (content: string) => {
    // Extract mentions from content (e.g., @username)
    const mentionRegex = /@(\w+)/g;
    const mentions = [...content.matchAll(mentionRegex)].map(match => match[1]);

    if (mentions.length === 0) return;

    // Get user IDs for mentioned usernames
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', mentions);

    if (!mentionedUsers || mentionedUsers.length === 0) return;

    // Create notifications
    const notifications = mentionedUsers.map(mentionedUser => ({
      user_id: mentionedUser.id,
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
        const uploadResult = await uploadFile();
        if (uploadResult) {
          fileUrl = uploadResult.url;
          fileType = uploadResult.type;
        }
      }

      await onSend(content.trim(), fileUrl, fileType);
      
      // Create mention notifications
      if (content.trim()) {
        await createMentionNotifications(content.trim());
      }

      setContent('');
      setSelectedFile(null);
      onCancelReply();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  if (disabled) {
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
    <div className="border-t border-border bg-card">
      {replyTo && (
        <div className="px-4 pt-3 pb-2 bg-muted/30 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">رد على </span>
            <span className="font-semibold">{replyTo.author}</span>
            <p className="text-muted-foreground line-clamp-1 text-xs">{replyTo.content}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
            className="h-6 w-6 p-0 text-lg"
          >
            ×
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-4">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-md">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا... (استخدم @ للإشارة)"
              className="resize-none min-h-[60px] max-h-[120px]"
              dir="auto"
            />
            <div className="flex items-center gap-2">
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
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
              >
                <Paperclip className="h-4 w-4 ml-1" />
                إرفاق ملف
              </Button>
              <p className="text-xs text-muted-foreground">
                استخدم @ للإشارة إلى مستخدم
              </p>
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={(!content.trim() && !selectedFile) || sending || uploading}
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            {(sending || uploading) ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
