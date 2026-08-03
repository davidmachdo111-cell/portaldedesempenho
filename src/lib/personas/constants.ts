export const EXERCICIOS = [
  "Exercício 1",
  "Exercício 2",
  "Exercício 3",
  "Exercício 4",
  "Exercício 5",
  "Exercício 6",
  "Exercício 7",
  "Exercício 8",
  "Exercício 9",
  "Exercício 10",
] as const;

export const VERTENTES = ["Operadora", "Laboratório", "Imagem", "Consulta", "Terapias"] as const;

export const COMPLEXIDADES = ["Básico", "Intermediário", "Avançado", "Alta Criticidade"] as const;

export const STATUS = ["ativa", "arquivada"] as const;

export const PERFIS_PADRAO = [
  "Ansioso",
  "Irritado",
  "Confuso",
  "Triste",
  "Colaborativo",
  "Objetivo",
  "Apressado",
  "Emocional",
  "Inseguro",
  "Impaciente",
];

export const CAMPOS_TECNICOS_SUGERIDOS = [
  "Número da Guia",
  "Número da Carteira",
  "Procedimento",
  "Médico Solicitante",
  "Especialidade",
  "Convênio",
  "Cidade",
  "Unidade",
  "Datas disponíveis",
  "Restrições",
  "Elegibilidade",
  "Observações",
];

/** Quantidade sugerida de personas por exercício na seleção aleatória. */
export const QTD_POR_EXERCICIO: Record<string, number> = {
  "Exercício 1": 1,
  "Exercício 2": 1,
  "Exercício 3": 1,
  "Exercício 4": 1,
  "Exercício 5": 1,
  "Exercício 6": 1,
  "Exercício 7": 2,
  "Exercício 8": 2,
  "Exercício 9": 3,
  "Exercício 10": 4,
};

export const COMPLEXIDADE_TOM: Record<string, string> = {
  "Básico": "bg-muted text-muted-foreground",
  "Intermediário": "bg-brand/10 text-brand-mid",
  "Avançado": "bg-highlight/25 text-highlight-foreground",
  "Alta Criticidade": "bg-warning/15 text-warning",
};

export type CampoTecnico = { label: string; valor: string };
export type InfoOculta = { pergunta: string; resposta: string };

export type Persona = {
  id: string;
  nome: string;
  idade: string | null;
  sexo: string | null;
  cidade: string | null;
  tipo_cliente: string | null;
  titularidade: string | null;
  nome_dependente: string | null;
  exercicio: string | null;
  vertente: string | null;
  complexidade: string | null;
  objetivo: string | null;
  contexto_oculto: string | null;
  dados_tecnicos: CampoTecnico[];
  perfil_comportamental: string[];
  fala_inicial: string | null;
  informacoes_ocultas: InfoOculta[];
  falas_gatilho: string[];
  escalada: string[];
  encerramento: string | null;
  palavras_chave: string[];
  status: string;
  favorita: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Simulacao = {
  id: string;
  nome: string;
  exercicio: string | null;
  responsavel: string | null;
  observacoes: string | null;
  persona_ids: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type HistoricoItem = {
  id: string;
  persona_id: string | null;
  persona_nome: string | null;
  acao: string;
  detalhes: Record<string, unknown>;
  user_id: string | null;
  user_nome: string | null;
  created_at: string;
};

export function personaVazia(): Omit<Persona, "id" | "created_at" | "updated_at" | "created_by" | "updated_by"> {
  return {
    nome: "",
    idade: "",
    sexo: "",
    cidade: "",
    tipo_cliente: "",
    titularidade: "Titular",
    nome_dependente: "",
    exercicio: EXERCICIOS[0],
    vertente: VERTENTES[0],
    complexidade: COMPLEXIDADES[0],
    objetivo: "",
    contexto_oculto: "",
    dados_tecnicos: [],
    perfil_comportamental: [],
    fala_inicial: "",
    informacoes_ocultas: [],
    falas_gatilho: [],
    escalada: [],
    encerramento: "",
    palavras_chave: [],
    status: "ativa",
    favorita: false,
  };
}

export function formatarData(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
