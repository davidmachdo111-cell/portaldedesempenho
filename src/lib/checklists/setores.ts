import { supabase } from "@/integrations/supabase/client";

export interface Setor {
  id: string;
  nome: string;
  ativo: boolean;
}

const check = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

/** Setores ativos, usados no preenchimento do checklist. */
export async function listarSetoresAtivos(): Promise<Setor[]> {
  return check(
    await supabase.from("setores").select("id, nome, ativo").eq("ativo", true).order("nome"),
  ) as Setor[];
}

/** Todos os setores (gestão administrativa). */
export async function listarSetores(): Promise<Setor[]> {
  return check(await supabase.from("setores").select("id, nome, ativo").order("nome")) as Setor[];
}

export async function criarSetor(nome: string): Promise<Setor> {
  return check(
    await supabase.from("setores").insert({ nome: nome.trim() }).select("id, nome, ativo").single(),
  ) as Setor;
}

export async function renomearSetor(id: string, nome: string) {
  const { error } = await supabase.from("setores").update({ nome: nome.trim() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function definirSetorAtivo(id: string, ativo: boolean) {
  const { error } = await supabase.from("setores").update({ ativo }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function excluirSetor(id: string) {
  const { error } = await supabase.from("setores").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
