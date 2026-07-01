import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShieldCheck, Users, MessageSquare, ArrowRight } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const { toast } = useToast();
  const { hasRole } = useUserRoles();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', data.user.id)
          .maybeSingle();
        
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        const isAdmin = userRoles?.some(r => r.role === 'admin');
        
        if (!profile?.onboarding_completed) {
          navigate('/onboarding');
        } else if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: error.message || 'حدث خطأ أثناء تسجيل الدخول',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: signupFullName, username: signupUsername },
        },
      });
      if (error) throw error;
      toast({ title: 'تم إنشاء الحساب بنجاح', description: 'مرحباً بك في أزهري!' });
      if (data.user) navigate('/onboarding');
    } catch (error: any) {
      const raw = error?.message || error?.error_description || error?.msg || '';
      const code = error?.code || error?.status;
      let description = raw || 'حدث خطأ أثناء إنشاء الحساب';
      if (/already registered|already exists|duplicate/i.test(raw) || code === 'user_already_exists') {
        description = 'هذا البريد الإلكتروني مسجل بالفعل. جرّب تسجيل الدخول.';
      } else if (/password/i.test(raw)) {
        description = 'كلمة المرور ضعيفة. استخدم ٨ خانات على الأقل مع أرقام وحروف.';
      } else if (/invalid.*email/i.test(raw)) {
        description = 'صيغة البريد الإلكتروني غير صحيحة.';
      } else if (!raw) {
        description = 'تعذّر إنشاء الحساب. تأكد من البريد وكلمة المرور وحاول مجدداً.';
      }
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء الحساب',
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول وإنشاء حساب | أزهري</title>
        <meta
          name="description"
          content="سجّل دخولك إلى أزهري أو أنشئ حسابك الجديد للانضمام إلى مجتمع طلاب جامعة الأزهر."
        />
        <link rel="canonical" href="https://azharii.lovable.app/auth" />
        <meta property="og:title" content="تسجيل الدخول وإنشاء حساب | أزهري" />
        <meta property="og:url" content="https://azharii.lovable.app/auth" />
      </Helmet>

      <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background" dir="rtl">
        {/* Brand panel — hidden on mobile */}
        <aside className="hidden lg:flex relative overflow-hidden gradient-brand text-primary-foreground p-12 flex-col justify-between">
          <div className="absolute inset-0 islamic-pattern opacity-15" aria-hidden="true" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-serif text-2xl font-bold">
                أ
              </div>
              <span className="text-2xl font-bold font-serif">أزهري</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 font-serif leading-tight text-balance">
              منصة التواصل الرسمية لطلاب جامعة الأزهر
            </h2>
            <p className="text-lg text-primary-foreground/90 max-w-md text-balance">
              قنوات الكلية، رسائل خاصة، إعلانات رسمية، ومشاركة الملفات الدراسية في مكان واحد.
            </p>
          </div>

          <ul className="relative z-10 space-y-3 text-sm">
            {[
              { icon: ShieldCheck, label: 'بيئة آمنة محدودة لطلاب قسمك فقط' },
              { icon: MessageSquare, label: 'دردشة فورية، ردود، وإعادة توجيه' },
              { icon: Users, label: 'تواصل مع زملائك ومشاركة الملفات' },
            ].map(({ icon: Icon, label }, i) => (
              <li key={i} className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Form panel */}
        <section className="flex items-center justify-center p-4 md:p-8 relative">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Button>
            <ThemeToggle />
          </div>
          <Card className="w-full max-w-md border-border/60 shadow-elevated">
            <CardHeader className="text-center space-y-2">
              <div className="lg:hidden mx-auto mb-2 w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground font-serif text-2xl font-bold">
                أ
              </div>
              <CardTitle className="text-2xl font-serif text-primary">أهلًا بك في أزهري</CardTitle>
              <CardDescription>سجّل دخولك أو أنشئ حسابًا جديدًا للبدء</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} dir="rtl">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">البريد الإلكتروني</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@azhar.edu.eg"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">كلمة المرور</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري تسجيل الدخول…' : 'تسجيل الدخول'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-fullname">الاسم الكامل</Label>
                      <Input
                        id="signup-fullname"
                        type="text"
                        placeholder="محمد أحمد"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">اسم المستخدم</Label>
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="mohamed_ahmed"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="example@azhar.edu.eg"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">كلمة المرور</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="٨ خانات على الأقل"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري إنشاء الحساب…' : 'إنشاء حساب جديد'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
};

export default Auth;
