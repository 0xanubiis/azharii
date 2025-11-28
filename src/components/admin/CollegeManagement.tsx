import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type College = {
  id: string;
  name_ar: string;
  description_ar: string | null;
};

export function CollegeManagement() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCollege, setNewCollege] = useState({ name_ar: '', description_ar: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    const { data } = await supabase
      .from('colleges')
      .select('*')
      .order('name_ar', { ascending: true });

    if (data) {
      setColleges(data);
    }
    setLoading(false);
  };

  const createCollege = async () => {
    if (!newCollege.name_ar.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'اسم الكلية مطلوب',
      });
      return;
    }

    const { error } = await supabase.from('colleges').insert(newCollege);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إنشاء الكلية',
      });
      return;
    }

    toast({
      title: 'تم الإنشاء',
      description: 'تم إنشاء الكلية بنجاح',
    });

    setNewCollege({ name_ar: '', description_ar: '' });
    setDialogOpen(false);
    fetchColleges();
  };

  const deleteCollege = async (id: string) => {
    const { error } = await supabase.from('colleges').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف الكلية',
      });
      return;
    }

    toast({
      title: 'تم الحذف',
      description: 'تم حذف الكلية بنجاح',
    });

    fetchColleges();
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
        <h2 className="text-xl font-bold">إدارة الكليات</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة كلية
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة كلية جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">اسم الكلية</label>
                <Input
                  value={newCollege.name_ar}
                  onChange={(e) =>
                    setNewCollege({ ...newCollege, name_ar: e.target.value })
                  }
                  placeholder="مثال: كلية الهندسة"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الوصف</label>
                <Textarea
                  value={newCollege.description_ar}
                  onChange={(e) =>
                    setNewCollege({ ...newCollege, description_ar: e.target.value })
                  }
                  placeholder="وصف الكلية..."
                />
              </div>
              <Button onClick={createCollege} className="w-full">
                إنشاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {colleges.map((college) => (
          <div
            key={college.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-semibold">{college.name_ar}</p>
              {college.description_ar && (
                <p className="text-sm text-muted-foreground">
                  {college.description_ar}
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteCollege(college.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
