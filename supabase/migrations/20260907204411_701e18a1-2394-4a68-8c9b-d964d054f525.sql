-- These helpers are invoked from inside RLS policies, which evaluate as the
-- querying role. Revoking EXECUTE from `authenticated` broke posting messages,
-- creating DM channels and downloading message files. They are safe to expose:
-- each one only answers a narrow yes/no question about the caller's own scope.
GRANT EXECUTE ON FUNCTION public.can_user_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_message_file(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.users_same_gender(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_scope() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
