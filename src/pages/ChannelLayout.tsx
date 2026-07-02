import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu, Loader2 } from 'lucide-react';

const ChannelLayout = () => {
  const navigate = useNavigate();
  const { user, profile, loading, BanNotificationComponent } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
    } else if (profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="h-screen w-full flex bg-background overflow-hidden" dir="rtl">
        {/* Desktop / tablet sidebar */}
        <aside className="hidden md:flex w-64 lg:w-72 flex-shrink-0 border-l border-sidebar-border bg-sidebar">
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="right"
            className="p-0 w-[85vw] max-w-[320px] bg-sidebar border-l border-sidebar-border flex flex-col"
          >
            <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
            <SheetDescription className="sr-only">التنقل بين الأقسام والقنوات</SheetDescription>
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col bg-background">
          <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-3 md:px-5 gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="فتح القائمة"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg md:text-xl font-bold text-primary font-serif tracking-wide">
              أزهري
            </h1>
            <div className="ms-auto flex items-center gap-1">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 min-h-0 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
      {BanNotificationComponent}
    </>
  );
};

export default ChannelLayout;
