CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'database',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit events" ON public.audit_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX idx_audit_events_created_at ON public.audit_events (created_at DESC);
CREATE INDEX idx_audit_events_entity ON public.audit_events (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_events_actor ON public.audit_events (actor_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_audit_event(
  _entity_type text,
  _entity_id uuid,
  _action text,
  _summary jsonb DEFAULT '{}'::jsonb,
  _actor_id uuid DEFAULT auth.uid(),
  _actor_name text DEFAULT NULL,
  _source text DEFAULT 'database'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.audit_events(actor_id, actor_name, entity_type, entity_id, action, summary, source)
  VALUES (_actor_id, _actor_name, _entity_type, _entity_id, _action, COALESCE(_summary, '{}'::jsonb), _source)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_audit_event(text, uuid, text, jsonb, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_audit_event(text, uuid, text, jsonb, uuid, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.audit_row_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _row jsonb;
  _entity_id uuid;
  _action text;
  _summary jsonb;
BEGIN
  _row := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  _entity_id := NULLIF(_row->>'id', '')::uuid;
  _action := lower(TG_OP);
  _summary := jsonb_strip_nulls(jsonb_build_object(
    'table', TG_TABLE_NAME,
    'status', _row->>'status',
    'role_key', _row->>'role_key',
    'permission_key', _row->>'permission_key',
    'papel', _row->>'papel',
    'checklist_id', _row->>'checklist_id',
    'colaborador_id', _row->>'colaborador_id',
    'simulacao_id', _row->>'simulacao_id',
    'persona_id', _row->>'persona_id'
  ));
  PERFORM public.record_audit_event(TG_TABLE_NAME, _entity_id, _action, _summary);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_user_permissions AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_role_permissions AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_colaborador_responsaveis AFTER INSERT OR UPDATE OR DELETE ON public.colaborador_responsaveis FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_colaborador_exercicios AFTER INSERT OR UPDATE OR DELETE ON public.colaborador_exercicios FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_simulacao_personas AFTER INSERT OR UPDATE OR DELETE ON public.simulacao_personas FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_colaborador_atividades AFTER INSERT OR UPDATE OR DELETE ON public.colaborador_atividades FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_avaliacoes AFTER INSERT OR UPDATE OR DELETE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_simulacoes AFTER INSERT OR UPDATE OR DELETE ON public.simulacoes FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

CREATE TABLE public.app_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('navigation','performance','error')),
  route text NOT NULL,
  metric text,
  duration_ms integer,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT, SELECT ON public.app_telemetry TO authenticated;
GRANT ALL ON public.app_telemetry TO service_role;
ALTER TABLE public.app_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own telemetry" ON public.app_telemetry FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins read telemetry" ON public.app_telemetry FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX idx_app_telemetry_created_at ON public.app_telemetry (created_at DESC);
CREATE INDEX idx_app_telemetry_type_metric ON public.app_telemetry (event_type, metric, created_at DESC);