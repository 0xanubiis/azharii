import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const storageKey = (userId: string) => `dm-last-seen-${userId}`;

const readSeen = (userId: string): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '{}');
  } catch {
    return {};
  }
};

const writeSeen = (userId: string, map: Record<string, string>) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

export const markDMChannelSeen = (userId: string, dmChannelId: string) => {
  const map = readSeen(userId);
  map[dmChannelId] = new Date().toISOString();
  writeSeen(userId, map);
  window.dispatchEvent(new CustomEvent('dm-seen-changed'));
};

export const useUnreadDMs = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const recompute = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const { data: channels } = await supabase
      .from('dm_channels')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    if (!channels?.length) {
      setUnreadCount(0);
      return;
    }
    const seen = readSeen(user.id);
    let total = 0;
    await Promise.all(
      channels.map(async (c) => {
        const since = seen[c.id];
        let q = supabase
          .from('dm_messages')
          .select('id', { count: 'exact', head: true })
          .eq('dm_channel_id', c.id)
          .neq('sender_id', user.id);
        if (since) q = q.gt('created_at', since);
        const { count } = await q;
        if (count && count > 0) total += 1;
      }),
    );
    setUnreadCount(total);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    recompute();

    const channel = supabase
      .channel(`dm-unread-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages' },
        (payload) => {
          if ((payload.new as any).sender_id !== user.id) recompute();
        },
      )
      .subscribe();

    const onSeen = () => recompute();
    window.addEventListener('dm-seen-changed', onSeen);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('dm-seen-changed', onSeen);
    };
  }, [user?.id, recompute]);

  return { unreadCount };
};
