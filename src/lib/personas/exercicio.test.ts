import { describe, expect, it } from "vitest";
import type { Persona, Simulacao } from "./constants";
import {
  carregarEstadoExercicio,
  estadoInicialExercicio,
  filtrarPersonasExercicio,
  FILTRO_TODOS,
  planejarSincronizacaoPersonas,
  prepararSalvamentoExercicio,
} from "./exercicio";

const simulacao = {
  id: "ex-1",
  nome: "Exercício existente",
  exercicio: null,
  responsavel: "Avaliador",
  observacoes: "Orientação",
  persona_ids: ["p1", "p2"],
} as Simulacao;

describe("criação e edição de exercício", () => {
  it("prepara criação sem id e aplica os valores padrão", () => {
    const payload = prepararSalvamentoExercicio(estadoInicialExercicio(), "David");
    expect(payload).toEqual({
      values: {
        nome: "Exercício sem título",
        exercicio: null,
        responsavel: "David",
        observacoes: "",
        persona_ids: [],
      },
    });
  });

  it("prepara edição somente com o id carregado", () => {
    const estado = carregarEstadoExercicio(simulacao);
    const payload = prepararSalvamentoExercicio({ ...estado, nome: "Alterado" }, "Outro");
    expect(payload.id).toBe("ex-1");
    expect(payload.values.nome).toBe("Alterado");
    expect(payload.values.persona_ids).toEqual(["p1", "p2"]);
  });

  it("reseta todos os campos e remove o id e as personas", () => {
    expect(estadoInicialExercicio()).toEqual({
      nome: "",
      responsavel: "",
      observacoes: "",
      exercicio: FILTRO_TODOS,
      vertente: FILTRO_TODOS,
      complexidade: FILTRO_TODOS,
      status: "ativa",
      busca: "",
      personaIds: [],
    });
  });

  it("planeja inclusão, remoção e ordem sem apagar personas", () => {
    const plano = planejarSincronizacaoPersonas(
      [
        { id: "v1", persona_id: "p1" },
        { id: "v2", persona_id: "p2" },
      ],
      ["p2", "p3"],
    );
    expect(plano.removerIds).toEqual(["v1"]);
    expect(plano.inserir).toEqual([{ persona_id: "p3", ordem: 1 }]);
    expect(plano.ordenar).toEqual([
      { personaId: "p2", ordem: 0 },
      { personaId: "p3", ordem: 1 },
    ]);
  });

  it("filtra personas sem modificar a lista original", () => {
    const personas = [
      { id: "p1", nome: "Ana", exercicio: "E1", status: "ativa" },
      { id: "p2", nome: "Bruno", exercicio: "E2", status: "arquivada" },
    ] as Persona[];
    const resultado = filtrarPersonasExercicio(personas, {
      exercicio: "E1",
      vertente: FILTRO_TODOS,
      complexidade: FILTRO_TODOS,
      status: "ativa",
      busca: "ana",
    });
    expect(resultado.map((p) => p.id)).toEqual(["p1"]);
    expect(personas).toHaveLength(2);
  });
});