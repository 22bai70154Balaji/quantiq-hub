-- Revoke user-facing EXECUTE on trigger-only helper functions.
-- has_role() intentionally stays callable — RLS policies rely on it.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO service_role;
