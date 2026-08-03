-- Cadastro central de colaboradores
CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  username text NOT NULL UNIQUE,
  cargo text NOT NULL DEFAULT '',
  setor text NOT NULL DEFAULT '',
  celula text NOT NULL DEFAULT '',
  data_admissao date,
  status text NOT NULL DEFAULT 'ativo',
  campos_extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO authenticated;
GRANT ALL ON public.colaboradores TO service_role;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colaboradores_select_autenticado" ON public.colaboradores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "colaboradores_admin_insert" ON public.colaboradores
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "colaboradores_admin_update" ON public.colaboradores
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "colaboradores_admin_delete" ON public.colaboradores
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER colaboradores_touch BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Liberações de treinamentos e atividades
CREATE TABLE public.colaborador_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  ref_id uuid,
  titulo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  concluida_em timestamptz,
  avaliacao_id uuid,
  observacao text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (colaborador_id, tipo, ref_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaborador_atividades TO authenticated;
GRANT ALL ON public.colaborador_atividades TO service_role;
ALTER TABLE public.colaborador_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atividades_select_autenticado" ON public.colaborador_atividades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "atividades_admin_insert" ON public.colaborador_atividades
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "atividades_admin_update" ON public.colaborador_atividades
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "atividades_admin_delete" ON public.colaborador_atividades
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX colaborador_atividades_colaborador_idx ON public.colaborador_atividades (colaborador_id, ordem);

CREATE TRIGGER colaborador_atividades_touch BEFORE UPDATE ON public.colaborador_atividades
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Histórico do colaborador
CREATE TABLE public.colaborador_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  acao text NOT NULL,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid,
  user_nome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.colaborador_historico TO authenticated;
GRANT ALL ON public.colaborador_historico TO service_role;
ALTER TABLE public.colaborador_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_select_autenticado" ON public.colaborador_historico
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "historico_insert_autenticado" ON public.colaborador_historico
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Vínculo das avaliações de checklist com o colaborador cadastrado
ALTER TABLE public.avaliacoes ADD COLUMN colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.sincronizar_atividade_avaliacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.colaborador_id IS NOT NULL AND NEW.status = 'concluida' THEN
    UPDATE public.colaborador_atividades
       SET status = 'concluida',
           concluida_em = now(),
           avaliacao_id = NEW.id,
           updated_at = now()
     WHERE colaborador_id = NEW.colaborador_id
       AND tipo = 'checklist'
       AND ref_id = NEW.checklist_id
       AND status <> 'concluida';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER avaliacoes_sincroniza_atividade
  AFTER INSERT OR UPDATE OF status, colaborador_id ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.sincronizar_atividade_avaliacao();

-- Permissão e módulo
INSERT INTO public.permissions (key, name, description)
VALUES ('colaboradores', 'Colaboradores', 'Acesso ao módulo de gestão de colaboradores')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_key, permission_key) VALUES
  ('administrador', 'colaboradores'),
  ('avaliador', 'colaboradores'),
  ('auxiliar', 'colaboradores')
ON CONFLICT DO NOTHING;

INSERT INTO public.modules (key, name, description, icon, route, permission_key, active, sort_order)
VALUES ('colaboradores', 'Colaboradores', 'Cadastro central de colaboradores, liberação de treinamentos e acompanhamento de pendências.', 'UserRound', '/colaboradores', 'colaboradores', true, 5)
ON CONFLICT (key) DO NOTHING;