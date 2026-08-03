DROP POLICY IF EXISTS "audits_shared_read" ON public.audits;
DROP POLICY IF EXISTS "issues_shared_read" ON public.issues;
REVOKE SELECT ON public.audits FROM anon;
REVOKE SELECT ON public.issues FROM anon;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;