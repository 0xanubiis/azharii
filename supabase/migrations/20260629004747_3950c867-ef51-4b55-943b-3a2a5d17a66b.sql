
-- Auto-create default channels for colleges and departments

CREATE OR REPLACE FUNCTION public.create_default_college_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.channels (name_ar, type, college_id, is_official)
  VALUES ('قناة الأخبار الرسمية', 'text', NEW.id, true);
  INSERT INTO public.channels (name_ar, type, college_id, is_official)
  VALUES ('الفئات العامة', 'text', NEW.id, false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_default_college_channels ON public.colleges;
CREATE TRIGGER trg_default_college_channels
AFTER INSERT ON public.colleges
FOR EACH ROW EXECUTE FUNCTION public.create_default_college_channels();

CREATE OR REPLACE FUNCTION public.create_default_department_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.channels (name_ar, type, college_id, department_id, is_official)
  VALUES ('دردشة القسم العامة', 'text', NEW.college_id, NEW.id, false);
  INSERT INTO public.channels (name_ar, type, college_id, department_id, is_official)
  VALUES ('الدردشة الرسمية للقسم', 'text', NEW.college_id, NEW.id, true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_default_department_channels ON public.departments;
CREATE TRIGGER trg_default_department_channels
AFTER INSERT ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.create_default_department_channels();

-- Backfill: colleges without any college-level default channels
INSERT INTO public.channels (name_ar, type, college_id, is_official)
SELECT 'قناة الأخبار الرسمية', 'text', c.id, true
FROM public.colleges c
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels ch
  WHERE ch.college_id = c.id AND ch.department_id IS NULL AND ch.is_official = true
);

INSERT INTO public.channels (name_ar, type, college_id, is_official)
SELECT 'الفئات العامة', 'text', c.id, false
FROM public.colleges c
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels ch
  WHERE ch.college_id = c.id AND ch.department_id IS NULL AND ch.is_official = false
);

-- Backfill: departments without any department-level default channels
INSERT INTO public.channels (name_ar, type, college_id, department_id, is_official)
SELECT 'دردشة القسم العامة', 'text', d.college_id, d.id, false
FROM public.departments d
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels ch
  WHERE ch.department_id = d.id AND ch.is_official = false
);

INSERT INTO public.channels (name_ar, type, college_id, department_id, is_official)
SELECT 'الدردشة الرسمية للقسم', 'text', d.college_id, d.id, true
FROM public.departments d
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels ch
  WHERE ch.department_id = d.id AND ch.is_official = true
);
