-- 1. Novas permissões
INSERT INTO public.permissions (key, name, description) VALUES
  ('colaboradores_gerenciar', 'Gerenciar colaboradores', 'Criar, editar e excluir colaboradores e liberar atividades'),
  ('checklists_gerenciar', 'Gerenciar checklists', 'Criar e editar modelos de checklist, setores e configurações')
ON CONFLICT (key) DO NOTHING;

-- 2. Funções auxiliares
CREATE OR REPLACE FUNCTION public.pode_ver_colaboradores(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id) OR public.has_permission(_user_id, 'colaboradores');
$$;

CREATE OR REPLACE FUNCTION public.pode_gerenciar_colaboradores(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id) OR public.has_permission(_user_id, 'colaboradores_gerenciar');
$$;

CREATE OR REPLACE FUNCTION public.pode_gerenciar_checklists(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id) OR public.has_permission(_user_id, 'checklists_gerenciar');
$$;

CREATE OR REPLACE FUNCTION public.pode_avaliar(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id) OR public.has_permission(_user_id, 'checklists');
$$;

-- conteúdo vinculado a QUALQUER colaborador (Auxiliar/Avaliador escolhem o colaborador)
CREATE OR REPLACE FUNCTION public.simulado_vinculado(_simulacao_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.colaborador_atividades ca
    WHERE ca.tipo = 'simulado' AND ca.ref_id = _simulacao_id
  );
$$;

CREATE OR REPLACE FUNCTION public.persona_vinculada(_persona_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.colaborador_atividades ca
    WHERE ca.tipo = 'persona' AND ca.ref_id = _persona_id
  ) OR EXISTS (
    SELECT 1 FROM public.colaborador_atividades ca
    JOIN public.simulacoes s ON s.id = ca.ref_id
    WHERE ca.tipo = 'simulado' AND _persona_id::text = ANY (s.persona_ids::text[])
  );
$$;

