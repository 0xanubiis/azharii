import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';

const Splash = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // If we already know the user, redirect immediately to avoid a blank/splash flash
    // on tab refocus or back-navigation.
    const delay = user && profile ? 0 : 600;
    const timer = setTimeout(() => {
      if (!user) navigate('/auth', { replace: true });
      else if (profile && !profile.onboarding_completed) navigate('/onboarding', { replace: true });
      else if (profile) navigate('/home', { replace: true });
    }, delay);
    return () => clearTimeout(timer);
  }, [user, profile, loading, navigate]);

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
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 gradient-brand opacity-10" aria-hidden="true" />
        <div
          className="absolute inset-0 islamic-pattern text-primary opacity-[0.06]"
          aria-hidden="true"
        />

        <div className="relative z-10 text-center px-6 animate-in fade-in zoom-in-95 duration-700">
          <div className="mx-auto mb-8 w-24 h-24 rounded-3xl gradient-brand flex items-center justify-center shadow-elevated">
            <span className="text-4xl font-bold text-primary-foreground font-serif">أ</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif text-balance">
            أزهري — منصة التواصل لطلاب جامعة الأزهر
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto text-balance">
            تواصل مع زملائك في الكلية والقسم، وشارك ملفاتك الدراسية بسهولة.
          </p>
          <div className="mt-10 inline-flex">
            <div
              className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin"
              role="status"
              aria-label="جارٍ التحميل"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Splash;
