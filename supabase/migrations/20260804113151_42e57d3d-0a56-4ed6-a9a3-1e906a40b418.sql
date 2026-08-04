REVOKE EXECUTE ON FUNCTION public.pode_gerenciar_personas(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.pode_gerenciar_colaboradores(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.simulado_liberado(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.persona_liberada(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.pode_baixar_material(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.pode_gerenciar_personas(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar_colaboradores(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.simulado_liberado(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.persona_liberada(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pode_baixar_material(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;