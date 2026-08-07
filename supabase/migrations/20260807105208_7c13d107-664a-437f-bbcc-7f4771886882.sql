-- 1. Permissions table: hierarquia Módulo > Ação
ALTER TABLE public.permissions
  ADD COLUMN IF NOT EXISTS module_key text NOT NULL DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS module_name text NOT NULL DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS action_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

INSERT INTO public.permissions (key, name, description, module_key, module_name, action_name, sort_order) VALUES
  ('administracao.ver','Administração: Visualizar','Acessar o painel de administração central','administracao','Administração','Visualizar Administração',10),
  ('dashboard.ver','Dashboard: Visualizar','Acessar o portal/dashboard inicial','dashboard','Dashboard','Visualizar',20),
  ('colaboradores.ver','Colaboradores: Visualizar','Ver a lista e os detalhes dos colaboradores','colaboradores','Colaboradores','Visualizar',30),
  ('colaboradores.criar','Colaboradores: Criar','Cadastrar novos colaboradores','colaboradores','Colaboradores','Criar',31),
  ('colaboradores.editar','Colaboradores: Editar','Editar colaboradores e liberar atividades','colaboradores','Colaboradores','Editar',32),
  ('colaboradores.excluir','Colaboradores: Excluir','Excluir colaboradores','colaboradores','Colaboradores','Excluir',33),
  ('personagens.ver','Personagens e Simulados: Visualizar','Ver personagens, simulados e seus materiais','personagens','Personagens e Simulados','Visualizar',40),
  ('personagens.criar','Personagens e Simulados: Criar','Cadastrar personagens, simulados e anexos','personagens','Personagens e Simulados','Criar',41),
  ('personagens.editar','Personagens e Simulados: Editar','Editar personagens, simulados e anexos','personagens','Personagens e Simulados','Editar',42),
  ('personagens.excluir','Personagens e Simulados: Excluir','Excluir personagens, simulados e anexos','personagens','Personagens e Simulados','Excluir',43),
  ('personagens.download','Personagens e Simulados: Download de Materiais','Baixar PDFs e anexos liberados','personagens','Personagens e Simulados','Download de Materiais',44),
  ('checklists.ver','Checklists: Visualizar','Consultar checklists e avaliações','checklists','Checklists','Visualizar',50),
  ('checklists.aplicar','Checklists: Aplicar','Preencher e concluir avaliações','checklists','Checklists','Aplicar Checklist',51),
  ('checklists.mestre_criar','Checklists: Criar Checklist Mestre','Criar modelos de checklist','checklists','Checklists','Criar Checklist Mestre',52),
  ('checklists.mestre_editar','Checklists: Editar Checklist Mestre','Editar modelos, setores e liberações','checklists','Checklists','Editar Checklist Mestre',53),
  ('checklists.mestre_excluir','Checklists: Excluir Checklist Mestre','Excluir modelos de checklist','checklists','Checklists','Excluir Checklist Mestre',54),
  ('treinamentos.ver','Treinamentos e Atividades: Visualizar','Ver treinamentos e atividades vinculadas','treinamentos','Treinamentos e Atividades','Visualizar',60),
  ('treinamentos.concluir','Treinamentos e Atividades: Marcar como Concluído','Registrar conclusão de treinamentos','treinamentos','Treinamentos e Atividades','Marcar como Concluído',61),
  ('meus_conteudos.ver','Meus Conteúdos: Visualizar','Acessar os conteúdos liberados para o usuário','meus_conteudos','Meus Conteúdos','Visualizar',70),
  ('relatorios.ver','Relatórios: Visualizar','Ver dashboards e relatórios consolidados','relatorios','Relatórios','Visualizar',80),
  ('relatorios.exportar','Relatórios: Exportar Dados','Exportar e baixar relatórios','relatorios','Relatórios','Exportar Dados',81),
  ('usuarios.criar','Usuários: Criar','Cadastrar usuários da plataforma','usuarios','Usuários','Criar Usuários',90),
  ('usuarios.editar','Usuários: Editar','Editar usuários, perfis e permissões','usuarios','Usuários','Editar Usuários',91),
  ('usuarios.excluir','Usuários: Excluir','Excluir usuários','usuarios','Usuários','Excluir Usuários',92),
  ('configuracoes.ver','Configurações: Visualizar','Ver configurações gerais do sistema','configuracoes','Configurações','Visualizar Configurações',100),
  ('configuracoes.alterar','Configurações: Alterar','Alterar configurações gerais do sistema','configuracoes','Configurações','Alterar Configurações',101)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, module_key = EXCLUDED.module_key,
  module_name = EXCLUDED.module_name, action_name = EXCLUDED.action_name, sort_order = EXCLUDED.sort_order;

-- 2. Equivalências (chaves antigas -> novas), usadas pelo motor de autorização
CREATE TABLE IF NOT EXISTS public.permission_aliases (
  legacy_key text NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (legacy_key, permission_key)
);
GRANT SELECT ON public.permission_aliases TO authenticated;
GRANT ALL ON public.permission_aliases TO service_role;
ALTER TABLE public.permission_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aliases_read" ON public.permission_aliases;
CREATE POLICY "aliases_read" ON public.permission_aliases FOR SELECT TO authenticated USING (true);

