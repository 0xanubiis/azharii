import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Splash = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (!user) {
        navigate('/auth');
      } else if (profile && !profile.onboarding_completed) {
        navigate('/onboarding');
      } else if (profile) {
        navigate('/home');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-background to-accent relative overflow-hidden">
      {/* Islamic pattern background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l4 8-4 8-4-8zM0 30l8-4 8 4-8 4zM60 30l-8-4-8 4 8 4zM30 60l-4-8 4-8 4 8z' fill='%23000' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="text-center z-10 animate-in fade-in duration-1000">
        <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4 font-serif">
          أزهري
        </h1>
        <p className="text-2xl md:text-3xl text-muted-foreground font-sans">
          Al-Zahra
        </p>
        <div className="mt-8">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default Splash;
