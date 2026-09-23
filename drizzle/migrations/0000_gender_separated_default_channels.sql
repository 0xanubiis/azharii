-- Separate default chat channels by gender; official channels stay shared (gender NULL)
CREATE OR REPLACE FUNCTION public.create_default_college_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.channels (name_ar, type, college_id, is_official)
  VALUES ('قناة الأخبار الرسمية', 'text', NEW.id, true);
  INSERT INTO public.channels (name_ar, type, college_id, is_official, gender)
  VALUES ('الدردشة العامة — طلاب', 'text', NEW.id, false, 'male');
  INSERT INTO public.channels (name_ar, type, college_id, is_official, gender)
  VALUES ('الدردشة العامة — طالبات', 'text', NEW.id, false, 'female');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_department_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.channels (name_ar, type, college_id, department_id, is_official, gender)
  VALUES ('دردشة القسم — طلاب', 'text', NEW.college_id, NEW.id, false, 'male');
  INSERT INTO public.channels (name_ar, type, college_id, department_id, is_official, gender)
  VALUES ('دردشة القسم — طالبات', 'text', NEW.college_id, NEW.id, false, 'female');
  INSERT INTO public.channels (name_ar, type, college_id, department_id, is_official)
  VALUES ('الدردشة الرسمية للقسم', 'text', NEW.college_id, NEW.id, true);
  RETURN NEW;
END;
$function$;