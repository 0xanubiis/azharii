import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/supabase';
import { BanNotificationDialog } from '@/components/ModerationDialog';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscribedUidRef = useRef<string | null>(null);
  const lastKickedAtRef = useRef<string | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState<string | undefined>();

  const enforceModeration = async (p: Profile | null) => {
    if (!p) return false;
    // Banned: show dialog and force sign out
    if (p.banned_at) {
      setBanReason(p.ban_reason || undefined);
      setShowBanDialog(true);
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
    if (subscribedUidRef.current === uid && profileChannelRef.current) return;
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current);
      profileChannelRef.current = null;
    }
    subscribedUidRef.current = uid;
    const ch = supabase
      .channel(`profile-${uid}-${Math.random().toString(36).slice(2, 10)}`)
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
        subscribedUidRef.current = null;
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

  return { user, session, profile, loading, signOut, BanNotificationComponent: (
    <BanNotificationDialog
      open={showBanDialog}
      reason={banReason}
      onSignOut={() => setShowBanDialog(false)}
    />
  ) };
};