INSERT INTO public.permission_aliases (legacy_key, permission_key) VALUES
  ('administracao','administracao.ver'),
  ('colaboradores','colaboradores.ver'),
  ('colaboradores_gerenciar','colaboradores.criar'),
  ('colaboradores_gerenciar','colaboradores.editar'),
  ('colaboradores_gerenciar','colaboradores.excluir'),
  ('checklists','checklists.ver'),
  ('checklists','checklists.aplicar'),
  ('checklists_gerenciar','checklists.mestre_criar'),
  ('checklists_gerenciar','checklists.mestre_editar'),
  ('checklists_gerenciar','checklists.mestre_excluir'),
  ('personagens_simulados','personagens.ver'),
  ('meus_conteudos','meus_conteudos.ver')
ON CONFLICT DO NOTHING;

-- 3. Converte permissões individuais legadas para as novas chaves
INSERT INTO public.user_permissions (user_id, permission_key)
SELECT DISTINCT up.user_id, a.permission_key
FROM public.user_permissions up
JOIN public.permission_aliases a ON a.legacy_key = up.permission_key
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_permissions x
  WHERE x.user_id = up.user_id AND x.permission_key = a.permission_key
);

DELETE FROM public.user_permissions
WHERE permission_key IN ('administracao','colaboradores','colaboradores_gerenciar','checklists','checklists_gerenciar','personagens_simulados','meus_conteudos');

-- 4. Matriz de perfis
DELETE FROM public.role_permissions;

INSERT INTO public.role_permissions (role_key, permission_key)
SELECT 'administrador', key FROM public.permissions;

INSERT INTO public.role_permissions (role_key, permission_key) VALUES
  ('avaliador','dashboard.ver'),
  ('avaliador','colaboradores.ver'),
  ('avaliador','personagens.ver'),
  ('avaliador','personagens.download'),
  ('avaliador','checklists.ver'),
  ('avaliador','checklists.aplicar'),
  ('avaliador','treinamentos.ver'),
  ('avaliador','meus_conteudos.ver'),
  ('avaliador','relatorios.ver'),
  ('auxiliar','dashboard.ver'),
  ('auxiliar','colaboradores.ver'),
  ('auxiliar','personagens.ver'),
  ('auxiliar','personagens.download'),
  ('auxiliar','treinamentos.ver'),
  ('auxiliar','treinamentos.concluir'),
  ('auxiliar','meus_conteudos.ver');

-- 5. Módulos apontando para as novas chaves
UPDATE public.modules SET permission_key = 'administracao.ver' WHERE key = 'administracao';
UPDATE public.modules SET permission_key = 'checklists.ver' WHERE key = 'checklists';
UPDATE public.modules SET permission_key = 'colaboradores.ver' WHERE key = 'colaboradores';
UPDATE public.modules SET permission_key = 'personagens.ver' WHERE key = 'personagens_simulados';
UPDATE public.modules SET permission_key = 'meus_conteudos.ver' WHERE key = 'meus_conteudos';

-- 6. Remove chaves legadas da matriz
DELETE FROM public.permissions
WHERE key IN ('administracao','colaboradores','colaboradores_gerenciar','checklists','checklists_gerenciar','personagens_simulados','meus_conteudos');

-- 7. Motor de autorização unificado (perfil OU permissão individual, admin sempre liberado)
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH alvo AS (
    SELECT _permission AS k
    UNION
    SELECT a.permission_key FROM public.permission_aliases a WHERE a.legacy_key = _permission
  )
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role_key = 'administrador')
    OR EXISTS (
      SELECT 1 FROM public.user_permissions up JOIN alvo ON alvo.k = up.permission_key
      WHERE up.user_id = _user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role_key = ur.role_key
      JOIN alvo ON alvo.k = rp.permission_key
      WHERE ur.user_id = _user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.has_any_permission(_user_id uuid, _permissions text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM unnest(_permissions) p WHERE public.has_permission(_user_id, p));
$$;

CREATE OR REPLACE FUNCTION public.pode_ver_colaboradores(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_permission(_user_id, 'colaboradores.ver'); $$;

CREATE OR REPLACE FUNCTION public.pode_gerenciar_colaboradores(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_any_permission(_user_id, ARRAY['colaboradores.criar','colaboradores.editar','colaboradores.excluir']); $$;

CREATE OR REPLACE FUNCTION public.pode_gerenciar_personas(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_any_permission(_user_id, ARRAY['personagens.criar','personagens.editar','personagens.excluir']); $$;

CREATE OR REPLACE FUNCTION public.pode_gerenciar_checklists(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_any_permission(_user_id, ARRAY['checklists.mestre_criar','checklists.mestre_editar','checklists.mestre_excluir']); $$;

CREATE OR REPLACE FUNCTION public.pode_avaliar(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_permission(_user_id, 'checklists.aplicar'); $$;

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_permission(uuid, text[]) TO authenticated;
