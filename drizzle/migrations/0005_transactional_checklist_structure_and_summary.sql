CREATE OR REPLACE FUNCTION public.salvar_checklist_estrutura(_estrutura jsonb,_novo boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cid uuid:=(_estrutura->'checklist'->>'id')::uuid; c jsonb:=_estrutura->'checklist'; atual timestamptz; r jsonb; secs uuid[]; crits uuid[]; exs uuid[]; sid uuid; eid uuid; crid uuid;
BEGIN
IF auth.uid() IS NULL OR NOT public.has_permission(auth.uid(),CASE WHEN _novo THEN 'checklists.mestre_criar' ELSE 'checklists.mestre_editar' END) THEN RAISE EXCEPTION 'Sem permissão para salvar este checklist.' USING ERRCODE='42501'; END IF;
IF jsonb_typeof(_estrutura->'secoes')<>'array' OR jsonb_typeof(_estrutura->'criterios')<>'array' OR jsonb_typeof(_estrutura->'exercicios')<>'array' OR jsonb_typeof(_estrutura->'vinculos')<>'array' OR length(trim(c->>'nome'))=0 THEN RAISE EXCEPTION 'Estrutura de checklist inválida.'; END IF;
IF _novo THEN
INSERT INTO public.checklists(id,nome,created_by) VALUES(cid,c->>'nome',auth.uid());
ELSE
SELECT updated_at INTO atual FROM public.checklists WHERE id=cid FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Checklist não encontrado.'; END IF;
IF (c->>'updated_at') IS NULL OR atual IS DISTINCT FROM (c->>'updated_at')::timestamptz THEN RAISE EXCEPTION 'Este checklist foi alterado por outra pessoa. Recarregue antes de salvar.' USING ERRCODE='40001'; END IF;
END IF;
SELECT coalesce(array_agg((x->>'id')::uuid),'{}') INTO secs FROM jsonb_array_elements(_estrutura->'secoes') x;
SELECT coalesce(array_agg((x->>'id')::uuid),'{}') INTO crits FROM jsonb_array_elements(_estrutura->'criterios') x;
SELECT coalesce(array_agg((x->>'id')::uuid),'{}') INTO exs FROM jsonb_array_elements(_estrutura->'exercicios') x;
IF cardinality(secs)<>(SELECT count(DISTINCT x) FROM unnest(secs) x) OR cardinality(crits)<>(SELECT count(DISTINCT x) FROM unnest(crits) x) OR cardinality(exs)<>(SELECT count(DISTINCT x) FROM unnest(exs) x) THEN RAISE EXCEPTION 'IDs duplicados na estrutura.'; END IF;
IF EXISTS(SELECT 1 FROM public.secoes WHERE id=ANY(secs) AND checklist_id<>cid) OR EXISTS(SELECT 1 FROM public.criterios WHERE id=ANY(crits) AND checklist_id<>cid) OR EXISTS(SELECT 1 FROM public.exercicios WHERE id=ANY(exs) AND checklist_id<>cid) THEN RAISE EXCEPTION 'Não é permitido mover registros de outro checklist.'; END IF;
UPDATE public.checklists SET nome=c->>'nome',descricao=coalesce(c->>'descricao',''),categoria_id=nullif(c->>'categoria_id','')::uuid,nota_minima=coalesce((c->>'nota_minima')::numeric,70),permite_observacoes=coalesce((c->>'permite_observacoes')::boolean,true),observacoes_obrigatorias=coalesce((c->>'observacoes_obrigatorias')::boolean,false),pontos_fortes_modo=coalesce(c->>'pontos_fortes_modo','opcional'),pontos_desenvolvimento_modo=coalesce(c->>'pontos_desenvolvimento_modo','opcional'),ativo=coalesce((c->>'ativo')::boolean,true) WHERE id=cid;
FOR r IN SELECT value FROM jsonb_array_elements(_estrutura->'secoes') LOOP
INSERT INTO public.secoes(id,checklist_id,nome,ordem) VALUES((r->>'id')::uuid,cid,r->>'nome',(r->>'ordem')::integer) ON CONFLICT(id) DO UPDATE SET nome=excluded.nome,ordem=excluded.ordem;
END LOOP;
FOR r IN SELECT value FROM jsonb_array_elements(_estrutura->'criterios') LOOP
sid:=nullif(r->>'secao_id','')::uuid;
IF sid IS NOT NULL AND NOT sid=ANY(secs) THEN RAISE EXCEPTION 'Seção inexistente na estrutura.'; END IF;
INSERT INTO public.criterios(id,checklist_id,secao_id,nome,peso,obrigatorio,ordem) VALUES((r->>'id')::uuid,cid,sid,r->>'nome',(r->>'peso')::integer,(r->>'obrigatorio')::boolean,(r->>'ordem')::integer) ON CONFLICT(id) DO UPDATE SET secao_id=excluded.secao_id,nome=excluded.nome,peso=excluded.peso,obrigatorio=excluded.obrigatorio,ordem=excluded.ordem;
END LOOP;
FOR r IN SELECT value FROM jsonb_array_elements(_estrutura->'exercicios') LOOP
INSERT INTO public.exercicios(id,checklist_id,nome,obrigatorio,ordem) VALUES((r->>'id')::uuid,cid,r->>'nome',(r->>'obrigatorio')::boolean,(r->>'ordem')::integer) ON CONFLICT(id) DO UPDATE SET nome=excluded.nome,obrigatorio=excluded.obrigatorio,ordem=excluded.ordem;
END LOOP;
FOR r IN SELECT value FROM jsonb_array_elements(_estrutura->'vinculos') LOOP
eid:=(r->>'exercicio_id')::uuid; crid:=(r->>'criterio_id')::uuid;
IF NOT eid=ANY(exs) OR NOT crid=ANY(crits) THEN RAISE EXCEPTION 'Vínculo inválido na estrutura.'; END IF;
INSERT INTO public.checklist_exercicio_criterios(checklist_id,exercicio_id,criterio_id) VALUES(cid,eid,crid) ON CONFLICT(exercicio_id,criterio_id) DO NOTHING;
END LOOP;
DELETE FROM public.checklist_exercicio_criterios v WHERE checklist_id=cid AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_estrutura->'vinculos') x WHERE (x->>'exercicio_id')::uuid=v.exercicio_id AND (x->>'criterio_id')::uuid=v.criterio_id);
DELETE FROM public.criterios WHERE checklist_id=cid AND NOT id=ANY(crits);
DELETE FROM public.exercicios WHERE checklist_id=cid AND NOT id=ANY(exs);
DELETE FROM public.secoes WHERE checklist_id=cid AND NOT id=ANY(secs);
RETURN (SELECT to_jsonb(t) FROM public.checklists t WHERE id=cid);
END $$;
REVOKE ALL ON FUNCTION public.salvar_checklist_estrutura(jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_checklist_estrutura(jsonb,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.touch_checklist_structure() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.checklists SET updated_at=clock_timestamp() WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD.checklist_id ELSE NEW.checklist_id END; RETURN NULL; END $$;
CREATE TRIGGER secoes_touch_checklist AFTER INSERT OR UPDATE OR DELETE ON public.secoes FOR EACH ROW EXECUTE FUNCTION public.touch_checklist_structure();
CREATE TRIGGER criterios_touch_checklist AFTER INSERT OR UPDATE OR DELETE ON public.criterios FOR EACH ROW EXECUTE FUNCTION public.touch_checklist_structure();
CREATE TRIGGER exercicios_touch_checklist AFTER INSERT OR UPDATE OR DELETE ON public.exercicios FOR EACH ROW EXECUTE FUNCTION public.touch_checklist_structure();
CREATE TRIGGER vinculos_touch_checklist AFTER INSERT OR UPDATE OR DELETE ON public.checklist_exercicio_criterios FOR EACH ROW EXECUTE FUNCTION public.touch_checklist_structure();
CREATE OR REPLACE FUNCTION public.resumo_avaliacoes() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT jsonb_build_object('total',count(*),'concluidas',count(*) FILTER(WHERE status='concluida'),'media',coalesce(avg(media) FILTER(WHERE status='concluida'),0),'recentes',coalesce((SELECT jsonb_agg(r) FROM(SELECT id,colaborador_nome,setor,data_avaliacao,status,media,updated_at FROM public.avaliacoes ORDER BY updated_at DESC LIMIT 6) r),'[]'::jsonb)) FROM public.avaliacoes; $$;
REVOKE ALL ON FUNCTION public.resumo_avaliacoes() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.resumo_avaliacoes() TO authenticated;