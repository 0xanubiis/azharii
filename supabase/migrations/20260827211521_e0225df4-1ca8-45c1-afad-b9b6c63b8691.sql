REVOKE EXECUTE ON FUNCTION public.can_user_post(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_message_file(text) FROM authenticated, PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.users_same_gender(uuid, uuid) FROM authenticated, PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_profile_scope() FROM authenticated, PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_name_change_cooldown() FROM authenticated, PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_default_college_channels() FROM authenticated, PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_default_department_channels() FROM authenticated, PUBLIC, anon;
