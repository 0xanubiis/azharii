import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastKickedAtRef = useRef<string | null>(null);

  const enforceModeration = async (p: Profile | null) => {
    if (!p) return false;
    // Banned: force sign out
    if (p.banned_at) {
      const reason = p.ban_reason ? `\n${p.ban_reason}` : '';
      // eslint-disable-next-line no-alert
      alert(`تم حظر حسابك من المنصة.${reason}`);
      await supabase.auth.signOut();
      return true;
    }
    // Kicked: sign out once per kicked_at value
    if (p.kicked_at && p.kicked_at !== lastKickedAtRef.current) {
      lastKickedAtRef.current = p.kicked_at;
      await supabase.auth.signOut();
      return true;
    }
    return false;
  };

  const subscribeProfile = (uid: string) => {
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current);
      profileChannelRef.current = null;
    }
    const ch = supabase
      .channel(`profile-${uid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
        async (payload) => {
          const next = payload.new as Profile;
          setProfile(next);
          await enforceModeration(next);
        },
      )
      .subscribe();
    profileChannelRef.current = ch;
  };

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    const p = (data as Profile) ?? null;
    setProfile(p);
    if (p?.kicked_at) lastKickedAtRef.current = p.kicked_at;
    await enforceModeration(p);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          loadProfile(session.user.id);
          subscribeProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        lastKickedAtRef.current = null;
        if (profileChannelRef.current) {
          supabase.removeChannel(profileChannelRef.current);
          profileChannelRef.current = null;
        }
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
        subscribeProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current);
        profileChannelRef.current = null;
      }
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return { user, session, profile, loading, signOut };
};
