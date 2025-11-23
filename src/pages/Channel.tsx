import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Hash, Volume2, Video } from 'lucide-react';

type ChannelData = {
  id: string;
  name_ar: string;
  type: 'text' | 'voice' | 'video';
  is_official: boolean;
};

const Channel = () => {
  const { channelId } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (channelId) {
      fetchChannel();
    }
  }, [channelId]);

  const fetchChannel = async () => {
    if (!channelId) return;

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (data) {
      setChannel(data);
    }
    setLoading(false);
  };

  const getChannelIcon = () => {
    switch (channel?.type) {
      case 'voice':
        return <Volume2 className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <Hash className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-lg text-muted-foreground">القناة غير موجودة</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Channel Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center gap-3">
          {getChannelIcon()}
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{channel.name_ar}</h2>
            {channel.is_official && (
              <p className="text-xs text-muted-foreground">قناة رسمية - للإدارة فقط</p>
            )}
          </div>
        </div>
      </div>

      {/* Channel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {channel.type === 'text' ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              نظام الرسائل قيد التطوير...
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              {getChannelIcon()}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {channel.type === 'voice' ? 'قناة صوتية' : 'قناة فيديو'}
            </h3>
            <p className="text-muted-foreground">
              المكالمات الصوتية والمرئية قيد التطوير...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;
