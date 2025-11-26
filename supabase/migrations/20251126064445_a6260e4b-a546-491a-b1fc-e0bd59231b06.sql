-- Grant admin role to specific user securely
-- User must sign up with this email first, then they'll automatically get admin access
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'evidence404@proton.me';
  
  -- Only proceed if user exists
  IF admin_user_id IS NOT NULL THEN
    -- Check if admin role already exists for this user
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin') THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'admin');
    END IF;
  END IF;
END $$;