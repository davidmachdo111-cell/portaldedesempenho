import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/lib/platform-queries";
import { GERENCIAR, PERM, ROLE_ADMIN } from "@/lib/permissions";

/**
 * Hook único de autorização no front-end.
 *
 * Modelo aditivo: permissões do perfil OU permissões individuais.
 * O Administrador sempre recebe acesso total (nenhum recurso é bloqueado).
 */
export function usePermissions() {
  const { data, isLoading } = useQuery(meQueryOptions);

  return useMemo(() => {
    const permissions = data?.permissions ?? [];
    const roleKeys = data?.roleKeys ?? [];
    const isAdmin = roleKeys.includes(ROLE_ADMIN) || (data?.isAdmin ?? false);

    const can = (key: string) => isAdmin || permissions.includes(key);
    const canAny = (keys: readonly string[]) => isAdmin || keys.some((k) => permissions.includes(k));
    const canAll = (keys: readonly string[]) =>
      isAdmin || keys.every((k) => permissions.includes(k));

    return {
      loading: isLoading,
      userId: data?.userId ?? null,
      username: data?.profile?.username ?? "",
      nome: data?.profile?.full_name || data?.profile?.username || "",
      roleKeys,
      permissions,
      isAdmin,
      can,
      canAny,
      canAll,
      PERM,
      // Atalhos por módulo (derivados da matriz, nunca hardcoded por perfil)
      dashboard: { ver: can(PERM.dashboard.ver) },
      administracao: { ver: can(PERM.administracao.ver) },
      colaboradoresPerm: {
        ver: can(PERM.colaboradores.ver),
        criar: can(PERM.colaboradores.criar),
        editar: can(PERM.colaboradores.editar),
        excluir: can(PERM.colaboradores.excluir),
        gerenciar: canAny(GERENCIAR.colaboradores),
      },
      personagensPerm: {
        ver: can(PERM.personagens.ver),
        criar: can(PERM.personagens.criar),
        editar: can(PERM.personagens.editar),
        excluir: can(PERM.personagens.excluir),
        download: can(PERM.personagens.download),
        gerenciar: canAny(GERENCIAR.personagens),
      },
      checklistsPerm: {
        ver: can(PERM.checklists.ver),
        aplicar: can(PERM.checklists.aplicar),
        gerenciarMestre: canAny(GERENCIAR.checklistsMestre),
        excluirMestre: can(PERM.checklists.mestreExcluir),
      },
      treinamentosPerm: {
        ver: can(PERM.treinamentos.ver),
        concluir: can(PERM.treinamentos.concluir),
      },
      meusConteudosPerm: { ver: can(PERM.meusConteudos.ver) },
      relatoriosPerm: { ver: can(PERM.relatorios.ver), exportar: can(PERM.relatorios.exportar) },
      usuariosPerm: {
        criar: can(PERM.usuarios.criar),
        editar: can(PERM.usuarios.editar),
        excluir: can(PERM.usuarios.excluir),
      },
      configuracoesPerm: {
        ver: can(PERM.configuracoes.ver),
        alterar: can(PERM.configuracoes.alterar),
      },
    };
  }, [data, isLoading]);
}
