CREATE POLICY "profiles_select_responsaveis" ON public.profiles
FOR SELECT TO authenticated
USING (
  public.pode_ver_colaboradores(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.colaborador_responsaveis r WHERE r.user_id = profiles.id
  )
);
