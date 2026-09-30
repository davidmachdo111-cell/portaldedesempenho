import { describe, expect, it } from "vitest";
import { pdfDosAnexos } from "./pdf";

describe("PDF pertencente à persona", () => {
  it("escolhe o primeiro PDF por tipo ou extensão", () => {
    expect(
      pdfDosAnexos([
        { id: "i1", nome: "foto.jpg", path: "foto", tipo: "image/jpeg" },
        { id: "p1", nome: "roteiro", path: "pdf-1", tipo: "application/pdf" },
        { id: "p2", nome: "outro.pdf", path: "pdf-2", tipo: null },
      ]),
    ).toEqual({ id: "p1", nome: "roteiro", path: "pdf-1" });
  });

  it("não considera imagens e não copia dados do exercício", () => {
    expect(pdfDosAnexos([{ id: "i1", nome: "foto.png", path: "foto", tipo: null }])).toBeNull();
  });
});