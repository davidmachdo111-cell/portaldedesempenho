import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcoesPdfPersona, VisualizadorPdf } from "./PdfPersonaAcoes";

const { baixarAnexo, urlAnexo } = vi.hoisted(() => ({
  baixarAnexo: vi.fn(),
  urlAnexo: vi.fn(),
}));

vi.mock("@/lib/personas/anexos", () => ({ baixarAnexo, urlAnexo }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const pdf = { id: "p1", nome: "roteiro.pdf", path: "personas/p1/roteiro.pdf" };

describe("acesso e download do PDF", () => {
  beforeEach(() => {
    baixarAnexo.mockReset().mockResolvedValue(undefined);
    urlAnexo.mockReset().mockResolvedValue("https://arquivos.exemplo/temporario");
  });

  it("informa quando a persona não possui PDF", () => {
    render(<AcoesPdfPersona nome="Ana" pdf={null} />);
    expect(screen.getByText("Sem PDF cadastrado")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("abre o visualizador, carrega a URL temporária e volta em cascata", async () => {
    render(<AcoesPdfPersona nome="Ana" pdf={pdf} />);
    fireEvent.click(screen.getByRole("button", { name: "Visualizar PDF" }));
    expect(screen.getByText("Carregando documento…")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTitle("PDF de Ana")).toHaveAttribute("src", expect.stringContaining("temporario")));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTitle("PDF de Ana")).not.toBeInTheDocument();
  });

  it("baixa mantendo caminho e nome originais", () => {
    render(<AcoesPdfPersona nome="Ana" pdf={pdf} />);
    fireEvent.click(screen.getByRole("button", { name: "Baixar PDF" }));
    expect(baixarAnexo).toHaveBeenCalledWith(pdf.path, pdf.nome);
  });

  it("mostra falha de carregamento sem expor URL", async () => {
    urlAnexo.mockRejectedValue(new Error("negado"));
    render(<VisualizadorPdf titulo="Ana" pdf={pdf} onVoltar={vi.fn()} />);
    expect(await screen.findByText("Não foi possível abrir o PDF deste personagem.")).toBeInTheDocument();
    expect(screen.queryByRole("iframe")).not.toBeInTheDocument();
  });
});