import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/supabase';
import { BanNotificationDialog } from '@/components/ModerationDialog';

const PROFILE_COLUMNS =
  'id, full_name, username, gender, college_id, department_id, location_id, avatar_url, onboarding_completed, created_at, updated_at, last_name_change_at, last_username_change_at, notify_dm, notify_invitations';


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
        async () => {
          // Re-read through the privilege-aware path instead of trusting the payload.
          await loadProfile(uid);
        },
      )
      .subscribe();
    profileChannelRef.current = ch;
  };

  const loadProfile = async (uid: string) => {
    // Moderation columns are admin-only at the database level; the signed-in
    // user reads their own status through a dedicated secure function.
    const [{ data }, { data: mod }] = await Promise.all([
      supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', uid).maybeSingle(),
      supabase.rpc('my_moderation_status'),
    ]);
    const moderation = Array.isArray(mod) ? (mod[0] ?? {}) : (mod ?? {});
    const p = data ? ({ ...(data as any), ...(moderation as any) } as Profile) : null;
    setProfile(p);
    if (p?.kicked_at) lastKickedAtRef.current = p.kicked_at;
    await enforceModeration(p);
  };


  useEffect(() => {
    let active = true;

    const clearProfileSubscription = () => {
      subscribedUidRef.current = null;
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current);
        profileChannelRef.current = null;
      }
    };

    const hydrateSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const currentSession = data.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
        if (!active) return;
        subscribeProfile(currentSession.user.id);
      } else {
        setProfile(null);
        clearProfileSubscription();
      }

      if (active) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          if (!active) return;
          loadProfile(session.user.id).finally(() => active && setLoading(false));
          subscribeProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        lastKickedAtRef.current = null;
        clearProfileSubscription();
        setLoading(false);
      }
    });

    hydrateSession().catch(() => active && setLoading(false));

    return () => {
      active = false;
      subscription.unsubscribe();
      clearProfileSubscription();
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
