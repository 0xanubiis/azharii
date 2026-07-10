import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Camera, Eye, EyeOff, Loader2, LogOut, Save, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/initials';

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

const daysUntil = (fromIso: string | null) => {
  if (!fromIso) return 0;
  const diff = SIXTY_DAYS_MS - (Date.now() - new Date(fromIso).getTime());
  return diff <= 0 ? 0 : Math.ceil(diff / (24 * 60 * 60 * 1000));
};

const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadNotifications();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [notifyDm, setNotifyDm] = useState<boolean>(profile?.notify_dm ?? true);
  const [notifyInv, setNotifyInv] = useState<boolean>(profile?.notify_invitations ?? true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setUsername(profile.username ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
    setNotifyDm(profile.notify_dm ?? true);
    setNotifyInv(profile.notify_invitations ?? true);
  }, [profile?.id, profile?.updated_at]);

  const nameCooldownDays = useMemo(() => daysUntil(profile?.last_name_change_at ?? null), [profile?.last_name_change_at]);
  const usernameCooldownDays = useMemo(() => daysUntil(profile?.last_username_change_at ?? null), [profile?.last_username_change_at]);

  const nameChanged = fullName.trim() !== (profile?.full_name ?? '');
  const usernameChanged = username.trim() !== (profile?.username ?? '');
  const nameLocked = nameChanged && nameCooldownDays > 0;
  const usernameLocked = usernameChanged && usernameCooldownDays > 0;

  const strongPwd = (pw: string) =>
    pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'الرجاء اختيار صورة صالحة', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'حجم الصورة يجب أن يكون أقل من 5 ميغابايت', variant: 'destructive' });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: 'تعذر رفع الصورة', description: upErr.message, variant: 'destructive' });
      return;
    }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = pub.publicUrl;
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    setUploadingAvatar(false);
    if (updErr) {
      toast({ title: 'تعذر تحديث الصورة', description: updErr.message, variant: 'destructive' });
      return;
    }
    setAvatarUrl(publicUrl);
    toast({ title: 'تم تحديث الصورة الشخصية' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!fullName.trim() || !username.trim()) {
      toast({ title: 'الرجاء إدخال جميع الحقول', variant: 'destructive' });
      return;
    }
    if (nameLocked) {
      toast({ title: `يمكنك تغيير الاسم بعد ${nameCooldownDays} يومًا`, variant: 'destructive' });
      return;
    }
    if (usernameLocked) {
      toast({ title: `يمكنك تغيير اسم المستخدم بعد ${usernameCooldownDays} يومًا`, variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    const payload: any = {};
    if (nameChanged) payload.full_name = fullName.trim();
    if (usernameChanged) payload.username = username.trim();
    if (Object.keys(payload).length === 0) {
      setSavingProfile(false);
      toast({ title: 'لا توجد تغييرات' });
      return;
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: 'تعذر حفظ التغييرات', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم حفظ التغييرات بنجاح' });
    }
  };

  const handleSavePrefs = async (next: { dm?: boolean; inv?: boolean }) => {
    if (!user) return;
    setSavingPrefs(true);
    const payload: any = {};
    if (next.dm !== undefined) payload.notify_dm = next.dm;
    if (next.inv !== undefined) payload.notify_invitations = next.inv;
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    setSavingPrefs(false);
    if (error) {
      toast({ title: 'تعذر حفظ التفضيلات', description: error.message, variant: 'destructive' });
      // revert
      if (next.dm !== undefined) setNotifyDm(!next.dm);
      if (next.inv !== undefined) setNotifyInv(!next.inv);
    }
  };

  const handleChangePassword = async () => {
    if (!strongPwd(newPassword)) {
      toast({
        title: 'كلمة المرور ضعيفة',
        description: 'يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير وصغير ورقم.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) {
      toast({ title: 'تعذر تغيير كلمة المرور', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم تغيير كلمة المرور بنجاح' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({ title: 'تعذر إرسال رابط الاستعادة', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني' });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background" dir="rtl">
      <Helmet>
        <title>الإعدادات | أزهري</title>
        <meta name="description" content="إدارة حساب أزهري: تعديل الملف الشخصي، كلمة المرور، والإشعارات." />
      </Helmet>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة حسابك وتفضيلاتك</p>
        </header>

        {/* Notification center */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              مركز الإشعارات
            </CardTitle>
            <CardDescription>تحكّم في الإشعارات التي تصلك في الوقت الحقيقي.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">الإشعارات غير المقروءة</p>
                <p className="text-xs text-muted-foreground">اطّلع على آخر التنبيهات والمنشورات.</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
                <Button size="sm" variant="outline" onClick={() => navigate('/notifications')}>
                  فتح
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <Label htmlFor="notify-dm" className="text-sm font-semibold">إشعارات الرسائل المباشرة</Label>
                <p className="text-xs text-muted-foreground">تلقّي تنبيه فوري عند وصول رسالة خاصة جديدة.</p>
              </div>
              <Switch
                id="notify-dm"
                checked={notifyDm}
                disabled={savingPrefs}
                onCheckedChange={(v) => { setNotifyDm(v); handleSavePrefs({ dm: v }); }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <Label htmlFor="notify-inv" className="text-sm font-semibold">إشعارات الدعوات</Label>
                <p className="text-xs text-muted-foreground">تلقّي تنبيه فوري عند استلام دعوة جديدة.</p>
              </div>
              <Switch
                id="notify-inv"
                checked={notifyInv}
                disabled={savingPrefs}
                onCheckedChange={(v) => { setNotifyInv(v); handleSavePrefs({ inv: v }); }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              الملف الشخصي
            </CardTitle>
            <CardDescription>
              يمكن تغيير الاسم واسم المستخدم مرة واحدة كل 60 يومًا.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border border-border">
                  <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
                  <AvatarFallback>{getInitials(fullName || 'U')}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleAvatarPick}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -left-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow disabled:opacity-60"
                  aria-label="تغيير الصورة"
                >
                  {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>الصورة الشخصية</p>
                <p className="text-xs">PNG أو JPG، حتى 5MB.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" value={user?.email ?? ''} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {nameLocked && (
                <p className="text-xs text-destructive">يمكنك تغيير الاسم مرة أخرى بعد {nameCooldownDays} يومًا.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {usernameLocked && (
                <p className="text-xs text-destructive">يمكنك تغيير اسم المستخدم مرة أخرى بعد {usernameCooldownDays} يومًا.</p>
              )}
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || (!nameChanged && !usernameChanged) || nameLocked || usernameLocked}
              className="gap-2"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              كلمة المرور
            </CardTitle>
            <CardDescription>
              يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير وصغير ورقم.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_pwd">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="new_pwd"
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 left-2 my-auto text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_pwd">تأكيد كلمة المرور</Label>
              <Input
                id="confirm_pwd"
                type={showPwd ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleChangePassword} disabled={savingPwd || !newPassword} className="gap-2">
                {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                تحديث كلمة المرور
              </Button>
              <Button variant="outline" onClick={handleResetPassword}>
                إرسال رابط إعادة التعيين
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المظهر</CardTitle>
            <CardDescription>اختر المظهر الفاتح أو الداكن.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>القانوني</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/privacy">سياسة الخصوصية</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/terms">شروط الاستخدام</Link>
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <Button variant="destructive" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
};

export default Settings;
