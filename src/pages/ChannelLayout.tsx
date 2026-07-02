import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Menu, Loader2, X } from 'lucide-react';

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

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="h-dvh min-h-screen w-full flex bg-background overflow-hidden" dir="rtl">
        {/* Desktop / tablet sidebar */}
        <aside className="hidden md:flex w-64 lg:w-72 flex-shrink-0 border-l border-sidebar-border bg-sidebar">
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-sidebar-title">
            <button
              type="button"
              aria-label="إغلاق القائمة"
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 right-0 z-10 flex h-dvh w-[min(86vw,320px)] flex-col border-l border-sidebar-border bg-sidebar shadow-elevated">
              <h2 id="mobile-sidebar-title" className="sr-only">القائمة الجانبية</h2>
              <p className="sr-only">التنقل بين الأقسام والقنوات</p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-3 z-20 h-8 w-8 text-muted-foreground"
                aria-label="إغلاق القائمة"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <AppSidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

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
