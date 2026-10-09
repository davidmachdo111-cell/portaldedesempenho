import { describe, expect, it } from "vitest";
import { administradorPorPerfil, expandirPermissoes, temPermissao } from "./permissions";

describe("permissões", () => {
  it("expande permissões canônicas para os atalhos da interface", () => {
    expect(expandirPermissoes(["colaboradores.ver"])).toContain("colaboradores");
    expect(expandirPermissoes(["checklists.ver"])).toContain("checklists");
  });
  it("mantém administrador com todas as permissões", () => {
    const result = expandirPermissoes([], true);
    expect(result).toContain("administracao");
    expect(result).toContain("personagens_gerenciar");
  });
  it("visualizar não permite avaliar ou administrar", () => {
    const p = expandirPermissoes(["checklists.ver"]);
    expect(temPermissao(p, "checklists.aplicar")).toBe(false);
    for (const key of ["checklists.mestre_criar", "checklists.mestre_editar", "checklists.mestre_excluir"]) expect(temPermissao(p, key)).toBe(false);
  });
  it("aplicar não concede gestão do checklist", () => {
    const p = expandirPermissoes(["checklists.aplicar"]);
    expect(temPermissao(p, "checklists.aplicar")).toBe(true);
    expect(p).not.toContain("checklists_gerenciar");
    expect(temPermissao(p, "checklists.mestre_editar")).toBe(false);
  });
  it("criar colaboradores não concede editar ou excluir", () => {
    const p = expandirPermissoes(["colaboradores.criar"]);
    expect(temPermissao(p, "colaboradores.criar")).toBe(true);
    expect(temPermissao(p, "colaboradores.editar")).toBe(false);
    expect(temPermissao(p, "colaboradores.excluir")).toBe(false);
    expect(p).not.toContain("colaboradores_gerenciar");
  });
  it("editar colaboradores não concede excluir", () => {
    expect(temPermissao(expandirPermissoes(["colaboradores.editar"]), "colaboradores.excluir")).toBe(false);
  });
  it("permissão individual explícita é preservada", () => {
    const p = expandirPermissoes(["checklists.ver", "checklists.aplicar"]);
    expect(temPermissao(p, "checklists.aplicar")).toBe(true);
  });
  it("acesso administrativo não deriva da permissão de ver administração", () => {
    expect(administradorPorPerfil(["auxiliar"])).toBe(false);
    expect(administradorPorPerfil(["administrador"])).toBe(true);
    expect(temPermissao([], "colaboradores.excluir", true)).toBe(true);
    expect(temPermissao([], "checklists.aplicar")).toBe(false);
  });
});