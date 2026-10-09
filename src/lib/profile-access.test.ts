import { describe, expect, it } from "vitest";
import { validarProfileAtivo } from "./profile-access";

describe("acesso por profile", () => {
  it("aceita profile ativo", () => expect(() => validarProfileAtivo({ active: true })).not.toThrow());
  it("nega profile inexistente", () => expect(() => validarProfileAtivo(null)).toThrow());
  it("nega profile inativo", () => expect(() => validarProfileAtivo({ active: false })).toThrow());
});