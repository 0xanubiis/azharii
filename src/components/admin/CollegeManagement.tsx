import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronDown, MapPin, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type College = {
  id: string;
  name_ar: string;
  description_ar: string | null;
};

type Department = { id: string; college_id: string; name_ar: string };
type Location = { id: string; college_id: string; name_ar: string };

export function CollegeManagement() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Record<string, Department[]>>({});
  const [locations, setLocations] = useState<Record<string, Location[]>>({});
  const [loading, setLoading] = useState(true);
  const [newCollege, setNewCollege] = useState({ name_ar: '', description_ar: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDept, setNewDept] = useState<Record<string, string>>({});
  const [newLoc, setNewLoc] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: c }, { data: d }, { data: l }] = await Promise.all([
      supabase.from('colleges').select('*').order('name_ar', { ascending: true }),
      supabase.from('departments').select('*').order('name_ar', { ascending: true }),
      supabase.from('college_locations').select('*').order('name_ar', { ascending: true }),
    ]);
    if (c) setColleges(c);
    if (d) {
      const map: Record<string, Department[]> = {};
      d.forEach((x: Department) => {
        (map[x.college_id] ||= []).push(x);
      });
      setDepartments(map);
    }
    if (l) {
      const map: Record<string, Location[]> = {};
      l.forEach((x: Location) => {
        (map[x.college_id] ||= []).push(x);
      });
      setLocations(map);
    }
    setLoading(false);
  };

  const err = (msg: string) =>
    toast({ variant: 'destructive', title: 'خطأ', description: msg });
  const ok = (msg: string) => toast({ title: 'تم', description: msg });

  const createCollege = async () => {
    if (!newCollege.name_ar.trim()) return err('اسم الكلية مطلوب');
    const { error } = await supabase.from('colleges').insert(newCollege);
    if (error) return err('فشل إنشاء الكلية');
    ok('تم إنشاء الكلية');
    setNewCollege({ name_ar: '', description_ar: '' });
    setDialogOpen(false);
    fetchAll();
  };

  const deleteCollege = async (id: string) => {
    if (!confirm('سيتم حذف الكلية وجميع أقسامها وأماكنها. هل أنت متأكد؟')) return;
    const { error } = await supabase.from('colleges').delete().eq('id', id);
    if (error) return err('فشل الحذف');
    ok('تم حذف الكلية');
    fetchAll();
  };

  const addDept = async (collegeId: string) => {
    const name = (newDept[collegeId] || '').trim();
    if (!name) return err('اسم القسم مطلوب');
    const { error } = await supabase
      .from('departments')
      .insert({ college_id: collegeId, name_ar: name });
    if (error) return err('فشل إضافة القسم');
    setNewDept((s) => ({ ...s, [collegeId]: '' }));
    fetchAll();
  };

  const deleteDept = async (id: string) => {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) return err('فشل الحذف');
    fetchAll();
  };

  const addLoc = async (collegeId: string) => {
    const name = (newLoc[collegeId] || '').trim();
    if (!name) return err('اسم المكان مطلوب');
    const { error } = await supabase
      .from('college_locations')
      .insert({ college_id: collegeId, name_ar: name });
    if (error) return err('فشل إضافة المكان');
    setNewLoc((s) => ({ ...s, [collegeId]: '' }));
    fetchAll();
  };

  const deleteLoc = async (id: string) => {
    const { error } = await supabase.from('college_locations').delete().eq('id', id);
    if (error) return err('فشل الحذف');
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold">إدارة الكليات والأقسام والأماكن</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة كلية
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة كلية جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">اسم الكلية</label>
                <Input
                  value={newCollege.name_ar}
                  onChange={(e) => setNewCollege({ ...newCollege, name_ar: e.target.value })}
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

      <Accordion type="multiple" className="space-y-2">
        {colleges.map((college) => {
          const depts = departments[college.id] || [];
          const locs = locations[college.id] || [];
          return (
            <AccordionItem
              key={college.id}
              value={college.id}
              className="border rounded-lg px-3"
            >
              <div className="flex items-center justify-between gap-2">
                <AccordionTrigger className="flex-1 hover:no-underline py-3">
                  <div className="flex flex-col items-start text-right">
                    <span className="font-semibold">{college.name_ar}</span>
                    <span className="text-xs text-muted-foreground">
                      {depts.length} قسم · {locs.length} مكان
                    </span>
                  </div>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCollege(college.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <AccordionContent className="space-y-5 pt-2">
                {college.description_ar && (
                  <p className="text-sm text-muted-foreground">{college.description_ar}</p>
                )}

                {/* Locations */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-primary" />
                    الأماكن / المحافظات
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newLoc[college.id] || ''}
                      onChange={(e) =>
                        setNewLoc((s) => ({ ...s, [college.id]: e.target.value }))
                      }
                      placeholder="مثال: القاهرة"
                      onKeyDown={(e) => e.key === 'Enter' && addLoc(college.id)}
                    />
                    <Button size="sm" onClick={() => addLoc(college.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {locs.length === 0 && (
                      <p className="text-xs text-muted-foreground">لا توجد أماكن بعد</p>
                    )}
                    {locs.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                      >
                        <span>{l.name_ar}</span>
                        <button
                          onClick={() => deleteLoc(l.id)}
                          className="text-destructive hover:opacity-70"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Departments */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="h-4 w-4 text-primary" />
                    الأقسام
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newDept[college.id] || ''}
                      onChange={(e) =>
                        setNewDept((s) => ({ ...s, [college.id]: e.target.value }))
                      }
                      placeholder="مثال: قسم العقيدة"
                      onKeyDown={(e) => e.key === 'Enter' && addDept(college.id)}
                    />
                    <Button size="sm" onClick={() => addDept(college.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {depts.length === 0 && (
                      <p className="text-xs text-muted-foreground">لا توجد أقسام بعد</p>
                    )}
                    {depts.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                      >
                        <span>{d.name_ar}</span>
                        <button
                          onClick={() => deleteDept(d.id)}
                          className="text-destructive hover:opacity-70"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Card>
  );
}
