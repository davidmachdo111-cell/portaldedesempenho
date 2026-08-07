CREATE TABLE public.checklist_exercicio_criterios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  exercicio_id uuid NOT NULL REFERENCES public.exercicios(id) ON DELETE CASCADE,
  criterio_id uuid NOT NULL REFERENCES public.criterios(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (exercicio_id, criterio_id)
);

CREATE INDEX idx_cec_checklist ON public.checklist_exercicio_criterios (checklist_id);
CREATE INDEX idx_cec_exercicio ON public.checklist_exercicio_criterios (exercicio_id);
CREATE INDEX idx_cec_criterio ON public.checklist_exercicio_criterios (criterio_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_exercicio_criterios TO authenticated;
GRANT ALL ON public.checklist_exercicio_criterios TO service_role;

ALTER TABLE public.checklist_exercicio_criterios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cec_select" ON public.checklist_exercicio_criterios
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'checklists'));

CREATE POLICY "cec_manage" ON public.checklist_exercicio_criterios
  FOR ALL TO authenticated
  USING (public.pode_gerenciar_checklists(auth.uid()))
  WITH CHECK (public.pode_gerenciar_checklists(auth.uid()));