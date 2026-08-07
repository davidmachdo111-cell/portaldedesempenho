-- 1. Pivot Exercício (simulacoes) x Personagens ---------------------------------
CREATE TABLE IF NOT EXISTS public.simulacao_personas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulacao_id uuid NOT NULL REFERENCES public.simulacoes(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (simulacao_id, persona_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulacao_personas TO authenticated;
GRANT ALL ON public.simulacao_personas TO service_role;
ALTER TABLE public.simulacao_personas ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS simulacao_personas_simulacao_idx ON public.simulacao_personas(simulacao_id);
CREATE INDEX IF NOT EXISTS simulacao_personas_persona_idx ON public.simulacao_personas(persona_id);

-- Backfill a partir do array atual, sem perder nenhum vínculo existente.
INSERT INTO public.simulacao_personas (simulacao_id, persona_id, ordem)
SELECT s.id, u.pid, (u.ord - 1)::int
  FROM public.simulacoes s
  CROSS JOIN LATERAL unnest(s.persona_ids) WITH ORDINALITY AS u(pid, ord)
  JOIN public.personas p ON p.id = u.pid
ON CONFLICT (simulacao_id, persona_id) DO NOTHING;

-- Mantém simulacoes.persona_ids espelhando o pivot (compatibilidade com telas e PDFs).
CREATE OR REPLACE FUNCTION public.sincronizar_persona_ids()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE alvo uuid;
BEGIN
  alvo := COALESCE(NEW.simulacao_id, OLD.simulacao_id);
  UPDATE public.simulacoes s
     SET persona_ids = COALESCE((
           SELECT array_agg(sp.persona_id ORDER BY sp.ordem, sp.created_at)
             FROM public.simulacao_personas sp
            WHERE sp.simulacao_id = alvo
         ), '{}'::uuid[])
   WHERE s.id = alvo;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS simulacao_personas_sync ON public.simulacao_personas;
CREATE TRIGGER simulacao_personas_sync
AFTER INSERT OR UPDATE OR DELETE ON public.simulacao_personas
FOR EACH ROW EXECUTE FUNCTION public.sincronizar_persona_ids();

-- 2. Pivot Colaborador x Exercício ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.colaborador_exercicios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  simulacao_id uuid NOT NULL REFERENCES public.simulacoes(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (colaborador_id, simulacao_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaborador_exercicios TO authenticated;
GRANT ALL ON public.colaborador_exercicios TO service_role;
ALTER TABLE public.colaborador_exercicios ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS colaborador_exercicios_colab_idx ON public.colaborador_exercicios(colaborador_id);
CREATE INDEX IF NOT EXISTS colaborador_exercicios_simulacao_idx ON public.colaborador_exercicios(simulacao_id);

DROP TRIGGER IF EXISTS colaborador_exercicios_touch ON public.colaborador_exercicios;
CREATE TRIGGER colaborador_exercicios_touch
BEFORE UPDATE ON public.colaborador_exercicios
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Vínculos já existentes em colaborador_atividades continuam valendo; copiamos para o pivot.
INSERT INTO public.colaborador_exercicios (colaborador_id, simulacao_id, created_by)
SELECT ca.colaborador_id, ca.ref_id, ca.created_by
  FROM public.colaborador_atividades ca
  JOIN public.simulacoes s ON s.id = ca.ref_id
 WHERE ca.tipo = 'simulado'
ON CONFLICT (colaborador_id, simulacao_id) DO NOTHING;

-- 3. Visibilidade: somente conteúdo vinculado ao colaborador do usuário --------
CREATE OR REPLACE FUNCTION public.simulado_liberado(_simulacao_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.colaborador_exercicios ce
      JOIN public.colaboradores c ON c.id = ce.colaborador_id
     WHERE ce.simulacao_id = _simulacao_id
       AND (c.user_id = auth.uid() OR public.colaborador_sob_responsabilidade(c.id))
  ) OR EXISTS (
    SELECT 1
      FROM public.colaborador_atividades ca
      JOIN public.colaboradores c ON c.id = ca.colaborador_id
     WHERE ca.tipo = 'simulado'
       AND ca.ref_id = _simulacao_id
       AND (c.user_id = auth.uid() OR public.colaborador_sob_responsabilidade(c.id))
  );
$$;

CREATE OR REPLACE FUNCTION public.persona_liberada(_persona_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.colaborador_atividades ca
      JOIN public.colaboradores c ON c.id = ca.colaborador_id
     WHERE ca.tipo = 'persona'
       AND ca.ref_id = _persona_id
       AND (c.user_id = auth.uid() OR public.colaborador_sob_responsabilidade(c.id))
  ) OR EXISTS (
    SELECT 1
      FROM public.simulacao_personas sp
     WHERE sp.persona_id = _persona_id
       AND public.simulado_liberado(sp.simulacao_id)
  );
$$;

-- 4. Políticas: escrita só para gestores; leitura só do que está vinculado -----
DROP POLICY IF EXISTS simulacoes_select ON public.simulacoes;
CREATE POLICY simulacoes_select ON public.simulacoes FOR SELECT TO authenticated
USING (public.pode_gerenciar_personas(auth.uid()) OR public.simulado_liberado(id));

DROP POLICY IF EXISTS personas_select ON public.personas;
CREATE POLICY personas_select ON public.personas FOR SELECT TO authenticated
USING (public.pode_gerenciar_personas(auth.uid()) OR public.persona_liberada(id));

DROP POLICY IF EXISTS materiais_select ON public.persona_materiais;
CREATE POLICY materiais_select ON public.persona_materiais FOR SELECT TO authenticated
USING (
  public.pode_gerenciar_personas(auth.uid())
  OR (persona_id IS NOT NULL AND public.persona_liberada(persona_id))
  OR (simulacao_id IS NOT NULL AND public.simulado_liberado(simulacao_id))
);

CREATE POLICY simulacao_personas_select ON public.simulacao_personas FOR SELECT TO authenticated
USING (public.pode_gerenciar_personas(auth.uid()) OR public.simulado_liberado(simulacao_id));

CREATE POLICY simulacao_personas_write ON public.simulacao_personas FOR ALL TO authenticated
USING (public.pode_gerenciar_personas(auth.uid()))
WITH CHECK (public.pode_gerenciar_personas(auth.uid()));

CREATE POLICY colaborador_exercicios_select ON public.colaborador_exercicios FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.colaborador_sob_responsabilidade(colaborador_id)
  OR EXISTS (SELECT 1 FROM public.colaboradores c WHERE c.id = colaborador_id AND c.user_id = auth.uid())
);

CREATE POLICY colaborador_exercicios_write ON public.colaborador_exercicios FOR ALL TO authenticated
USING (public.pode_gerenciar_colaboradores(auth.uid()))
WITH CHECK (public.pode_gerenciar_colaboradores(auth.uid()));