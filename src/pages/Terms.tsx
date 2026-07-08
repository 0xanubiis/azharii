import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Helmet>
        <title>شروط الاستخدام | أزهري</title>
        <meta
          name="description"
          content="شروط استخدام منصة أزهري لطلاب جامعة الأزهر: القواعد، السلوك المقبول، والمسؤوليات."
        />
        <link rel="canonical" href="https://azharii.lovable.app/terms" />
      </Helmet>

      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between p-4">
          <h1 className="text-xl font-bold font-serif text-primary">أزهري</h1>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/">
              <ArrowRight className="h-4 w-4" />
              الرئيسية
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6 leading-relaxed">
        <h2 className="text-3xl font-bold font-serif text-primary">شروط الاستخدام</h2>
        <p className="text-sm text-muted-foreground">آخر تحديث: يوليو 2026</p>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">1. القبول بالشروط</h3>
          <p>
            باستخدامك لمنصة أزهري فإنك توافق على الالتزام بهذه الشروط. إذا لم توافق فلا يجوز لك استخدام
            المنصة.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">2. الأهلية</h3>
          <p>
            المنصة مخصصة لطلاب جامعة الأزهر. يجب أن تكون المعلومات التي تقدمها صحيحة ومحدّثة، بما في
            ذلك كليتك وقسمك ومحافظتك.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">3. السلوك المقبول</h3>
          <ul className="list-disc pr-6 space-y-1">
            <li>احترام جميع المستخدمين وعدم استخدام لغة مسيئة.</li>
            <li>الالتزام بالقيم الإسلامية والأخلاقية في جميع التفاعلات.</li>
            <li>عدم نشر محتوى غير قانوني أو مخالف للآداب العامة.</li>
            <li>عدم إرسال دعوات أو رسائل إلى أعضاء من الجنس الآخر.</li>
            <li>عدم انتحال شخصية أي مستخدم أو جهة أخرى.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">4. المحتوى</h3>
          <p>
            أنت المسؤول الوحيد عن أي محتوى تنشره أو ترفعه. تحتفظ إدارة المنصة بالحق في حذف أي محتوى
            يخالف هذه الشروط، وتطبيق عقوبات تشمل التحذير، التعليق المؤقت، أو الحظر الدائم.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">5. الحساب والأمان</h3>
          <p>
            أنت مسؤول عن الحفاظ على سرية بيانات تسجيل دخولك. أي نشاط يتم من حسابك يُعتبر صادراً عنك.
            يُرجى إبلاغنا فوراً عند الاشتباه في أي استخدام غير مصرّح.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">6. إيقاف الخدمة</h3>
          <p>
            نحتفظ بالحق في تعليق أو إنهاء حسابك في أي وقت إذا خالفت هذه الشروط أو تصرفت بشكل يضر
            بالمجتمع.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">7. إخلاء المسؤولية</h3>
          <p>
            تُقدَّم المنصة "كما هي" دون أي ضمانات صريحة أو ضمنية. لا نتحمل مسؤولية أي أضرار ناتجة عن
            استخدامك للمنصة أو انقطاعها.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">8. التعديلات</h3>
          <p>قد يتم تحديث هذه الشروط من وقت لآخر، ويعتبر استمرار استخدامك للمنصة موافقةً على التحديثات.</p>
        </section>
      </main>
    </div>
  );
};

export default Terms;
