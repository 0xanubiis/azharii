import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export const useUserRoles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRoles = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (cancelled) return;
      setRoles(data ? data.map((r: any) => r.role) : []);
      setLoading(false);
    };

    fetchRoles();

    // Realtime: refresh roles the instant admin assigns/removes a role
    const channel = supabase
      .channel(`user-roles-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchRoles()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const hasRole = (role: string) => roles.includes(role);

  return { roles, hasRole, loading };
};
