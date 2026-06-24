import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';

const Home = () => {
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
      <div className="h-full overflow-y-auto bg-background p-6" dir="rtl">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-8 text-center">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l4 8-4 8-4-8zM0 30l8-4 8 4-8 4zM60 30l-8-4-8 4 8 4zM30 60l-4-8 4-8 4 8z' fill='%23047857' fill-opacity='0.1'/%3E%3C/svg%3E")`,
              }}
              aria-hidden="true"
            >
              <span className="text-4xl font-serif text-primary">أزهري</span>
            </div>
            <h1 className="text-2xl font-bold mb-3">
              مرحباً بك في أزهري — منصة التواصل لطلاب جامعة الأزهر
            </h1>
            <p className="text-muted-foreground mb-6">
              اختر قناة من القائمة الجانبية للبدء في التواصل مع زملائك
            </p>
            <div className="bg-accent/10 rounded-lg p-4 text-sm text-right">
              <h2 className="font-semibold mb-2">نصائح للاستخدام</h2>
              <ul className="space-y-1 text-muted-foreground">
                <li>• استخدم القنوات العامة للتواصل مع جميع طلاب الكلية</li>
                <li>• قنوات القسم خاصة بطلاب قسمك فقط</li>
                <li>• القنوات الرسمية للإعلانات الإدارية</li>
                <li>• يمكنك دعوة زملائك للمحادثات الخاصة</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Home;
