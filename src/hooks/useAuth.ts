import { useQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/lib/platform-queries";

/**
 * Ponte entre os módulos e a autenticação central da plataforma.
 * Expõe as permissões granulares usadas pelas telas (visualizar x gerenciar),
 * sempre lendo do controle de acesso único (perfis + permissões).
 */
export function useAuth() {
  const { data, isLoading } = useQuery(meQueryOptions);

  const permissions = data?.permissions ?? [];
  const isAdmin = data?.isAdmin ?? false;
  const can = (key: string) => isAdmin || permissions.includes(key);

  return {
    userId: data?.userId ?? null,
    user: data ? { id: data.userId } : null,
    isAdmin,
    isSuperAdmin: isAdmin,
    can,
    // visualização
    podeVerColaboradores: can("colaboradores"),
    podeVerChecklists: can("checklists.ver") || can("checklists.aplicar"),
    podeVerPersonagens: can("personagens_simulados"),
    // gestão
    podeGerenciarColaboradores: ["colaboradores.criar", "colaboradores.editar", "colaboradores.excluir"].some(can),
    podeGerenciarChecklists: ["checklists.mestre_criar", "checklists.mestre_editar", "checklists.mestre_excluir"].some(can),
    podeGerenciarPersonagens: ["personagens.criar", "personagens.editar", "personagens.excluir"].some(can),
    podeCriarColaborador: can("colaboradores.criar"),
    podeEditarColaborador: can("colaboradores.editar"),
    podeExcluirColaborador: can("colaboradores.excluir"),
    podeCriarChecklist: can("checklists.mestre_criar"),
    podeEditarChecklist: can("checklists.mestre_editar"),
    podeExcluirChecklist: can("checklists.mestre_excluir"),
    podeAvaliar: can("checklists.aplicar"),
    isAvaliador: can("checklists.aplicar"),
    username: data?.profile?.username ?? "",
    nome: data?.profile?.full_name || data?.profile?.username || "",
    permissions,
    roleKeys: data?.roleKeys ?? [],
    loading: isLoading,
  };
}
