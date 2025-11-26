import { useEffect, useState } from 'react';
import { Hash, Volume2, Video, Bell, Users, LogOut, ChevronDown, MessageSquare, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type Channel = {
  id: string;
  name_ar: string;
  type: 'text' | 'voice' | 'video';
  is_official: boolean;
  department_id: string | null;
};

type ChannelGroup = {
  title: string;
  channels: Channel[];
};

export function AppSidebar() {
  const { profile, signOut, user } = useAuth();
  const { open: sidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadNotifications();
  const [isAdmin, setIsAdmin] = useState(false);
  const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [collegeInfo, setCollegeInfo] = useState<{ name: string; department: string }>({
    name: '',
    department: '',
  });

  useEffect(() => {
    fetchChannels();
    fetchCollegeInfo();
    checkAdminStatus();
  }, [profile, user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    
    setIsAdmin(!!data);
  };

  const fetchCollegeInfo = async () => {
    if (!profile?.college_id || !profile?.department_id) return;

    const { data: college } = await supabase
      .from('colleges')
      .select('name_ar')
      .eq('id', profile.college_id)
      .single();

    const { data: department } = await supabase
      .from('departments')
      .select('name_ar')
      .eq('id', profile.department_id)
      .single();

    if (college && department) {
      setCollegeInfo({
        name: college.name_ar,
        department: department.name_ar,
      });
    }
  };

  const fetchChannels = async () => {
    if (!profile?.college_id || !profile?.department_id) return;

    // Fetch college-wide channels
    const { data: collegeChannels } = await supabase
      .from('channels')
      .select('*')
      .eq('college_id', profile.college_id)
      .is('department_id', null)
      .order('is_official', { ascending: false });

    // Fetch department channels
    const { data: departmentChannels } = await supabase
      .from('channels')
      .select('*')
      .eq('department_id', profile.department_id)
      .order('type');

    const groups: ChannelGroup[] = [];

    if (collegeChannels && collegeChannels.length > 0) {
      groups.push({
        title: 'قنوات الكلية',
        channels: collegeChannels,
      });
    }

    if (departmentChannels) {
      const textChannels = departmentChannels.filter((ch) => ch.type === 'text');
      const voiceChannels = departmentChannels.filter((ch) => ch.type === 'voice');
      const videoChannels = departmentChannels.filter((ch) => ch.type === 'video');

      if (textChannels.length > 0) {
        groups.push({
          title: 'قنوات القسم النصية',
          channels: textChannels,
        });
      }

      if (voiceChannels.length > 0 || videoChannels.length > 0) {
        groups.push({
          title: 'قنوات الصوت والفيديو',
          channels: [...voiceChannels, ...videoChannels],
        });
      }
    }

    setChannelGroups(groups);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Volume2 className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const handleChannelClick = (channelId: string) => {
    setSelectedChannel(channelId);
    navigate(`/channel/${channelId}`);
  };

  return (
    <Sidebar className={sidebarOpen ? 'w-60' : 'w-14'} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {sidebarOpen && (
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-primary font-serif truncate">
              {collegeInfo.name}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {collegeInfo.department}
            </p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/notifications')}
                  className="hover:bg-accent relative"
                >
                  <Bell className="h-4 w-4" />
                  {sidebarOpen && <span>الإشعارات</span>}
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-5 min-w-5 flex items-center justify-center px-1 text-xs"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/invitations')}
                  className="hover:bg-accent"
                >
                  <Users className="h-4 w-4" />
                  {sidebarOpen && <span>الدعوات</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/dm')}
                  className="hover:bg-accent"
                >
                  <MessageSquare className="h-4 w-4" />
                  {sidebarOpen && <span>المحادثات الخاصة</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/admin')}
                    className="hover:bg-accent"
                  >
                    <Shield className="h-4 w-4" />
                    {sidebarOpen && <span>لوحة التحكم</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Channel Groups */}
        {sidebarOpen &&
          channelGroups.map((group, index) => (
            <Collapsible key={index} defaultOpen>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 flex items-center justify-between">
                    <span>{group.title}</span>
                    <ChevronDown className="h-4 w-4 transition-transform ui-expanded:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.channels.map((channel) => (
                        <SidebarMenuItem key={channel.id}>
                          <SidebarMenuButton
                            onClick={() => handleChannelClick(channel.id)}
                            className={`hover:bg-accent ${
                              selectedChannel === channel.id
                                ? 'bg-accent text-accent-foreground'
                                : ''
                            }`}
                          >
                            {getChannelIcon(channel.type)}
                            <span className="flex-1 truncate">{channel.name_ar}</span>
                            {channel.is_official && (
                              <span className="text-xs bg-primary/20 text-primary px-1 rounded">
                                رسمي
                              </span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {profile?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={signOut}
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={signOut}
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
