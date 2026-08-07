import { usePermissions } from "@/hooks/usePermissions";

/**
 * Compatibilidade: mantém a API antiga usada pelas telas, delegando toda a
 * lógica ao motor unificado (`usePermissions`).
 */
export function useAuth() {
  const p = usePermissions();

  return {
    userId: p.userId,
    user: p.userId ? { id: p.userId } : null,
    isAdmin: p.isAdmin,
    isSuperAdmin: p.isAdmin,
    can: p.can,
    canAny: p.canAny,
    // visualização
    podeVerColaboradores: p.colaboradoresPerm.ver,
    podeVerChecklists: p.checklistsPerm.ver,
    podeVerPersonagens: p.personagensPerm.ver,
    podeVerTreinamentos: p.treinamentosPerm.ver,
    podeBaixarMateriais: p.personagensPerm.download,
    podeConcluirTreinamento: p.treinamentosPerm.concluir,
    // gestão
    podeGerenciarColaboradores: p.colaboradoresPerm.gerenciar,
    podeCriarColaboradores: p.colaboradoresPerm.criar,
    podeExcluirColaboradores: p.colaboradoresPerm.excluir,
    podeGerenciarChecklists: p.checklistsPerm.gerenciarMestre,
    podeGerenciarPersonagens: p.personagensPerm.gerenciar,
    podeExcluirPersonagens: p.personagensPerm.excluir,
    podeAvaliar: p.checklistsPerm.aplicar,
    isAvaliador: p.checklistsPerm.aplicar,
    podeAcessarAdmin: p.administracao.ver,
    username: p.username,
    nome: p.nome,
    permissions: p.permissions,
    roleKeys: p.roleKeys,
    loading: p.loading,
  };
}
