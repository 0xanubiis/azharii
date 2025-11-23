import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Home = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (profile && !profile.onboarding_completed) {
        navigate('/onboarding');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" dir="rtl">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3">
            <SidebarTrigger className="lg:hidden">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-xl font-bold text-primary font-serif">أزهري</h1>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-6 max-w-4xl">
              <Card className="p-8 text-center">
                <div 
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l4 8-4 8-4-8zM0 30l8-4 8 4-8 4zM60 30l-8-4-8 4 8 4zM30 60l-4-8 4-8 4 8z' fill='%23047857' fill-opacity='0.1'/%3E%3C/svg%3E")`,
                  }}
                >
                  <span className="text-4xl font-serif text-primary">أزهري</span>
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  مرحباً بك في تطبيق جامعة الأزهر
                </h2>
                <p className="text-muted-foreground mb-6">
                  اختر قناة من القائمة الجانبية للبدء في التواصل مع زملائك
                </p>
                <div className="bg-accent/10 rounded-lg p-4 text-sm text-right">
                  <h3 className="font-semibold mb-2">💡 نصائح للاستخدام:</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• استخدم القنوات العامة للتواصل مع جميع طلاب الكلية</li>
                    <li>• قنوات القسم خاصة بطلاب قسمك فقط</li>
                    <li>• القنوات الرسمية للإعلانات الإدارية</li>
                    <li>• يمكنك دعوة زملائك للمحادثات الخاصة</li>
                  </ul>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Home;
