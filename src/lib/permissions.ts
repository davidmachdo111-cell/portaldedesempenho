/**
 * Motor central de autorização do Portal de Desempenho.
 *
 * Toda permissão é uma chave explícita no formato `modulo.acao`. Os perfis
 * (Administrador, Avaliador, Auxiliar) apenas agrupam essas chaves no banco;
 * permissões individuais são ADITIVAS (lógica OU) e nunca revogam um acesso
 * nativo do perfil.
 *
 * Para incluir um novo módulo basta cadastrar novas chaves aqui e na matriz do
 * banco (tabela `permissions` + `role_permissions`) — nenhuma refatoração do
 * motor de verificação é necessária.
 */
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const PERM = {
  administracao: { ver: "administracao.ver" },
  dashboard: { ver: "dashboard.ver" },
  colaboradores: {
    ver: "colaboradores.ver",
    criar: "colaboradores.criar",
    editar: "colaboradores.editar",
    excluir: "colaboradores.excluir",
  },
  personagens: {
    ver: "personagens.ver",
    criar: "personagens.criar",
    editar: "personagens.editar",
    excluir: "personagens.excluir",
    download: "personagens.download",
  },
  checklists: {
    ver: "checklists.ver",
    aplicar: "checklists.aplicar",
    mestreCriar: "checklists.mestre_criar",
    mestreEditar: "checklists.mestre_editar",
    mestreExcluir: "checklists.mestre_excluir",
  },
  treinamentos: { ver: "treinamentos.ver", concluir: "treinamentos.concluir" },
  meusConteudos: { ver: "meus_conteudos.ver" },
  relatorios: { ver: "relatorios.ver", exportar: "relatorios.exportar" },
  usuarios: { criar: "usuarios.criar", editar: "usuarios.editar", excluir: "usuarios.excluir" },
  configuracoes: { ver: "configuracoes.ver", alterar: "configuracoes.alterar" },
} as const;

/** Conjuntos usados como "gerenciar" (qualquer ação de escrita do módulo). */
export const GERENCIAR = {
  colaboradores: [PERM.colaboradores.criar, PERM.colaboradores.editar, PERM.colaboradores.excluir],
  personagens: [PERM.personagens.criar, PERM.personagens.editar, PERM.personagens.excluir],
  checklistsMestre: [
    PERM.checklists.mestreCriar,
    PERM.checklists.mestreEditar,
    PERM.checklists.mestreExcluir,
  ],
} as const;

export const ROLE_ADMIN = "administrador";

/**
 * Guarda de rota: valida no back-end (RPC com SECURITY DEFINER) para que a
 * troca manual de URL ou chamadas diretas à API não driblem a permissão.
 */
export async function exigirPermissao(
  permissoes: readonly string[],
  destinoNegado: "/portal" | "/checklists/avaliacoes" | "/colaboradores" = "/portal",
) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw redirect({ to: "/auth" });

  const { data: allowed } = await supabase.rpc("has_any_permission", {
    _user_id: data.user.id,
    _permissions: [...permissoes],
  });
  if (allowed !== true) throw redirect({ to: destinoNegado });
  return { user: data.user };
}
