/**
 * Matriz única de permissões da plataforma.
 *
 * O banco usa chaves canônicas no formato `modulo.acao` (ex.: `colaboradores.ver`).
 * Telas antigas usam apelidos curtos (ex.: `colaboradores`, `checklists_gerenciar`).
 * `expandirPermissoes` normaliza as duas formas para que a interface nunca
 * esconda menus por diferença de nomenclatura.
 */

export type PermissionKey = string;

/** Apelido curto -> chaves canônicas que o satisfazem. */
export const ALIAS_PARA_CANONICAS: Record<string, string[]> = {
  administracao: ["administracao.ver"],
  configuracoes: ["configuracoes.ver"],
  usuarios: ["usuarios.criar", "usuarios.editar", "usuarios.excluir"],
  dashboard: ["dashboard.ver"],
  colaboradores: ["colaboradores.ver"],
  colaboradores_gerenciar: [
    "colaboradores.criar",
    "colaboradores.editar",
    "colaboradores.excluir",
  ],
  checklists: ["checklists.ver", "checklists.aplicar"],
  checklists_gerenciar: [
    "checklists.mestre_criar",
    "checklists.mestre_editar",
    "checklists.mestre_excluir",
  ],
  personagens_simulados: ["personagens.ver"],
  personagens_gerenciar: ["personagens.criar", "personagens.editar", "personagens.excluir"],
  meus_conteudos: ["meus_conteudos.ver"],
  treinamentos: ["treinamentos.ver"],
  treinamentos_concluir: ["treinamentos.concluir"],
  relatorios: ["relatorios.ver"],
};

/**
 * Recebe as permissões vindas do banco (canônicas) e devolve o conjunto
 * completo incluindo os apelidos curtos equivalentes.
 */
export function expandirPermissoes(canonicas: string[], isAdmin = false): string[] {
  const set = new Set(canonicas);
  for (const [alias, chaves] of Object.entries(ALIAS_PARA_CANONICAS)) {
    if (isAdmin || chaves.some((k) => set.has(k))) set.add(alias);
  }
  if (isAdmin) {
    for (const chaves of Object.values(ALIAS_PARA_CANONICAS)) chaves.forEach((k) => set.add(k));
  }
  return Array.from(set);
}

/** Agrupamento das permissões por módulo, usado na tela de permissões individuais. */
export type GrupoPermissao = {
  moduleKey: string;
  titulo: string;
  descricao: string;
};

export const GRUPOS_PERMISSAO: GrupoPermissao[] = [
  {
    moduleKey: "colaboradores",
    titulo: "Módulo Colaboradores",
    descricao: "Consulta e gestão do cadastro de colaboradores.",
  },
  {
    moduleKey: "checklists",
    titulo: "Módulo Checklists",
    descricao: "Aplicação de avaliações e gestão dos modelos.",
  },
  {
    moduleKey: "personagens",
    titulo: "Módulo Personagens e Simulados",
    descricao: "Personagens, simulados e materiais anexados.",
  },
  {
    moduleKey: "treinamentos",
    titulo: "Módulo Treinamentos e Atividades",
    descricao: "Acompanhamento e conclusão das atividades vinculadas.",
  },
  {
    moduleKey: "relatorios",
    titulo: "Módulo Relatórios",
    descricao: "Indicadores e exportação de dados.",
  },
  {
    moduleKey: "meus_conteudos",
    titulo: "Meus Conteúdos",
    descricao: "Acesso do colaborador aos conteúdos liberados.",
  },
  {
    moduleKey: "dashboard",
    titulo: "Página inicial",
    descricao: "Acesso ao portal e aos painéis iniciais.",
  },
  {
    moduleKey: "usuarios",
    titulo: "Módulo Sistema — Usuários",
    descricao: "Criação e manutenção de contas de acesso.",
  },
  {
    moduleKey: "administracao",
    titulo: "Módulo Sistema — Administração",
    descricao: "Painel administrativo central.",
  },
  {
    moduleKey: "configuracoes",
    titulo: "Módulo Sistema — Configurações",
    descricao: "Parâmetros gerais da plataforma.",
  },
];

/** Rótulo curto (ação) a partir da chave canônica. */
export function rotuloAcao(nome: string) {
  const partes = nome.split(":");
  return (partes[1] ?? partes[0]).trim();
}
