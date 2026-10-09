CREATE OR REPLACE FUNCTION public.profile_ativo(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=_user_id AND active); $$;
REVOKE ALL ON FUNCTION public.profile_ativo(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.profile_ativo(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.profile_ativo(_user_id) AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role_key='administrador'); $$;
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid,_permission text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE keys text[]; k text;
BEGIN
IF NOT public.profile_ativo(_user_id) THEN RETURN false; END IF;
IF public.is_admin(_user_id) THEN RETURN true; END IF;
SELECT array_agg(permission_key) INTO keys FROM public.permission_aliases WHERE legacy_key=_permission;
IF keys IS NULL THEN keys:=ARRAY[_permission]; END IF;
FOREACH k IN ARRAY keys LOOP
IF NOT (EXISTS(SELECT 1 FROM public.user_permissions WHERE user_id=_user_id AND permission_key=k) OR EXISTS(SELECT 1 FROM public.user_roles ur JOIN public.role_permissions rp ON rp.role_key=ur.role_key WHERE ur.user_id=_user_id AND rp.permission_key=k)) THEN RETURN false; END IF;
END LOOP;
RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.pode_acessar_colaborador(_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.profile_ativo(auth.uid()) AND (public.is_admin(auth.uid()) OR public.colaborador_sob_responsabilidade(_id) OR EXISTS(SELECT 1 FROM public.colaboradores WHERE id=_id AND (user_id=auth.uid() OR (created_by=auth.uid() AND public.has_permission(auth.uid(),'colaboradores.criar'))))); $$;
CREATE OR REPLACE FUNCTION public.pode_ler_checklist(_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_any_permission(auth.uid(),ARRAY['checklists.ver','checklists.aplicar','checklists.mestre_criar','checklists.mestre_editar','checklists.mestre_excluir']); $$;
REVOKE ALL ON FUNCTION public.pode_acessar_colaborador(uuid),public.pode_ler_checklist(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pode_acessar_colaborador(uuid),public.pode_ler_checklist(uuid) TO authenticated,service_role;
DO $$ DECLARE t text; BEGIN
FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
EXECUTE format('CREATE POLICY active_profile_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.profile_ativo(auth.uid())) WITH CHECK(public.profile_ativo(auth.uid()))',t);
END LOOP;
END $$;