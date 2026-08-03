-- Helpers reaproveitados pelos módulos, ligados ao controle de acesso central
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(auth.uid())
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- ============ MODULO CHECKLISTS ============
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text NOT NULL DEFAULT '#008C50',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias leitura auth" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias admin" ON public.categorias FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setores TO authenticated;
GRANT ALL ON public.setores TO service_role;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "setores leitura auth" ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "setores admin" ON public.setores FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER setores_updated_at BEFORE UPDATE ON public.setores FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.setores (nome) VALUES
  ('Administrativo'), ('Operacional'), ('Comercial'), ('Financeiro'), ('Recursos Humanos');

CREATE TABLE public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  nota_minima numeric NOT NULL DEFAULT 70,
  permite_observacoes boolean NOT NULL DEFAULT true,
  observacoes_obrigatorias boolean NOT NULL DEFAULT false,
  pontos_fortes_modo text NOT NULL DEFAULT 'opcional',
  pontos_desenvolvimento_modo text NOT NULL DEFAULT 'opcional',
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checklists_pontos_fortes_modo_chk CHECK (pontos_fortes_modo IN ('obrigatorio','opcional','oculto')),
  CONSTRAINT checklists_pontos_desenv_modo_chk CHECK (pontos_desenvolvimento_modo IN ('obrigatorio','opcional','oculto'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO authenticated;
GRANT ALL ON public.checklists TO service_role;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklists leitura auth" ON public.checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "checklists admin" ON public.checklists FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_checklists_updated BEFORE UPDATE ON public.checklists FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.secoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT 'Nova seção',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_secoes_checklist ON public.secoes(checklist_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secoes TO authenticated;
GRANT ALL ON public.secoes TO service_role;
ALTER TABLE public.secoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "secoes leitura auth" ON public.secoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "secoes admin" ON public.secoes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.criterios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  secao_id uuid REFERENCES public.secoes(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT 'Novo critério',
  peso integer NOT NULL DEFAULT 1,
  obrigatorio boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_criterios_checklist ON public.criterios(checklist_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.criterios TO authenticated;
GRANT ALL ON public.criterios TO service_role;
ALTER TABLE public.criterios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "criterios leitura auth" ON public.criterios FOR SELECT TO authenticated USING (true);
CREATE POLICY "criterios admin" ON public.criterios FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.exercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT 'Novo exercício',
  obrigatorio boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercicios_checklist ON public.exercicios(checklist_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercicios TO authenticated;
GRANT ALL ON public.exercicios TO service_role;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercicios leitura auth" ON public.exercicios FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercicios admin" ON public.exercicios FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.atribuicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  avaliador_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (checklist_id, avaliador_id)
);
CREATE INDEX idx_atribuicoes_avaliador ON public.atribuicoes(avaliador_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atribuicoes TO authenticated;
GRANT ALL ON public.atribuicoes TO service_role;
ALTER TABLE public.atribuicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "atribuicoes admin" ON public.atribuicoes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "atribuicoes do avaliador" ON public.atribuicoes FOR SELECT TO authenticated USING (avaliador_id = auth.uid());

CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  avaliador_id uuid NOT NULL,
  colaborador_nome text NOT NULL DEFAULT '',
  setor text NOT NULL DEFAULT '',
  tutor text NOT NULL DEFAULT '',
  data_inicio date,
  data_avaliacao date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'rascunho',
  media numeric NOT NULL DEFAULT 0,
  marcados jsonb NOT NULL DEFAULT '{}'::jsonb,
  observacoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_avaliacoes_avaliador ON public.avaliacoes(avaliador_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avaliacoes leitura do avaliador" ON public.avaliacoes FOR SELECT TO authenticated USING (avaliador_id = auth.uid());
CREATE POLICY "avaliacoes leitura admin" ON public.avaliacoes FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "avaliacoes insercao do avaliador" ON public.avaliacoes FOR INSERT TO authenticated
WITH CHECK (
  avaliador_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.atribuicoes a WHERE a.avaliador_id = auth.uid() AND a.checklist_id = avaliacoes.checklist_id)
);
CREATE POLICY "avaliacoes atualizacao do avaliador" ON public.avaliacoes FOR UPDATE TO authenticated
USING (avaliador_id = auth.uid())
WITH CHECK (
  avaliador_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.atribuicoes a WHERE a.avaliador_id = auth.uid() AND a.checklist_id = avaliacoes.checklist_id)
);
CREATE POLICY "avaliacoes atualizacao admin" ON public.avaliacoes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "avaliacoes exclusao do avaliador" ON public.avaliacoes FOR DELETE TO authenticated USING (avaliador_id = auth.uid());
CREATE POLICY "avaliacoes exclusao admin" ON public.avaliacoes FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER avaliacoes_touch BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER PUBLICATION supabase_realtime ADD TABLE public.avaliacoes;

-- ============ MODULO PERSONAGENS E SIMULADOS ============
CREATE TABLE public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Nova Persona',
  idade text,
  sexo text,
  cidade text,
  tipo_cliente text,
  titularidade text,
  nome_dependente text,
  exercicio text,
  vertente text,
  complexidade text,
  objetivo text,
  contexto_oculto text,
  dados_tecnicos jsonb NOT NULL DEFAULT '[]'::jsonb,
  perfil_comportamental text[] NOT NULL DEFAULT '{}',
  fala_inicial text,
  informacoes_ocultas jsonb NOT NULL DEFAULT '[]'::jsonb,
  falas_gatilho jsonb NOT NULL DEFAULT '[]'::jsonb,
  escalada jsonb NOT NULL DEFAULT '[]'::jsonb,
  encerramento text,
  palavras_chave text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'ativa',
  favorita boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personas TO authenticated;
GRANT ALL ON public.personas TO service_role;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personas select" ON public.personas FOR SELECT TO authenticated USING (true);
CREATE POLICY "personas insert" ON public.personas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "personas update" ON public.personas FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "personas delete" ON public.personas FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE INDEX personas_status_idx ON public.personas (status);
CREATE INDEX personas_exercicio_idx ON public.personas (exercicio);
CREATE TRIGGER personas_touch BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.persona_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES public.personas(id) ON DELETE CASCADE,
  persona_nome text,
  acao text NOT NULL,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid,
  user_nome text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.persona_historico TO authenticated;
GRANT ALL ON public.persona_historico TO service_role;
ALTER TABLE public.persona_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historico select" ON public.persona_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "historico insert" ON public.persona_historico FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.persona_materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  path text NOT NULL,
  tipo text,
  tamanho bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
GRANT SELECT, INSERT, DELETE ON public.persona_materiais TO authenticated;
GRANT ALL ON public.persona_materiais TO service_role;
ALTER TABLE public.persona_materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materiais select" ON public.persona_materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "materiais insert" ON public.persona_materiais FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "materiais delete" ON public.persona_materiais FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE public.perfis_comportamentais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
GRANT SELECT, INSERT, DELETE ON public.perfis_comportamentais TO authenticated;
GRANT ALL ON public.perfis_comportamentais TO service_role;
ALTER TABLE public.perfis_comportamentais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfis select" ON public.perfis_comportamentais FOR SELECT TO authenticated USING (true);
CREATE POLICY "perfis insert" ON public.perfis_comportamentais FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "perfis delete" ON public.perfis_comportamentais FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE public.simulacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Nova Simulação',
  exercicio text,
  responsavel text,
  observacoes text,
  persona_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulacoes TO authenticated;
GRANT ALL ON public.simulacoes TO service_role;
ALTER TABLE public.simulacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "simulacoes select" ON public.simulacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "simulacoes insert" ON public.simulacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "simulacoes update" ON public.simulacoes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "simulacoes delete" ON public.simulacoes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE TRIGGER simulacoes_touch BEFORE UPDATE ON public.simulacoes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "materiais storage select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'persona-materiais');
CREATE POLICY "materiais storage insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'persona-materiais');
CREATE POLICY "materiais storage delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'persona-materiais');
