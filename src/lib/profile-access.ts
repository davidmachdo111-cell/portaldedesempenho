export function validarProfileAtivo(profile: { active: boolean } | null | undefined): void {
  if (!profile) throw new Error("Cadastro de acesso não encontrado. Procure o administrador.");
  if (!profile.active) throw new Error("Usuário inativo. Procure o administrador.");
}