import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Users, Building2, Hash, MessageSquare } from 'lucide-react';

export function SystemStatistics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalColleges: 0,
    totalChannels: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    const [users, colleges, channels, messages] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('colleges').select('id', { count: 'exact', head: true }),
      supabase.from('channels').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      totalUsers: users.count || 0,
      totalColleges: colleges.count || 0,
      totalChannels: channels.count || 0,
      totalMessages: messages.count || 0,
    });
  };

  const statCards = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users },
    { label: 'إجمالي الكليات', value: stats.totalColleges, icon: Building2 },
    { label: 'إجمالي القنوات', value: stats.totalChannels, icon: Hash },
    { label: 'إجمالي الرسائل', value: stats.totalMessages, icon: MessageSquare },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <stat.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