CREATE OR REPLACE FUNCTION public.pode_baixar_material(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.pode_gerenciar_personas(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.persona_materiais m
    WHERE m.path = _path
      AND (
        (m.persona_id IS NOT NULL AND (
          public.persona_liberada(m.persona_id)
          OR (public.pode_ver_colaboradores(auth.uid()) AND public.persona_vinculada(m.persona_id))
        ))
        OR (m.simulacao_id IS NOT NULL AND (
          public.simulado_liberado(m.simulacao_id)
          OR (public.pode_ver_colaboradores(auth.uid()) AND public.simulado_vinculado(m.simulacao_id))
        ))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.pode_ver_colaboradores(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pode_gerenciar_colaboradores(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pode_gerenciar_checklists(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pode_avaliar(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.simulado_vinculado(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.persona_vinculada(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_ver_colaboradores(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar_colaboradores(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar_checklists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_avaliar(uuid) TO authenticated;

-- 3. Recriar políticas das tabelas de conteúdo
DO $$
DECLARE t text; p text;
BEGIN
  FOREACH t IN ARRAY ARRAY['colaboradores','colaborador_atividades','personas','simulacoes','persona_materiais','checklists','secoes','criterios','exercicios','categorias','setores'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p, t);
    END LOOP;
  END LOOP;
END $$;

-- colaboradores
CREATE POLICY colaboradores_select ON public.colaboradores FOR SELECT TO authenticated
  USING (public.pode_ver_colaboradores(auth.uid()) OR user_id = auth.uid());
CREATE POLICY colaboradores_write ON public.colaboradores FOR ALL TO authenticated
  USING (public.pode_gerenciar_colaboradores(auth.uid()))
  WITH CHECK (public.pode_gerenciar_colaboradores(auth.uid()));

-- atividades
CREATE POLICY atividades_select ON public.colaborador_atividades FOR SELECT TO authenticated
  USING (
    public.pode_ver_colaboradores(auth.uid())
    OR EXISTS (SELECT 1 FROM public.colaboradores c WHERE c.id = colaborador_id AND c.user_id = auth.uid())
  );
CREATE POLICY atividades_write ON public.colaborador_atividades FOR ALL TO authenticated
  USING (public.pode_gerenciar_colaboradores(auth.uid()))
  WITH CHECK (public.pode_gerenciar_colaboradores(auth.uid()));
-- avaliador pode marcar checklist como concluído
CREATE POLICY atividades_update_avaliador ON public.colaborador_atividades FOR UPDATE TO authenticated
  USING (public.pode_avaliar(auth.uid())) WITH CHECK (public.pode_avaliar(auth.uid()));

-- personas
CREATE POLICY personas_select ON public.personas FOR SELECT TO authenticated
  USING (
    public.pode_gerenciar_personas(auth.uid())
    OR public.persona_liberada(id)
    OR (public.pode_ver_colaboradores(auth.uid()) AND public.persona_vinculada(id))
  );
CREATE POLICY personas_write ON public.personas FOR ALL TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()))
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));

-- simulações
CREATE POLICY simulacoes_select ON public.simulacoes FOR SELECT TO authenticated
  USING (
    public.pode_gerenciar_personas(auth.uid())
    OR public.simulado_liberado(id)
    OR (public.pode_ver_colaboradores(auth.uid()) AND public.simulado_vinculado(id))
  );
CREATE POLICY simulacoes_write ON public.simulacoes FOR ALL TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()))
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));

-- anexos
CREATE POLICY materiais_select ON public.persona_materiais FOR SELECT TO authenticated
  USING (
    public.pode_gerenciar_personas(auth.uid())
    OR (persona_id IS NOT NULL AND (
      public.persona_liberada(persona_id)
      OR (public.pode_ver_colaboradores(auth.uid()) AND public.persona_vinculada(persona_id))
    ))
    OR (simulacao_id IS NOT NULL AND (
      public.simulado_liberado(simulacao_id)
      OR (public.pode_ver_colaboradores(auth.uid()) AND public.simulado_vinculado(simulacao_id))
    ))
  );
CREATE POLICY materiais_write ON public.persona_materiais FOR ALL TO authenticated
  USING (public.pode_gerenciar_personas(auth.uid()))
  WITH CHECK (public.pode_gerenciar_personas(auth.uid()));

-- checklists e estrutura: leitura para quem avalia ou vê colaboradores; escrita só gestão
CREATE POLICY checklists_select ON public.checklists FOR SELECT TO authenticated
  USING (public.pode_avaliar(auth.uid()) OR public.pode_ver_colaboradores(auth.uid()));
CREATE POLICY checklists_write ON public.checklists FOR ALL TO authenticated
  USING (public.pode_gerenciar_checklists(auth.uid()))
  WITH CHECK (public.pode_gerenciar_checklists(auth.uid()));

CREATE POLICY secoes_select ON public.secoes FOR SELECT TO authenticated USING (public.pode_avaliar(auth.uid()));
CREATE POLICY secoes_write ON public.secoes FOR ALL TO authenticated
  USING (public.pode_gerenciar_checklists(auth.uid())) WITH CHECK (public.pode_gerenciar_checklists(auth.uid()));

CREATE POLICY criterios_select ON public.criterios FOR SELECT TO authenticated USING (public.pode_avaliar(auth.uid()));
CREATE POLICY criterios_write ON public.criterios FOR ALL TO authenticated
  USING (public.pode_gerenciar_checklists(auth.uid())) WITH CHECK (public.pode_gerenciar_checklists(auth.uid()));

CREATE POLICY exercicios_select ON public.exercicios FOR SELECT TO authenticated USING (public.pode_avaliar(auth.uid()));
CREATE POLICY exercicios_write ON public.exercicios FOR ALL TO authenticated
  USING (public.pode_gerenciar_checklists(auth.uid())) WITH CHECK (public.pode_gerenciar_checklists(auth.uid()));

CREATE POLICY categorias_select ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY categorias_write ON public.categorias FOR ALL TO authenticated
  USING (public.pode_gerenciar_checklists(auth.uid())) WITH CHECK (public.pode_gerenciar_checklists(auth.uid()));

CREATE POLICY setores_select ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY setores_write ON public.setores FOR ALL TO authenticated
  USING (public.pode_gerenciar_checklists(auth.uid())) WITH CHECK (public.pode_gerenciar_checklists(auth.uid()));

-- 4. Índices de desempenho
CREATE INDEX IF NOT EXISTS idx_atividades_colaborador ON public.colaborador_atividades (colaborador_id);
CREATE INDEX IF NOT EXISTS idx_atividades_tipo_ref ON public.colaborador_atividades (tipo, ref_id);
CREATE INDEX IF NOT EXISTS idx_materiais_persona ON public.persona_materiais (persona_id);
CREATE INDEX IF NOT EXISTS idx_materiais_simulacao ON public.persona_materiais (simulacao_id);
CREATE INDEX IF NOT EXISTS idx_materiais_path ON public.persona_materiais (path);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_colaborador ON public.avaliacoes (colaborador_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome ON public.colaboradores (nome_completo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_user ON public.colaboradores (user_id);
CREATE INDEX IF NOT EXISTS idx_personas_nome ON public.personas (nome);
CREATE INDEX IF NOT EXISTS idx_simulacoes_nome ON public.simulacoes (nome);
CREATE INDEX IF NOT EXISTS idx_historico_colaborador ON public.colaborador_historico (colaborador_id, created_at DESC);