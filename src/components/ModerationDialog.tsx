import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ban, Clock, LogOut, AlertTriangle } from 'lucide-react';

type ModerationType = 'ban' | 'timeout' | 'kick';

interface ModerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ModerationType;
  userName: string;
  onConfirm: (reason?: string, duration?: number) => void;
  currentBanReason?: string;
}

export function ModerationDialog({
  open,
  onOpenChange,
  type,
  userName,
  onConfirm,
  currentBanReason,
}: ModerationDialogProps) {
  const [reason, setReason] = useState(currentBanReason || '');
  const [duration, setDuration] = useState('60');

  const handleConfirm = () => {
    if (type === 'timeout') {
      const mins = parseInt(duration, 10);
      if (!mins || mins < 1) return;
      onConfirm(reason, mins);
    } else {
      onConfirm(reason);
    }
    onOpenChange(false);
    setReason('');
    setDuration('60');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setReason('');
    setDuration('60');
  };

  const getDialogContent = () => {
    switch (type) {
      case 'ban':
        return {
          icon: <Ban className="h-6 w-6 text-destructive" />,
          title: 'حظر المستخدم',
          description: `هل أنت متأكد من حظر ${userName} نهائياً من المنصة؟`,
          showReason: true,
          showDuration: false,
          confirmText: 'حظر',
          variant: 'destructive' as const,
        };
      case 'timeout':
        return {
          icon: <Clock className="h-6 w-6 text-primary" />,
          title: 'تقييد مؤقت',
          description: `تقييد ${userName} مؤقتاً من المنصة`,
          showReason: false,
          showDuration: true,
          confirmText: 'تقييد',
          variant: 'default' as const,
        };
      case 'kick':
        return {
          icon: <LogOut className="h-6 w-6 text-primary" />,
          title: 'طرد المستخدم',
          description: `هل أنت متأكد من طرد ${userName} وتسجيل خروجه فوراً؟`,
          showReason: false,
          showDuration: false,
          confirmText: 'طرد',
          variant: 'default' as const,
        };
    }
  };

  const content = getDialogContent();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {content.icon}
            <AlertDialogTitle>{content.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{content.description}</AlertDialogDescription>
        </AlertDialogHeader>

        {content.showReason && (
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">سبب الحظر (اختياري)</Label>
            <Input
              id="reason"
              placeholder="اكتب سبب الحظر هنا..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        {content.showDuration && (
          <div className="space-y-2 py-4">
            <Label htmlFor="duration">مدة التقييد (بالدقائق)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        )}

        <AlertDialogFooter className="flex-row-reverse">
          <Button variant={content.variant} onClick={handleConfirm}>
            {content.confirmText}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            إلغاء
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface BanNotificationDialogProps {
  open: boolean;
  reason?: string;
  onSignOut: () => void;
}

export function BanNotificationDialog({ open, reason, onSignOut }: BanNotificationDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>تم حظر حسابك</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            تم حظر حسابك من المنصة{reason && `:\n${reason}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse">
          <Button onClick={onSignOut}>تسجيل الخروج</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
