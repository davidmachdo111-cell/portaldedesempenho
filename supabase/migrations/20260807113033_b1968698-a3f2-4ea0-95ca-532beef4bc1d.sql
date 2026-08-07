DROP POLICY IF EXISTS "avaliacoes insercao do avaliador" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes leitura do avaliador" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes atualizacao do avaliador" ON public.avaliacoes;

CREATE POLICY "avaliacoes insercao do avaliador"
ON public.avaliacoes FOR INSERT TO authenticated
WITH CHECK (
  avaliador_id = auth.uid()
  AND (public.is_admin(auth.uid()) OR public.pode_avaliar(auth.uid()))
);

CREATE POLICY "avaliacoes leitura do avaliador"
ON public.avaliacoes FOR SELECT TO authenticated
USING (avaliador_id = auth.uid());

CREATE POLICY "avaliacoes atualizacao do avaliador"
ON public.avaliacoes FOR UPDATE TO authenticated
USING (avaliador_id = auth.uid())
WITH CHECK (avaliador_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;