CREATE OR REPLACE FUNCTION public.configurar_usuario(_id uuid,_dados jsonb,_criar boolean DEFAULT false,_bootstrap boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE k text; BEGIN
IF _bootstrap THEN
IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Acesso negado.' USING ERRCODE='42501'; END IF;
PERFORM pg_advisory_xact_lock(9374261);
IF EXISTS(SELECT 1 FROM public.profiles) THEN RAISE EXCEPTION 'A plataforma já possui usuários cadastrados.'; END IF;
ELSE
IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Acesso restrito a administradores.' USING ERRCODE='42501'; END IF;
END IF;
IF _dados ? 'roleKeys' THEN
IF jsonb_typeof(_dados->'roleKeys')<>'array' THEN RAISE EXCEPTION 'Perfis inválidos.'; END IF;
FOR k IN SELECT jsonb_array_elements_text(_dados->'roleKeys') LOOP IF NOT EXISTS(SELECT 1 FROM public.roles WHERE key=k) THEN RAISE EXCEPTION 'Perfil inválido: %',k; END IF; END LOOP;
END IF;
IF _dados ? 'permissionKeys' THEN
IF jsonb_typeof(_dados->'permissionKeys')<>'array' THEN RAISE EXCEPTION 'Permissões inválidas.'; END IF;
FOR k IN SELECT jsonb_array_elements_text(_dados->'permissionKeys') LOOP IF NOT EXISTS(SELECT 1 FROM public.permissions WHERE key=k) THEN RAISE EXCEPTION 'Permissão inválida: %',k; END IF; END LOOP;
END IF;
IF NOT _bootstrap AND _id=auth.uid() AND ((_dados ? 'active' AND (_dados->>'active')::boolean=false) OR (_dados ? 'roleKeys' AND NOT (_dados->'roleKeys' ? 'administrador'))) THEN RAISE EXCEPTION 'Não é possível remover o próprio acesso administrativo.'; END IF;
IF _criar THEN
INSERT INTO public.profiles(id,username,full_name,active) VALUES(_id,_dados->>'username',coalesce(_dados->>'fullName',_dados->>'username'),coalesce((_dados->>'active')::boolean,true));
ELSE
PERFORM 1 FROM public.profiles WHERE id=_id FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Usuário não encontrado.'; END IF;
UPDATE public.profiles SET full_name=CASE WHEN _dados ? 'fullName' THEN _dados->>'fullName' ELSE full_name END,active=CASE WHEN _dados ? 'active' THEN (_dados->>'active')::boolean ELSE active END WHERE id=_id;
END IF;
IF _dados ? 'roleKeys' THEN
INSERT INTO public.user_roles(user_id,role_key) SELECT DISTINCT _id,value FROM jsonb_array_elements_text(_dados->'roleKeys') ON CONFLICT(user_id,role_key) DO NOTHING;
DELETE FROM public.user_roles WHERE user_id=_id AND NOT (_dados->'roleKeys' ? role_key);
END IF;
IF _dados ? 'permissionKeys' THEN
INSERT INTO public.user_permissions(user_id,permission_key) SELECT DISTINCT _id,value FROM jsonb_array_elements_text(_dados->'permissionKeys') ON CONFLICT(user_id,permission_key) DO NOTHING;
DELETE FROM public.user_permissions WHERE user_id=_id AND NOT (_dados->'permissionKeys' ? permission_key);
END IF;
END $$;
REVOKE ALL ON FUNCTION public.configurar_usuario(uuid,jsonb,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.configurar_usuario(uuid,jsonb,boolean,boolean) TO authenticated,service_role;