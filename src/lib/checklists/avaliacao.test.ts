import { describe, expect, it } from "vitest";
import { classificacao, criterioVinculado, criteriosOrdenados, faixa, mediaGeral, notaExercicio, totalMarcaveis, type Avaliacao } from "./avaliacao";

const avaliacao: Avaliacao = {
  id: "a", colaborador: "", tutor: "", setor: "", dataInicio: "", dataAvaliacao: "",
  criterios: [{ id: "c1", nome: "Critério 1", peso: 5 }, { id: "c2", nome: "Critério 2", peso: 1 }],
  exercicios: [{ id: "e1", nome: "Exercício 1" }, { id: "e2", nome: "Exercício 2" }],
  vinculos: [{ exercicioId: "e1", criterioId: "c1" }, { exercicioId: "e2", criterioId: "c1" }, { exercicioId: "e2", criterioId: "c2" }],
  marcados: { "e1:c1": true, "e2:c2": true }, observacoes: {},
};

describe("matriz de avaliação", () => {
  it("considera somente critérios vinculados", () => {
    expect(criterioVinculado(avaliacao, "e1", "c2")).toBe(false);
    expect(totalMarcaveis(avaliacao)).toBe(3);
  });
  it("calcula cada exercício pelos próprios pesos", () => {
    expect(notaExercicio(avaliacao, "e1")).toBe(100);
    expect(notaExercicio(avaliacao, "e2")).toBeCloseTo(100 / 6);
    expect(mediaGeral(avaliacao)).toBeCloseTo(58.3333);
  });
  it("ordena critérios pela frequência", () => {
    expect(criteriosOrdenados(avaliacao).map((item) => item.id)).toEqual(["c1", "c2"]);
  });
  it("mantém compatibilidade histórica quando não há vínculos", () => {
    const historica = { ...avaliacao, vinculos: [] };
    expect(totalMarcaveis(historica)).toBe(4);
    expect(notaExercicio(historica, "e1")).toBeCloseTo(5 / 6 * 100);
  });
  it("classifica corretamente os limites", () => {
    expect(faixa(59)).toBe("baixa");
    expect(faixa(60)).toBe("media");
    expect(faixa(79)).toBe("media");
    expect(faixa(80)).toBe("alta");
    expect(classificacao(59)).toBe("Necessita desenvolvimento");
    expect(classificacao(60)).toBe("Regular");
    expect(classificacao(75)).toBe("Bom");
    expect(classificacao(90)).toBe("Excelente");
  });
});