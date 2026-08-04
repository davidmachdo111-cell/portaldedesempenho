-- ============ 1. Anexos com descrição / momento / orientações ============
ALTER TABLE public.persona_materiais
  ALTER COLUMN persona_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS simulacao_id uuid REFERENCES public.simulacoes(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS descricao text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS momento text NOT NULL DEFAULT 'durante_atendimento',
  ADD COLUMN IF NOT EXISTS orientacoes text NOT NULL DEFAULT '';

ALTER TABLE public.persona_materiais
  ADD CONSTRAINT persona_materiais_vinculo_unico
  CHECK ((persona_id IS NOT NULL) <> (simulacao_id IS NOT NULL));

ALTER TABLE public.persona_materiais
  ADD CONSTRAINT persona_materiais_momento_valido
  CHECK (momento IN ('antes_atendimento','durante_atendimento','apos_etapa','durante_avaliacao','encerramento'));

CREATE INDEX IF NOT EXISTS persona_materiais_persona_idx ON public.persona_materiais(persona_id);
CREATE INDEX IF NOT EXISTS persona_materiais_simulacao_idx ON public.persona_materiais(simulacao_id);
CREATE INDEX IF NOT EXISTS colaborador_atividades_colab_idx ON public.colaborador_atividades(colaborador_id);
CREATE INDEX IF NOT EXISTS colaborador_atividades_ref_idx ON public.colaborador_atividades(tipo, ref_id);
CREATE INDEX IF NOT EXISTS colaboradores_user_idx ON public.colaboradores(user_id);

-- ============ 2. Funções de apoio ao controle de acesso ============
CREATE OR REPLACE FUNCTION public.pode_gerenciar_personas(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id) OR public.has_permission(_user_id, 'personagens_simulados');
$$;

CREATE OR REPLACE FUNCTION public.pode_gerenciar_colaboradores(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id) OR public.has_permission(_user_id, 'colaboradores');
$$;

-- Simulado liberado diretamente para o colaborador vinculado ao usuário
CREATE OR REPLACE FUNCTION public.simulado_liberado(_simulacao_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.colaborador_atividades ca
    JOIN public.colaboradores c ON c.id = ca.colaborador_id
    WHERE c.user_id = auth.uid()
      AND ca.tipo = 'simulado'
      AND ca.ref_id = _simulacao_id
  );
$$;

-- Persona liberada direto ou por meio de um simulado liberado
CREATE OR REPLACE FUNCTION public.persona_liberada(_persona_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.colaborador_atividades ca
    JOIN public.colaboradores c ON c.id = ca.colaborador_id
    WHERE c.user_id = auth.uid()
      AND ca.tipo = 'persona'
      AND ca.ref_id = _persona_id
  ) OR EXISTS (
    SELECT 1
    FROM public.colaborador_atividades ca
    JOIN public.colaboradores c ON c.id = ca.colaborador_id
    JOIN public.simulacoes s ON s.id = ca.ref_id
    WHERE c.user_id = auth.uid()
      AND ca.tipo = 'simulado'
      AND _persona_id::text = ANY (s.persona_ids::text[])
  );
$$;

CREATE OR REPLACE FUNCTION public.pode_baixar_material(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.pode_gerenciar_personas(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.persona_materiais m
    WHERE m.path = _path
      AND (
        (m.persona_id IS NOT NULL AND public.persona_liberada(m.persona_id))
        OR (m.simulacao_id IS NOT NULL AND public.simulado_liberado(m.simulacao_id))
      )
  );
$$;

-- ============ 3. Políticas: personas ============
DROP POLICY IF EXISTS "personas select" ON public.personas;
DROP POLICY IF EXISTS "personas insert" ON public.personas;
DROP POLICY IF EXISTS "personas update" ON public.personas;
DROP POLICY IF EXISTS "personas delete" ON public.personas;

CREATE POLICY "personas select" ON public.personas FOR SELECT TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()) OR public.persona_liberada(id));
CREATE POLICY "personas insert" ON public.personas FOR INSERT TO authenticated
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));
CREATE POLICY "personas update" ON public.personas FOR UPDATE TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()))
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));
CREATE POLICY "personas delete" ON public.personas FOR DELETE TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()));

-- ============ 4. Políticas: simulações ============
DROP POLICY IF EXISTS "simulacoes select" ON public.simulacoes;
DROP POLICY IF EXISTS "simulacoes insert" ON public.simulacoes;
DROP POLICY IF EXISTS "simulacoes update" ON public.simulacoes;
DROP POLICY IF EXISTS "simulacoes delete" ON public.simulacoes;

CREATE POLICY "simulacoes select" ON public.simulacoes FOR SELECT TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()) OR public.simulado_liberado(id));
CREATE POLICY "simulacoes insert" ON public.simulacoes FOR INSERT TO authenticated
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));
CREATE POLICY "simulacoes update" ON public.simulacoes FOR UPDATE TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()))
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));
CREATE POLICY "simulacoes delete" ON public.simulacoes FOR DELETE TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()));

-- ============ 5. Políticas: anexos ============
DROP POLICY IF EXISTS "materiais select" ON public.persona_materiais;
DROP POLICY IF EXISTS "materiais insert" ON public.persona_materiais;
DROP POLICY IF EXISTS "materiais delete" ON public.persona_materiais;

CREATE POLICY "materiais select" ON public.persona_materiais FOR SELECT TO authenticated
  USING (
    public.pode_gerenciar_personas(auth.uid())
    OR (persona_id IS NOT NULL AND public.persona_liberada(persona_id))
    OR (simulacao_id IS NOT NULL AND public.simulado_liberado(simulacao_id))
  );
CREATE POLICY "materiais insert" ON public.persona_materiais FOR INSERT TO authenticated
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));
CREATE POLICY "materiais update" ON public.persona_materiais FOR UPDATE TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()))
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));
CREATE POLICY "materiais delete" ON public.persona_materiais FOR DELETE TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()));

-- ============ 6. Políticas: colaboradores e atividades ============
DROP POLICY IF EXISTS "colaboradores_select_autenticado" ON public.colaboradores;
CREATE POLICY "colaboradores_select" ON public.colaboradores FOR SELECT TO authenticated
  USING (
    public.pode_gerenciar_colaboradores(auth.uid())
    OR public.has_permission(auth.uid(), 'checklists')
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "atividades_select_autenticado" ON public.colaborador_atividades;
CREATE POLICY "atividades_select" ON public.colaborador_atividades FOR SELECT TO authenticated
  USING (
    public.pode_gerenciar_colaboradores(auth.uid())
    OR public.has_permission(auth.uid(), 'checklists')
    OR EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.id = colaborador_atividades.colaborador_id AND c.user_id = auth.uid()
    )
  );

-- ============ 7. Storage: download restrito ============
DROP POLICY IF EXISTS "materiais storage select" ON storage.objects;
DROP POLICY IF EXISTS "materiais storage insert" ON storage.objects;
DROP POLICY IF EXISTS "materiais storage delete" ON storage.objects;

CREATE POLICY "materiais storage select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'persona-materiais' AND public.pode_baixar_material(name));
CREATE POLICY "materiais storage insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'persona-materiais' AND public.pode_gerenciar_personas(auth.uid()));
CREATE POLICY "materiais storage delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'persona-materiais' AND public.pode_gerenciar_personas(auth.uid()));