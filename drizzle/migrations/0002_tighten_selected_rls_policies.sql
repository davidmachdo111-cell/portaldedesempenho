DROP POLICY IF EXISTS "historico insert" ON public.persona_historico;
CREATE POLICY "historico insert"
ON public.persona_historico
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_admin(auth.uid())
    OR public.pode_gerenciar_personas(auth.uid())
    OR (persona_id IS NOT NULL AND public.persona_liberada(persona_id))
  )
);

DROP POLICY IF EXISTS "historico select" ON public.persona_historico;
CREATE POLICY "historico select"
ON public.persona_historico
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.pode_gerenciar_personas(auth.uid())
  OR (persona_id IS NOT NULL AND public.persona_liberada(persona_id))
);

DROP POLICY IF EXISTS "historico_insert_autenticado" ON public.colaborador_historico;
CREATE POLICY "historico_insert_autenticado"
ON public.colaborador_historico
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_admin(auth.uid())
    OR public.pode_gerenciar_colaboradores(auth.uid())
    OR (colaborador_id IS NOT NULL AND public.colaborador_sob_responsabilidade(colaborador_id))
    OR EXISTS (
      SELECT 1
      FROM public.colaboradores c
      WHERE c.id = colaborador_historico.colaborador_id
        AND c.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "historico_select_autenticado" ON public.colaborador_historico;
CREATE POLICY "historico_select_autenticado"
ON public.colaborador_historico
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.pode_gerenciar_colaboradores(auth.uid())
  OR (colaborador_id IS NOT NULL AND public.colaborador_sob_responsabilidade(colaborador_id))
  OR EXISTS (
    SELECT 1
    FROM public.colaboradores c
    WHERE c.id = colaborador_historico.colaborador_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "perfis delete" ON public.perfis_comportamentais;
CREATE POLICY "perfis delete"
ON public.perfis_comportamentais
FOR DELETE
TO authenticated
USING (public.pode_gerenciar_personas(auth.uid()));

DROP POLICY IF EXISTS "perfis insert" ON public.perfis_comportamentais;
CREATE POLICY "perfis insert"
ON public.perfis_comportamentais
FOR INSERT
TO authenticated
WITH CHECK (public.pode_gerenciar_personas(auth.uid()));

DROP POLICY IF EXISTS "perfis select" ON public.perfis_comportamentais;
CREATE POLICY "perfis select"
ON public.perfis_comportamentais
FOR SELECT
TO authenticated
USING (
  public.pode_gerenciar_personas(auth.uid())
  OR public.has_permission(auth.uid(), 'personagens.ver')
);

DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_key = role_permissions.role_key
  )
);

DROP POLICY IF EXISTS "roles_select" ON public.roles;
CREATE POLICY "roles_select"
ON public.roles
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_key = roles.key
  )
);

DROP POLICY IF EXISTS "permissions_select" ON public.permissions;
CREATE POLICY "permissions_select"
ON public.permissions
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.user_permissions up
    WHERE up.user_id = auth.uid()
      AND up.permission_key = permissions.key
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_key = ur.role_key
    WHERE ur.user_id = auth.uid()
      AND rp.permission_key = permissions.key
  )
);

DROP POLICY IF EXISTS "aliases_read" ON public.permission_aliases;
CREATE POLICY "aliases_read"
ON public.permission_aliases
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.has_permission(auth.uid(), permission_key)
);

DROP POLICY IF EXISTS "setores_select" ON public.setores;
CREATE POLICY "setores_select"
ON public.setores
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.pode_avaliar(auth.uid())
  OR public.pode_gerenciar_checklists(auth.uid())
);

DROP POLICY IF EXISTS "categorias_select" ON public.categorias;
CREATE POLICY "categorias_select"
ON public.categorias
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.pode_avaliar(auth.uid())
  OR public.pode_gerenciar_checklists(auth.uid())
);