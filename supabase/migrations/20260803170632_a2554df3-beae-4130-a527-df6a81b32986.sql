REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;