import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ShieldCheck, Users, MessageSquare, BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const Landing = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { hasRole } = useUserRoles();

  useEffect(() => {
    if (loading) return;
    if (user && profile) {
      if (!profile.onboarding_completed) navigate('/onboarding', { replace: true });
      else navigate(hasRole('admin') ? '/admin' : '/home', { replace: true });
    }
  }, [user, profile, loading, hasRole, navigate]);

  return (
    <>
      <Helmet>
        <title>أزهري | منصة التواصل لطلاب جامعة الأزهر</title>
        <meta
          name="description"
          content="أزهري — منصة تواصل اجتماعية لطلاب جامعة الأزهر: قنوات الكليات والأقسام، الرسائل الخاصة، ومشاركة الملفات الدراسية."
        />
        <link rel="canonical" href="https://azharii.lovable.app/" />
        <meta property="og:title" content="أزهري | منصة التواصل لطلاب جامعة الأزهر" />
        <meta property="og:url" content="https://azharii.lovable.app/" />
      </Helmet>

      <div className="min-h-screen bg-background relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 gradient-brand opacity-[0.08]" aria-hidden="true" />
        <div className="absolute inset-0 islamic-pattern text-primary opacity-[0.05]" aria-hidden="true" />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between p-4 md:p-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl gradient-brand flex items-center justify-center shadow-elevated">
              <span className="text-xl font-bold text-primary-foreground font-serif">أ</span>
            </div>
            <span className="text-xl font-bold font-serif text-primary">أزهري</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-8 md:pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            منصة رسمية لطلاب جامعة الأزهر
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-serif leading-tight text-balance text-primary">
            تواصل مع زملائك في الكلية والقسم
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            قنوات كليتك وقسمك، رسائل خاصة، إعلانات رسمية، ومشاركة الملفات الدراسية — في مكان واحد آمن ومخصص لك.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Button asChild size="lg" className="w-full sm:w-auto min-w-[180px] text-base">
              <Link to="/auth?mode=signup">إنشاء حساب جديد</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto min-w-[180px] text-base">
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
            {[
              { icon: ShieldCheck, title: 'بيئة آمنة', desc: 'قنوات محدودة لطلاب قسمك ومحافظتك.' },
              { icon: MessageSquare, title: 'دردشة فورية', desc: 'رسائل مباشرة، ردود، وإعادة توجيه.' },
              { icon: Users, title: 'زملاء القسم', desc: 'تواصل مع زملائك في نفس الكلية والقسم.' },
              { icon: BookOpen, title: 'ملفات دراسية', desc: 'شارك الملخصات والمحاضرات بسهولة.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold font-serif mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </main>

        <footer className="relative z-10 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} أزهري — جميع الحقوق محفوظة
        </footer>
      </div>
    </>
  );
};

export default Landing;
