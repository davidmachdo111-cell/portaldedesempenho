import { useQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/lib/platform-queries";

/**
 * Ponte entre os módulos e a autenticação central da plataforma.
 * Mantém a mesma superfície usada pelos módulos originais (isAdmin, nome, etc.),
 * porém lendo perfis, papéis e permissões do controle de acesso único.
 */
export function useAuth() {
  const { data, isLoading } = useQuery(meQueryOptions);

  return {
    userId: data?.userId ?? null,
    user: data ? { id: data.userId } : null,
    isAdmin: data?.isAdmin ?? false,
    isSuperAdmin: data?.isAdmin ?? false,
    isAvaliador: Boolean(data),
    username: data?.profile?.username ?? "",
    nome: data?.profile?.full_name || data?.profile?.username || "",
    permissions: data?.permissions ?? [],
    roleKeys: data?.roleKeys ?? [],
    loading: isLoading,
  };
}
