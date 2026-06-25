import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Hash, MessageSquare, Bell, Users, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/initials';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NavLink } from 'react-router-dom';

const Home = () => {
  const { profile } = useAuth();

  const quickLinks = [
    { to: '/dm', icon: MessageSquare, label: 'المحادثات الخاصة', desc: 'تحدث مع زملائك المقبولين' },
    { to: '/invitations', icon: Users, label: 'الدعوات', desc: 'أرسل أو اقبل طلبات التواصل' },
    { to: '/notifications', icon: Bell, label: 'الإشعارات', desc: 'إشاراتك وردود زملائك' },
  ];

  return (
    <>
      <Helmet>
        <title>الصفحة الرئيسية | أزهري</title>
        <meta
          name="description"
          content="مرحباً بك في أزهري — اختر قناة كليتك أو قسمك وابدأ التواصل مع زملائك في جامعة الأزهر."
        />
        <link rel="canonical" href="https://azharii.lovable.app/home" />
      </Helmet>
      <div className="h-full overflow-y-auto" dir="rtl">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl gradient-brand text-primary-foreground p-6 md:p-10 shadow-elevated">
            <div className="absolute inset-0 islamic-pattern opacity-10" aria-hidden="true" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <Avatar className="h-16 w-16 ring-4 ring-white/30">
                <AvatarFallback className="bg-white/20 text-primary-foreground text-xl font-bold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm opacity-90 mb-1">السلام عليكم،</p>
                <h1 className="text-2xl md:text-3xl font-bold font-serif text-balance">
                  أهلًا {profile?.full_name || 'بك'} في أزهري
                </h1>
                <p className="text-sm md:text-base opacity-90 mt-2 text-balance">
                  اختر قناة من القائمة الجانبية للبدء، أو استكشف ما هو جديد بالأسفل.
                </p>
              </div>
            </div>
          </section>

          {/* Quick links */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              ابدأ من هنا
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickLinks.map(({ to, icon: Icon, label, desc }) => (
                <NavLink
                  key={to}
                  to={to}
                  className="group block rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-elevated transition-all p-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{label}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </NavLink>
              ))}
            </div>
          </section>

          {/* Tips */}
          <Card className="p-6 bg-card/60">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              نصائح للاستخدام
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span> القنوات العامة للتواصل مع جميع طلاب الكلية.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span> قنوات القسم خاصة بطلاب قسمك فقط.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span> القنوات الرسمية للإعلانات الإدارية.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span> استخدم{' '}
                <span className="font-semibold text-primary">@</span> للإشارة إلى زميل.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Home;
