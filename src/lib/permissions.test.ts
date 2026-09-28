import { describe, expect, it } from "vitest";
import { expandirPermissoes } from "./permissions";

describe("permissões", () => {
  it("expande permissões canônicas para os atalhos da interface", () => {
    expect(expandirPermissoes(["colaboradores.ver"])).toContain("colaboradores");
    expect(expandirPermissoes(["checklists.aplicar"])).toContain("checklists");
  });
  it("mantém administrador com todas as permissões", () => {
    const result = expandirPermissoes([], true);
    expect(result).toContain("administracao");
    expect(result).toContain("personagens_gerenciar");
  });
});