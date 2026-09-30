import { describe, expect, it } from "vitest";
import {
  calcularProgresso,
  dadosAndamentoAtividade,
  deveCriarAtividadeExercicio,
} from "./regras";

describe("vínculos e conclusão de atividades", () => {
  it("não duplica atividade para um exercício já vinculado", () => {
    const atividades = [{ tipo: "simulado", ref_id: "ex-1" }];
    expect(deveCriarAtividadeExercicio(atividades, "ex-1")).toBe(false);
    expect(deveCriarAtividadeExercicio(atividades, "ex-2")).toBe(true);
  });

  it("registra data e autor ao concluir", () => {
    const agora = new Date("2026-09-30T12:00:00.000Z");
    expect(dadosAndamentoAtividade("concluida", { id: "u1", nome: "David" }, agora)).toEqual({
      status: "concluida",
      concluida_em: "2026-09-30T12:00:00.000Z",
      concluido_por: "u1",
      concluido_por_nome: "David",
    });
  });

  it.each(["pendente", "em_andamento"] as const)(
    "limpa os campos de conclusão ao mudar para %s",
    (status) => {
      expect(dadosAndamentoAtividade(status, { id: "u1", nome: "David" })).toEqual({
        status,
        concluida_em: null,
        concluido_por: null,
        concluido_por_nome: null,
      });
    },
  );

  it("calcula progresso parcial e lista vazia", () => {
    expect(calcularProgresso([])).toEqual({ total: 0, concluidas: 0, pendentes: 0, percentual: 0 });
    expect(
      calcularProgresso([
        { status: "concluida" },
        { status: "pendente" },
        { status: "em_andamento" },
      ]),
    ).toEqual({ total: 3, concluidas: 1, pendentes: 2, percentual: 33 });
  });
});