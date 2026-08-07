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
    podeVerChecklists: can("checklists"),
    podeVerPersonagens: can("personagens_simulados"),
    // gestão
    podeGerenciarColaboradores: can("colaboradores_gerenciar"),
    podeGerenciarChecklists: can("checklists_gerenciar"),
    podeGerenciarPersonagens: can("personagens_gerenciar"),
    podeAvaliar: can("checklists"),
    isAvaliador: can("checklists"),
    username: data?.profile?.username ?? "",
    nome: data?.profile?.full_name || data?.profile?.username || "",
    permissions,
    roleKeys: data?.roleKeys ?? [],
    loading: isLoading,
  };
}
