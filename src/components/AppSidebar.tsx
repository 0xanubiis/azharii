import { useEffect, useState } from 'react';
import {
  Hash,
  Volume2,
  Video,
  Bell,
  Users,
  LogOut,
  ChevronDown,
  MessageSquare,
  Shield,
  ShieldCheck,
  Home as HomeIcon,
  Settings,
  Loader2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useUnreadDMs } from '@/hooks/useUnreadDMs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getInitials } from '@/lib/initials';

type ChannelRow = {
  id: string;
  name_ar: string;
  type: 'text' | 'voice' | 'video';
  is_official: boolean;
  department_id: string | null;
};

type ChannelGroup = { title: string; channels: ChannelRow[] };

type Props = { onNavigate?: () => void };

export function AppSidebar({ onNavigate }: Props) {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount } = useUnreadNotifications();
  const { unreadCount: unreadDMs } = useUnreadDMs();
  const [isAdmin, setIsAdmin] = useState(false);
  const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>([]);
  const [collegeInfo, setCollegeInfo] = useState({ name: '', department: '' });
  const [channelsLoading, setChannelsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSidebar = async () => {
      setChannelsLoading(true);
      await Promise.all([fetchChannels(), fetchCollegeInfo(), checkAdminStatus()]);
      if (active) setChannelsLoading(false);
    };

    loadSidebar();

    const ch = profile?.college_id
      ? supabase
          .channel(`sidebar-channels-${profile.id}-${Date.now()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'channels' },
            () => fetchChannels(),
          )
          .subscribe()
      : null;

    return () => {
      active = false;
      if (ch) supabase.removeChannel(ch);
    };
  }, [profile?.id, profile?.college_id, profile?.department_id, profile?.location_id, profile?.gender, user?.id]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    setIsAdmin(!!data);
  };

  const fetchCollegeInfo = async () => {
    if (!profile?.college_id || !profile?.department_id) {
      setCollegeInfo({ name: '', department: '' });
      return;
    }
    const { data: college } = await supabase
      .from('colleges')
      .select('name_ar')
      .eq('id', profile.college_id)
      .maybeSingle();
    const { data: department } = await supabase
      .from('departments')
      .select('name_ar')
      .eq('id', profile.department_id)
      .maybeSingle();
    if (college && department) {
      setCollegeInfo({ name: college.name_ar, department: department.name_ar });
    }
  };

  // Build a Supabase filter that matches the user's profile on a scoping field
  // (column must be NULL or equal to the profile's value).
  const scopeOr = (col: string, val: string | null | undefined) =>
    val ? `${col}.is.null,${col}.eq.${val}` : `${col}.is.null`;

  const fetchChannels = async () => {
    if (!profile?.college_id || !profile?.department_id) {
      setChannelGroups([]);
      return;
    }

    const applyScope = (q: any) =>
      q
        .or(scopeOr('location_id', profile.location_id))
        .or(scopeOr('gender', profile.gender));

    const { data: collegeChannels } = await applyScope(
      supabase
        .from('channels')
        .select('*')
        .eq('college_id', profile.college_id)
        .is('department_id', null),
    ).order('is_official', { ascending: false });

    const { data: departmentChannels } = await applyScope(
      supabase
        .from('channels')
        .select('*')
        .eq('department_id', profile.department_id),
    ).order('type');

    const groups: ChannelGroup[] = [];
    if (collegeChannels?.length) {
      groups.push({ title: 'قنوات الكلية', channels: collegeChannels as ChannelRow[] });
    }
    if (departmentChannels) {
      const text = departmentChannels.filter((c: any) => c.type === 'text');
      if (text.length) groups.push({ title: 'القنوات النصية', channels: text as ChannelRow[] });
    }
    setChannelGroups(groups);
  };

  const getChannelIcon = (type: string) => {
    if (type === 'voice') return <Volume2 className="h-4 w-4 flex-shrink-0" />;
    if (type === 'video') return <Video className="h-4 w-4 flex-shrink-0" />;
    return <Hash className="h-4 w-4 flex-shrink-0" />;
  };

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    { path: '/home', label: 'الرئيسية', icon: HomeIcon },
    { path: '/notifications', label: 'الإشعارات', icon: Bell, badge: unreadCount },
    { path: '/invitations', label: 'الدعوات', icon: Users },
    { path: '/dm', label: 'المحادثات الخاصة', icon: MessageSquare, badge: unreadDMs },
    { path: '/settings', label: 'الإعدادات', icon: Settings },
    ...(isAdmin ? [{ path: '/admin', label: 'لوحة التحكم', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="flex flex-col h-full w-full text-sidebar-foreground">
      {/* Header — college/department */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <h2 className="text-base font-bold font-serif text-primary truncate">
          {collegeInfo.name || 'أزهري'}
        </h2>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {collegeInfo.department || 'منصة طلاب الأزهر'}
        </p>
      </div>

      {/* Nav + channels scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-4">
        {/* Primary nav */}
        <nav className="space-y-0.5">
          {navItems.map(({ path, label, icon: Icon, badge }) => (
            <button
              key={path}
              onClick={() => go(path)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-medium transition-colors group ${
                isActive(path)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-right truncate">{label}</span>
              {!!badge && badge > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">
                  {badge > 99 ? '99+' : badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Channel groups */}
        {channelsLoading ? (
          <div className="space-y-2 px-2" aria-label="جاري تحميل القنوات">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>جاري تحميل القنوات</span>
            </div>
            <div className="h-8 rounded-md bg-sidebar-accent/50" />
            <div className="h-8 rounded-md bg-sidebar-accent/40" />
            <div className="h-8 rounded-md bg-sidebar-accent/30" />
          </div>
        ) : channelGroups.length === 0 ? (
          <div className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            ستظهر قنوات كليتك وقسمك هنا فور تجهيز حسابك.
          </div>
        ) : channelGroups.map((group, idx) => (
          <Collapsible key={idx} defaultOpen>
            <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group">
              <span className="font-semibold">{group.title}</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-0.5">
              {group.channels.map((channel) => {
                const active = pathname === `/channel/${channel.id}`;
                return (
                  <button
                    key={channel.id}
                    onClick={() => go(`/channel/${channel.id}`)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    {getChannelIcon(channel.type)}
                    <span className="flex-1 text-right truncate">{channel.name_ar}</span>
                    {channel.is_official && (
                      <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-semibold">
                        رسمي
                      </span>
                    )}
                  </button>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* User card footer */}
      <div className="border-t border-sidebar-border p-2 bg-sidebar-accent/30">
        <div className="flex items-center gap-2 px-1">
          <Avatar className="h-9 w-9 ring-2 ring-primary/30">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.full_name || 'مستخدم'}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              @{profile?.username || '—'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={signOut}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
