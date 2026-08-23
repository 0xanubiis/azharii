-- Trigger functions must never be callable through the API
REVOKE ALL ON FUNCTION public.create_default_college_channels() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.create_default_department_channels() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_name_change_cooldown() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_moderation_fields() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Helper functions: signed-in users only, never anonymous
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.can_user_post(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.current_profile_scope() FROM anon;
REVOKE ALL ON FUNCTION public.users_same_gender(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.my_moderation_status() FROM anon;
REVOKE ALL ON FUNCTION public.admin_moderation_list() FROM anon;
REVOKE ALL ON FUNCTION public.can_access_message_file(text) FROM anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_scope() TO authenticated;
GRANT EXECUTE ON FUNCTION public.users_same_gender(uuid, uuid) TO authenticated;