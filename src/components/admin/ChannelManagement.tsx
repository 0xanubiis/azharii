import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type Channel = {
  id: string;
  name_ar: string;
  type: string;
  is_official: boolean;
  colleges: { name_ar: string } | null;
  departments: { name_ar: string } | null;
};

export function ChannelManagement() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name_ar: '',
    type: 'text',
    is_official: false,
    college_id: '',
    department_id: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [channelsData, collegesData, departmentsData] = await Promise.all([
      supabase.from('channels').select('*, colleges(name_ar), departments(name_ar)'),
      supabase.from('colleges').select('*'),
      supabase.from('departments').select('*'),
    ]);

    if (channelsData.data) setChannels(channelsData.data as any);
    if (collegesData.data) setColleges(collegesData.data);
    if (departmentsData.data) setDepartments(departmentsData.data);
    setLoading(false);
  };

  const createChannel = async () => {
    if (!newChannel.name_ar.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'اسم القناة مطلوب',
      });
      return;
    }

    const channelData = {
      name_ar: newChannel.name_ar,
      type: newChannel.type as 'text' | 'voice' | 'video',
      is_official: newChannel.is_official,
      college_id: newChannel.college_id || null,
      department_id: newChannel.department_id || null,
    };

    const { error } = await supabase.from('channels').insert(channelData);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إنشاء القناة',
      });
      return;
    }

    toast({
      title: 'تم الإنشاء',
      description: 'تم إنشاء القناة بنجاح',
    });

    setNewChannel({
      name_ar: '',
      type: 'text',
      is_official: false,
      college_id: '',
      department_id: '',
    });
    setDialogOpen(false);
    fetchData();
  };

  const deleteChannel = async (id: string) => {
    const { error } = await supabase.from('channels').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف القناة',
      });
      return;
    }

    toast({
      title: 'تم الحذف',
      description: 'تم حذف القناة بنجاح',
    });

    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">إدارة القنوات</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة قناة
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة قناة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">اسم القناة</label>
                <Input
                  value={newChannel.name_ar}
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, name_ar: e.target.value })
                  }
                  placeholder="مثال: عام"
                />
              </div>
              <div>
                <label className="text-sm font-medium">النوع</label>
                <Select
                  value={newChannel.type}
                  onValueChange={(value) =>
                    setNewChannel({ ...newChannel, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">نصية</SelectItem>
                    <SelectItem value="voice">صوتية</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">الكلية</label>
                <Select
                  value={newChannel.college_id}
                  onValueChange={(value) =>
                    setNewChannel({ ...newChannel, college_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الكلية" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">القسم</label>
                <Select
                  value={newChannel.department_id}
                  onValueChange={(value) =>
                    setNewChannel({ ...newChannel, department_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">قناة رسمية</label>
                <Switch
                  checked={newChannel.is_official}
                  onCheckedChange={(checked) =>
                    setNewChannel({ ...newChannel, is_official: checked })
                  }
                />
              </div>
              <Button onClick={createChannel} className="w-full">
                إنشاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">{channel.name_ar}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{channel.type}</Badge>
                  {channel.is_official && (
                    <Badge variant="default">رسمية</Badge>
                  )}
                  {channel.colleges && (
                    <Badge variant="secondary">{channel.colleges.name_ar}</Badge>
                  )}
                  {channel.departments && (
                    <Badge variant="secondary">{channel.departments.name_ar}</Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteChannel(channel.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
