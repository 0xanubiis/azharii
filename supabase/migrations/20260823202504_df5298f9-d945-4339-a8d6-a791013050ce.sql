REVOKE ALL ON FUNCTION public.create_default_college_channels() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_default_department_channels() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_name_change_cooldown() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_moderation_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_user_post(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_profile_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.users_same_gender(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_scope() TO authenticated;
GRANT EXECUTE ON FUNCTION public.users_same_gender(uuid, uuid) TO authenticated;