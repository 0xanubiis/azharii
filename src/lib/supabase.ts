import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Profile = {
  id: string;
  full_name: string;
  username: string;
  gender: 'male' | 'female';
  college_id: string | null;
  department_id: string | null;
  location_id: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  timeout_until: string | null;
  kicked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type College = {
  id: string;
  name_ar: string;
  description_ar: string | null;
  created_at: string;
};

export type Department = {
  id: string;
  college_id: string;
  name_ar: string;
  created_at: string;
};

export type CollegeLocation = {
  id: string;
  college_id: string;
  name_ar: string;
  created_at: string;
};
