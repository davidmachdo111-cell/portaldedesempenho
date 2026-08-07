CREATE TABLE IF NOT EXISTS public.colaborador_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  papel text NOT NULL DEFAULT 'auxiliar',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (colaborador_id, user_id, papel)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaborador_responsaveis TO authenticated;
GRANT ALL ON public.colaborador_responsaveis TO service_role;

ALTER TABLE public.colaborador_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resp_select" ON public.colaborador_responsaveis
  FOR SELECT TO authenticated
  USING (public.pode_ver_colaboradores(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "resp_admin_write" ON public.colaborador_responsaveis
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_resp_colaborador ON public.colaborador_responsaveis(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_resp_user ON public.colaborador_responsaveis(user_id);

CREATE TRIGGER colaborador_responsaveis_touch
  BEFORE UPDATE ON public.colaborador_responsaveis
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.colaborador_sob_responsabilidade(_colaborador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.colaborador_responsaveis r
    WHERE r.colaborador_id = _colaborador_id AND r.user_id = auth.uid()
  );
$$;