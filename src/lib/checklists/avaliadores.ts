import { supabase } from "@/integrations/supabase/client";

export interface Avaliador {
  id: string;
  username: string;
  nome: string;
  ativo: boolean;
}

/**
 * Avaliadores do módulo Checklists, lidos do cadastro central de usuários da plataforma.
 * Quem tem permissão do módulo (por perfil ou permissão individual) aparece aqui.
 */
export async function listarAvaliadores(): Promise<Avaliador[]> {
  const [perfis, papeisPerm, permsDiretas, papeisUsuario] = await Promise.all([
    supabase.from("profiles").select("id, username, full_name, active").order("username"),
    supabase.from("role_permissions").select("role_key").eq("permission_key", "checklists"),
    supabase.from("user_permissions").select("user_id").eq("permission_key", "checklists"),
    supabase.from("user_roles").select("user_id, role_key"),
  ]);

  if (perfis.error) throw new Error(perfis.error.message);

  const rolesComAcesso = new Set((papeisPerm.data ?? []).map((r) => r.role_key));
  const comAcesso = new Set<string>((permsDiretas.data ?? []).map((p) => p.user_id));
  for (const vinculo of papeisUsuario.data ?? []) {
    if (rolesComAcesso.has(vinculo.role_key)) comAcesso.add(vinculo.user_id);
  }

  return (perfis.data ?? [])
    .filter((p) => comAcesso.has(p.id))
    .map((p) => ({
      id: p.id,
      username: p.username,
      nome: p.full_name || p.username,
      ativo: p.active,
    }));
}
