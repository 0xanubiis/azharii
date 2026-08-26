import { useEffect, useState } from 'react';
import { FileText, Download, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveMessageFileUrl } from '@/lib/messageFiles';

type Props = {
  fileRef: string;
  fileType: string;
};

export function MessageAttachment({ fileRef, fileType }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    resolveMessageFileUrl(fileRef).then((resolved) => {
      if (!active) return;
      if (resolved) setUrl(resolved);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [fileRef]);

  if (failed) {
    return (
      <div className="mt-2 flex items-center gap-2 p-2.5 bg-muted rounded-lg max-w-sm border border-border">
        <ShieldAlert className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">لا يمكن الوصول إلى هذا المرفق</span>
      </div>
    );
  }

  if (!url) {
    return <Skeleton className="mt-2 h-16 w-48 rounded-lg" />;
  }

  if (fileType.startsWith('image/')) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 max-w-md group/img"
      >
        <img
          src={url}
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
        onClick={() => window.open(url, '_blank')}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
