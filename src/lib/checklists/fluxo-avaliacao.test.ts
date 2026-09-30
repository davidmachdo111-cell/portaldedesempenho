import { describe, expect, it } from "vitest";
import type { RegistroAvaliacao } from "./avaliacoes";
import {
  alternarMarcacaoAvaliacao,
  registroComStatus,
  validarConclusaoAvaliacao,
} from "./fluxo-avaliacao";

const registro = {
  id: "a1",
  checklist_id: "c1",
  avaliador_id: "u1",
  colaborador_nome: "Ana",
  setor: "Atendimento",
  tutor: "David",
  data_inicio: null,
  data_avaliacao: "2026-09-30",
  status: "rascunho",
  media: 0,
  marcados: {},
  observacoes: {},
  created_at: "2026-09-30T00:00:00Z",
  updated_at: "2026-09-30T00:00:00Z",
} satisfies RegistroAvaliacao;

describe("fluxo completo de avaliação", () => {
  it("exige colaborador e setor antes da conclusão", () => {
    expect(validarConclusaoAvaliacao({ ...registro, colaborador_nome: " " })).toBe(
      "Informe o nome do colaborador avaliado.",
    );
    expect(validarConclusaoAvaliacao({ ...registro, setor: " " })).toBe("Selecione o setor.");
    expect(validarConclusaoAvaliacao(registro)).toBeNull();
  });

  it("marca e desmarca sem alterar o objeto anterior", () => {
    const marcados = { "e1:c2": true };
    const marcado = alternarMarcacaoAvaliacao(marcados, "e1", "c1");
    const desmarcado = alternarMarcacaoAvaliacao(marcado, "e1", "c1");
    expect(marcado).toEqual({ "e1:c2": true, "e1:c1": true });
    expect(desmarcado).toEqual({ "e1:c2": true });
    expect(marcados).toEqual({ "e1:c2": true });
  });

  it("conclui e reabre preservando todos os demais dados", () => {
    const concluida = registroComStatus(registro, "concluida");
    expect(concluida.status).toBe("concluida");
    expect(registro.status).toBe("rascunho");
    expect(registroComStatus(concluida, "rascunho")).toEqual(registro);
  });
});