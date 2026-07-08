import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Helmet>
        <title>سياسة الخصوصية | أزهري</title>
        <meta
          name="description"
          content="سياسة الخصوصية لمنصة أزهري: كيف نجمع ونستخدم ونحمي بيانات طلاب جامعة الأزهر."
        />
        <link rel="canonical" href="https://azharii.lovable.app/privacy" />
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
        <h2 className="text-3xl font-bold font-serif text-primary">سياسة الخصوصية</h2>
        <p className="text-sm text-muted-foreground">آخر تحديث: يوليو 2026</p>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">1. المعلومات التي نجمعها</h3>
          <p>
            نقوم بجمع المعلومات التي تقدمها عند إنشاء حسابك (الاسم، اسم المستخدم، البريد الإلكتروني،
            النوع، الكلية، القسم، والمحافظة) بالإضافة إلى محتوى الرسائل والملفات التي ترفعها لاستخدام
            المنصة.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">2. استخدام المعلومات</h3>
          <p>
            تُستخدم بياناتك لتوفير خدمات المنصة، توجيهك إلى قنوات كليتك وقسمك، تفعيل الرسائل الخاصة،
            تحسين تجربة الاستخدام، وضمان الالتزام بشروط الاستخدام.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">3. مشاركة البيانات</h3>
          <p>
            لا نبيع أو نشارك بياناتك الشخصية مع أي طرف ثالث. تظهر معلوماتك العامة (الاسم، اسم المستخدم،
            الكلية، القسم) فقط لأعضاء المنصة المخوّلين.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">4. الأمان</h3>
          <p>
            نستخدم آليات مصادقة آمنة وتشفير للاتصال. يتم تطبيق سياسات صارمة على مستوى قاعدة البيانات
            للحد من الوصول إلى بياناتك. أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">5. الاحتفاظ بالبيانات</h3>
          <p>
            نحتفظ ببياناتك طالما بقي حسابك مفعّلاً. يمكنك طلب حذف حسابك في أي وقت من خلال التواصل مع
            إدارة المنصة.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">6. حقوقك</h3>
          <p>
            يحق لك الوصول إلى بياناتك، تصحيحها، أو طلب حذفها. للتواصل بشأن أي طلب متعلق بالخصوصية، يرجى
            مراسلة إدارة المنصة.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold">7. التعديلات</h3>
          <p>
            قد نقوم بتحديث هذه السياسة من وقت لآخر. سيتم إعلامك بأي تغييرات جوهرية عبر المنصة.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Privacy;
