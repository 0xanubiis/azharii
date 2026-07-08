import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LogOut, Save, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const strongPwd = (pw: string) =>
    pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!fullName.trim() || !username.trim()) {
      toast({ title: 'الرجاء إدخال جميع الحقول', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), username: username.trim() })
      .eq('id', user.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: 'تعذر حفظ التغييرات', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم حفظ التغييرات بنجاح' });
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

  return (
    <div className="h-full overflow-y-auto bg-background" dir="rtl">
      <Helmet>
        <title>الإعدادات | أزهري</title>
        <meta name="description" content="إدارة حساب أزهري: تعديل الملف الشخصي، كلمة المرور، والمظهر." />
      </Helmet>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة حسابك وتفضيلاتك</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              الملف الشخصي
            </CardTitle>
            <CardDescription>حدّث اسمك واسم المستخدم الخاص بك.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

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
            <Button onClick={handleChangePassword} disabled={savingPwd || !newPassword} className="gap-2">
              {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              تحديث كلمة المرور
            </Button>
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
