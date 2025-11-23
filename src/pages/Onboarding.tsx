import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, College, Department } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
    if (profile?.onboarding_completed) {
      navigate('/home');
    }
  }, [profile, navigate]);

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      fetchDepartments(selectedCollege);
    }
  }, [selectedCollege]);

  const fetchColleges = async () => {
    const { data } = await supabase
      .from('colleges')
      .select('*')
      .order('name_ar');
    if (data) setColleges(data);
  };

  const fetchDepartments = async (collegeId: string) => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('college_id', collegeId)
      .order('name_ar');
    if (data) setDepartments(data);
  };

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

      toast({
        title: 'تم إكمال التسجيل',
        description: 'مرحباً بك في أزهري!',
      });

      navigate('/home');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">إعداد الحساب</CardTitle>
          <CardDescription className="text-center">
            الخطوة {step} من 3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-lg">اختر الجنس</Label>
              <RadioGroup value={gender} onValueChange={(value: any) => setGender(value)} dir="rtl">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="cursor-pointer">ذكر</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="cursor-pointer">أنثى</Label>
                </div>
              </RadioGroup>
              <Button onClick={() => setStep(2)} className="w-full">التالي</Button>
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
                    {colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">السابق</Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1"
                  disabled={!selectedCollege}
                >
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
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">السابق</Button>
                <Button 
                  onClick={handleComplete} 
                  className="flex-1"
                  disabled={!selectedDepartment || loading}
                >
                  {loading ? 'جاري الحفظ...' : 'إنهاء'}
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
