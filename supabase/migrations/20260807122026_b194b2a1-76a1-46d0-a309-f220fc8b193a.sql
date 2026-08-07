-- Atividades: acesso apenas do admin, do próprio colaborador ou dos responsáveis vinculados
DROP POLICY IF EXISTS "atividades_select" ON public.colaborador_atividades;
CREATE POLICY "atividades_select" ON public.colaborador_atividades
FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.colaborador_sob_responsabilidade(colaborador_id)
  OR EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE c.id = colaborador_atividades.colaborador_id AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "atividades_update_andamento" ON public.colaborador_atividades;
CREATE POLICY "atividades_update_andamento" ON public.colaborador_atividades
FOR UPDATE TO authenticated
USING (
  tipo = ANY (ARRAY['persona'::text, 'simulado'::text])
  AND (public.is_admin(auth.uid()) OR public.colaborador_sob_responsabilidade(colaborador_id))
)
WITH CHECK (
  tipo = ANY (ARRAY['persona'::text, 'simulado'::text])
  AND (public.is_admin(auth.uid()) OR public.colaborador_sob_responsabilidade(colaborador_id))
);

DROP POLICY IF EXISTS "atividades_update_avaliador" ON public.colaborador_atividades;
CREATE POLICY "atividades_update_avaliador" ON public.colaborador_atividades
FOR UPDATE TO authenticated
USING (
  public.pode_avaliar(auth.uid())
  AND (public.is_admin(auth.uid()) OR public.colaborador_sob_responsabilidade(colaborador_id))
)
WITH CHECK (
  public.pode_avaliar(auth.uid())
  AND (public.is_admin(auth.uid()) OR public.colaborador_sob_responsabilidade(colaborador_id))
);

-- Avaliações: avaliador só registra para colaboradores vinculados a ele
DROP POLICY IF EXISTS "avaliacoes insercao do avaliador" ON public.avaliacoes;
CREATE POLICY "avaliacoes insercao do avaliador" ON public.avaliacoes
FOR INSERT TO authenticated
WITH CHECK (
  avaliador_id = auth.uid()
  AND (public.is_admin(auth.uid()) OR public.pode_avaliar(auth.uid()))
  AND (
    colaborador_id IS NULL
    OR public.is_admin(auth.uid())
    OR public.colaborador_sob_responsabilidade(colaborador_id)
  )
);
