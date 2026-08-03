export type Peso = 1 | 2 | 3 | 4 | 5;

export interface Criterio {
  id: string;
  nome: string;
  peso: Peso;
}

export interface Exercicio {
  id: string;
  nome: string;
}

export interface Observacao {
  positivos: string;
  melhorias: string;
  feedback: string;
}

export interface Avaliacao {
  id: string;
  colaborador: string;
  tutor: string;
  setor: string;
  dataInicio: string;
  dataAvaliacao: string;
  criterios: Criterio[];
  exercicios: Exercicio[];
  /** chave: `${exercicioId}:${criterioId}` */
  marcados: Record<string, boolean>;
  /** chave: exercicioId ou `${exercicioId}:${criterioId}` */
  observacoes: Record<string, Observacao>;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const chave = (exId: string, critId: string) => `${exId}:${critId}`;

export function avaliacaoInicial(): Avaliacao {
  const criterios: Criterio[] = [
    { id: uid(), nome: "Compreensão da tarefa", peso: 5 },
    { id: uid(), nome: "Escrita clara", peso: 4 },
    { id: uid(), nome: "Atenção a detalhes", peso: 3 },
    { id: uid(), nome: "Cumprimento de prazo", peso: 3 },
    { id: uid(), nome: "Autonomia", peso: 2 },
  ];
  const exercicios: Exercicio[] = [
    { id: uid(), nome: "Exercício 1" },
    { id: uid(), nome: "Exercício 2" },
    { id: uid(), nome: "Exercício 3" },
  ];
  return {
    id: uid(),
    colaborador: "",
    tutor: "",
    setor: "",
    dataInicio: "",
    dataAvaliacao: new Date().toISOString().slice(0, 10),
    criterios,
    exercicios,
    marcados: {},
    observacoes: {},
  };
}

export function notaExercicio(a: Avaliacao, exId: string): number {
  const total = a.criterios.reduce((s, c) => s + c.peso, 0);
  if (!total) return 0;
  const obtido = a.criterios.reduce(
    (s, c) => s + (a.marcados[chave(exId, c.id)] ? c.peso : 0),
    0,
  );
  return (obtido / total) * 100;
}

export function mediaGeral(a: Avaliacao): number {
  if (!a.exercicios.length) return 0;
  return (
    a.exercicios.reduce((s, e) => s + notaExercicio(a, e.id), 0) / a.exercicios.length
  );
}

export function indiceCriterio(a: Avaliacao, critId: string): number {
  if (!a.exercicios.length) return 0;
  const acertos = a.exercicios.filter((e) => a.marcados[chave(e.id, critId)]).length;
  return (acertos / a.exercicios.length) * 100;
}

export function classificacao(nota: number): string {
  if (nota >= 90) return "Excelente";
  if (nota >= 75) return "Bom";
  if (nota >= 60) return "Regular";
  return "Necessita desenvolvimento";
}

export type Faixa = "alta" | "media" | "baixa";

export function faixa(nota: number): Faixa {
  if (nota >= 80) return "alta";
  if (nota >= 60) return "media";
  return "baixa";
}

export const corFaixa: Record<Faixa, string> = {
  alta: "var(--color-success)",
  media: "var(--color-warning)",
  baixa: "var(--color-danger)",
};

export const STORAGE_KEY = "avaliacao-treinamento-v1";
