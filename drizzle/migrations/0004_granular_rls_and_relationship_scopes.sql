DO $$ DECLARE t text; p record; prefix text; ins text; upd text; del text; BEGIN
FOR t,prefix,ins,upd,del IN SELECT * FROM (VALUES ('checklists','checklists','checklists.mestre_criar','checklists.mestre_editar','checklists.mestre_excluir'),('secoes','secoes','checklists.mestre_editar','checklists.mestre_editar','checklists.mestre_editar'),('criterios','criterios','checklists.mestre_editar','checklists.mestre_editar','checklists.mestre_editar'),('exercicios','exercicios','checklists.mestre_editar','checklists.mestre_editar','checklists.mestre_editar'),('checklist_exercicio_criterios','cec','checklists.mestre_editar','checklists.mestre_editar','checklists.mestre_editar'),('categorias','categorias','checklists.mestre_criar','checklists.mestre_editar','checklists.mestre_excluir'),('setores','setores','checklists.mestre_criar','checklists.mestre_editar','checklists.mestre_excluir'),('colaboradores','colaboradores','colaboradores.criar','colaboradores.editar','colaboradores.excluir'),('colaborador_atividades','atividades','colaboradores.editar','colaboradores.editar','colaboradores.editar'),('colaborador_exercicios','colaborador_exercicios','colaboradores.editar','colaboradores.editar','colaboradores.editar'),('personas','personas','personagens.criar','personagens.editar','personagens.excluir'),('simulacoes','simulacoes','personagens.criar','personagens.editar','personagens.excluir'),('simulacao_personas','simulacao_personas','personagens.editar','personagens.editar','personagens.editar'),('persona_materiais','materiais','personagens.editar','personagens.editar','personagens.excluir')) x LOOP
FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t AND cmd='ALL' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t); END LOOP;
EXECUTE format('CREATE POLICY granular_insert ON public.%I FOR INSERT TO authenticated WITH CHECK(public.has_permission(auth.uid(),%L))',t,ins);
EXECUTE format('CREATE POLICY granular_update ON public.%I FOR UPDATE TO authenticated USING(public.has_permission(auth.uid(),%L)) WITH CHECK(public.has_permission(auth.uid(),%L))',t,upd,upd);
EXECUTE format('CREATE POLICY granular_delete ON public.%I FOR DELETE TO authenticated USING(public.has_permission(auth.uid(),%L))',t,del);
IF t IN ('checklists','secoes','criterios','exercicios','checklist_exercicio_criterios','categorias','setores') THEN
EXECUTE format('ALTER POLICY %I ON public.%I USING(public.pode_ler_checklist(%s))',prefix||'_select',t,CASE WHEN t='checklists' THEN 'id' WHEN t IN ('categorias','setores') THEN 'NULL' ELSE 'checklist_id' END);
ELSE
EXECUTE format('CREATE POLICY management_read ON public.%I FOR SELECT TO authenticated USING(public.has_any_permission(auth.uid(),ARRAY[%L,%L,%L]))',t,ins,upd,del);
END IF;
END LOOP;
END $$;
ALTER POLICY colaboradores_select ON public.colaboradores USING(public.pode_acessar_colaborador(id));
CREATE POLICY collaborator_scope ON public.colaboradores AS RESTRICTIVE FOR SELECT TO authenticated USING(public.pode_acessar_colaborador(id));
CREATE POLICY collaborator_update_scope ON public.colaboradores AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.pode_acessar_colaborador(id)) WITH CHECK(public.pode_acessar_colaborador(id));
CREATE POLICY collaborator_delete_scope ON public.colaboradores AS RESTRICTIVE FOR DELETE TO authenticated USING(public.pode_acessar_colaborador(id));
ALTER POLICY granular_insert ON public.colaboradores WITH CHECK(public.has_permission(auth.uid(),'colaboradores.criar') AND created_by=auth.uid());
ALTER POLICY resp_select ON public.colaborador_responsaveis USING(public.pode_acessar_colaborador(colaborador_id));
CREATE POLICY activity_scope ON public.colaborador_atividades AS RESTRICTIVE FOR ALL TO authenticated USING(public.pode_acessar_colaborador(colaborador_id)) WITH CHECK(public.pode_acessar_colaborador(colaborador_id));
CREATE POLICY exercise_scope ON public.colaborador_exercicios AS RESTRICTIVE FOR ALL TO authenticated USING(public.pode_acessar_colaborador(colaborador_id)) WITH CHECK(public.pode_acessar_colaborador(colaborador_id));
CREATE POLICY history_scope ON public.colaborador_historico AS RESTRICTIVE FOR ALL TO authenticated USING(public.pode_acessar_colaborador(colaborador_id)) WITH CHECK(public.pode_acessar_colaborador(colaborador_id));
CREATE POLICY checklist_activity_visibility ON public.colaborador_atividades AS RESTRICTIVE FOR SELECT TO authenticated USING(tipo<>'checklist' OR public.pode_ler_checklist(ref_id));
ALTER POLICY "avaliacoes insercao do avaliador" ON public.avaliacoes WITH CHECK(avaliador_id=auth.uid() AND public.pode_avaliar(auth.uid()) AND (colaborador_id IS NULL OR public.pode_acessar_colaborador(colaborador_id)) AND (public.is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.atribuicoes a WHERE a.checklist_id=avaliacoes.checklist_id AND a.avaliador_id=auth.uid()) OR EXISTS(SELECT 1 FROM public.colaborador_atividades a WHERE a.tipo='checklist' AND a.ref_id=avaliacoes.checklist_id AND a.colaborador_id=avaliacoes.colaborador_id AND public.pode_acessar_colaborador(a.colaborador_id))));
ALTER POLICY "avaliacoes atualizacao do avaliador" ON public.avaliacoes USING(avaliador_id=auth.uid() AND public.pode_avaliar(auth.uid()) AND (colaborador_id IS NULL OR public.pode_acessar_colaborador(colaborador_id))) WITH CHECK(avaliador_id=auth.uid() AND public.pode_avaliar(auth.uid()) AND (colaborador_id IS NULL OR public.pode_acessar_colaborador(colaborador_id)));
ALTER POLICY "avaliacoes exclusao do avaliador" ON public.avaliacoes USING(avaliador_id=auth.uid() AND public.pode_avaliar(auth.uid()) AND (colaborador_id IS NULL OR public.pode_acessar_colaborador(colaborador_id)));
ALTER POLICY "avaliacoes leitura do avaliador" ON public.avaliacoes USING(avaliador_id=auth.uid() AND public.pode_ler_checklist(checklist_id) AND (colaborador_id IS NULL OR public.pode_acessar_colaborador(colaborador_id)));
CREATE POLICY evaluation_scope ON public.avaliacoes AS RESTRICTIVE FOR ALL TO authenticated USING(colaborador_id IS NULL OR public.pode_acessar_colaborador(colaborador_id)) WITH CHECK(colaborador_id IS NULL OR public.pode_acessar_colaborador(colaborador_id));
CREATE OR REPLACE FUNCTION public.validar_vinculo_checklist() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF TG_TABLE_NAME='criterios' THEN
IF NEW.secao_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.secoes WHERE id=NEW.secao_id AND checklist_id=NEW.checklist_id) THEN RAISE EXCEPTION 'A seção deve pertencer ao mesmo checklist.'; END IF;
ELSE
IF NOT EXISTS(SELECT 1 FROM public.criterios WHERE id=NEW.criterio_id AND checklist_id=NEW.checklist_id) OR NOT EXISTS(SELECT 1 FROM public.exercicios WHERE id=NEW.exercicio_id AND checklist_id=NEW.checklist_id) THEN RAISE EXCEPTION 'Critério e exercício devem pertencer ao mesmo checklist.'; END IF;
END IF; RETURN NEW; END $$;
CREATE TRIGGER criterios_checklist_integrity BEFORE INSERT OR UPDATE ON public.criterios FOR EACH ROW EXECUTE FUNCTION public.validar_vinculo_checklist();
CREATE TRIGGER links_checklist_integrity BEFORE INSERT OR UPDATE ON public.checklist_exercicio_criterios FOR EACH ROW EXECUTE FUNCTION public.validar_vinculo_checklist();
-- Non-manager responsible users may only change progress, not retarget an activity.
CREATE OR REPLACE FUNCTION public.validar_alteracao_atividade() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF auth.uid() IS NOT NULL AND NOT public.has_permission(auth.uid(),'colaboradores.editar') AND (to_jsonb(NEW)-ARRAY['status','concluida_em','updated_at','avaliacao_id','concluido_por','concluido_por_nome']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','concluida_em','updated_at','avaliacao_id','concluido_por','concluido_por_nome']) THEN RAISE EXCEPTION 'Você pode atualizar o andamento, mas não alterar a liberação.'; END IF; RETURN NEW; END $$;
CREATE TRIGGER atividades_progress_only BEFORE UPDATE ON public.colaborador_atividades FOR EACH ROW EXECUTE FUNCTION public.validar_alteracao_atividade();
REVOKE EXECUTE ON FUNCTION public.record_audit_event(text,uuid,text,jsonb,uuid,text,text) FROM PUBLIC,anon,authenticated;
