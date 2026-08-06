ALTER TABLE public.colaborador_atividades
  ADD COLUMN IF NOT EXISTS concluido_por uuid,
  ADD COLUMN IF NOT EXISTS concluido_por_nome text;

DROP POLICY IF EXISTS atividades_update_andamento ON public.colaborador_atividades;
CREATE POLICY atividades_update_andamento
ON public.colaborador_atividades
FOR UPDATE
TO authenticated
USING (
  public.pode_ver_colaboradores(auth.uid())
  AND tipo IN ('persona','simulado')
)
WITH CHECK (
  public.pode_ver_colaboradores(auth.uid())
  AND tipo IN ('persona','simulado')
);