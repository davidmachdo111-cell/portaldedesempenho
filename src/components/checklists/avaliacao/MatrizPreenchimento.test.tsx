import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Avaliacao } from "@/lib/checklists/avaliacao";
import { MatrizPreenchimento } from "./MatrizPreenchimento";

const avaliacao: Avaliacao = {
  id: "a1",
  colaborador: "Ana",
  tutor: "David",
  setor: "Atendimento",
  dataInicio: "",
  dataAvaliacao: "2026-09-30",
  criterios: [
    { id: "c1", nome: "Clareza", peso: 5 },
    { id: "c2", nome: "Precisão", peso: 1 },
  ],
  exercicios: [{ id: "e1", nome: "Atendimento" }],
  vinculos: [{ exercicioId: "e1", criterioId: "c1" }],
  marcados: { "e1:c1": true },
  observacoes: {},
};

describe("matriz de preenchimento", () => {
  it("renderiza checkbox somente na célula vinculada e mostra a nota", () => {
    render(
      <MatrizPreenchimento avaliacao={avaliacao} onToggle={vi.fn()} onAbrirObservacoes={vi.fn()} />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("encaminha a marcação correta e respeita o bloqueio", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <MatrizPreenchimento avaliacao={avaliacao} onToggle={onToggle} onAbrirObservacoes={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("e1", "c1");

    rerender(
      <MatrizPreenchimento
        avaliacao={avaliacao}
        bloqueado
        onToggle={onToggle}
        onAbrirObservacoes={vi.fn()}
      />,
    );
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});