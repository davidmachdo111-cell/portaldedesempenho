import type { Persona, Simulacao } from "./constants";

export const FILTRO_TODOS = "__todos__";

export type EstadoFormularioExercicio = {
  id?: string;
  nome: string;
  responsavel: string;
  observacoes: string;
  exercicio: string;
  vertente: string;
  complexidade: string;
  status: string;
  busca: string;
  personaIds: string[];
};

export function estadoInicialExercicio(): EstadoFormularioExercicio {
  return {
    nome: "",
    responsavel: "",
    observacoes: "",
    exercicio: FILTRO_TODOS,
    vertente: FILTRO_TODOS,
    complexidade: FILTRO_TODOS,
    status: "ativa",
    busca: "",
    personaIds: [],
  };
}

export function carregarEstadoExercicio(simulacao: Simulacao): EstadoFormularioExercicio {
  return {
    ...estadoInicialExercicio(),
    id: simulacao.id,
    nome: simulacao.nome,
    responsavel: simulacao.responsavel ?? "",
    observacoes: simulacao.observacoes ?? "",
    exercicio: simulacao.exercicio ?? FILTRO_TODOS,
    personaIds: [...(simulacao.persona_ids ?? [])],
  };
}

export function prepararSalvamentoExercicio(
  estado: EstadoFormularioExercicio,
  usuario: string,
): { id?: string; values: Partial<Simulacao> } {
  return {
    ...(estado.id ? { id: estado.id } : {}),
    values: {
      nome: estado.nome || "Exercício sem título",
      exercicio: estado.exercicio === FILTRO_TODOS ? null : estado.exercicio,
      responsavel: estado.responsavel || usuario,
      observacoes: estado.observacoes,
      persona_ids: [...estado.personaIds],
    },
  };
}

export function filtrarPersonasExercicio(
  personas: Persona[],
  filtros: Pick<
    EstadoFormularioExercicio,
    "exercicio" | "vertente" | "complexidade" | "status" | "busca"
  >,
) {
  const busca = filtros.busca.toLocaleLowerCase("pt-BR");
  return personas.filter((persona) => {
    if (filtros.exercicio !== FILTRO_TODOS && persona.exercicio !== filtros.exercicio) return false;
    if (filtros.vertente !== FILTRO_TODOS && persona.vertente !== filtros.vertente) return false;
    if (filtros.complexidade !== FILTRO_TODOS && persona.complexidade !== filtros.complexidade)
      return false;
    if (filtros.status !== FILTRO_TODOS && persona.status !== filtros.status) return false;
    return !busca || persona.nome.toLocaleLowerCase("pt-BR").includes(busca);
  });
}

export function planejarSincronizacaoPersonas(
  existentes: { id: string; persona_id: string }[],
  personaIds: string[],
) {
  return {
    removerIds: existentes.filter((v) => !personaIds.includes(v.persona_id)).map((v) => v.id),
    inserir: personaIds
      .filter((id) => !existentes.some((v) => v.persona_id === id))
      .map((personaId) => ({
        persona_id: personaId,
        ordem: personaIds.indexOf(personaId),
      })),
    ordenar: personaIds.map((personaId, ordem) => ({ personaId, ordem })),
  };
}