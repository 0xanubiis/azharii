import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, College, Department } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.onboarding_completed) navigate('/home');
  }, [profile, navigate]);

  useEffect(() => {
    supabase
      .from('colleges')
      .select('*')
      .order('name_ar')
      .then(({ data }) => data && setColleges(data));
  }, []);

  useEffect(() => {
    if (!selectedCollege) return;
    supabase
      .from('departments')
      .select('*')
      .eq('college_id', selectedCollege)
      .order('name_ar')
      .then(({ data }) => data && setDepartments(data));
  }, [selectedCollege]);

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          gender,
          college_id: selectedCollege,
          department_id: selectedDepartment,
          onboarding_completed: true,
        })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'تم إكمال التسجيل', description: 'مرحباً بك في أزهري!' });
      navigate('/home');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'حدث خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 gradient-brand opacity-10" aria-hidden="true" />
      <div className="absolute inset-0 islamic-pattern text-primary opacity-[0.05]" aria-hidden="true" />
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-lg relative z-10 shadow-elevated border-border/60">
        <CardHeader className="space-y-3">
          <CardTitle className="text-center text-2xl font-serif text-primary">إعداد الحساب</CardTitle>
          <CardDescription className="text-center">الخطوة {step} من 3</CardDescription>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-lg">اختر الجنس</Label>
              <RadioGroup value={gender} onValueChange={(v: any) => setGender(v)} dir="rtl" className="grid grid-cols-2 gap-3">
                {[
                  { value: 'male', label: 'ذكر' },
                  { value: 'female', label: 'أنثى' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    htmlFor={opt.value}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      gender === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
              <Button onClick={() => setStep(2)} className="w-full">
                التالي
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg">اختر الكلية</Label>
                <Select value={selectedCollege} onValueChange={setSelectedCollege} dir="rtl">
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الكلية" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  السابق
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" disabled={!selectedCollege}>
                  التالي
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg">اختر القسم</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment} dir="rtl">
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  السابق
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1"
                  disabled={!selectedDepartment || loading}
                >
                  {loading ? 'جاري الحفظ…' : 'إنهاء'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
