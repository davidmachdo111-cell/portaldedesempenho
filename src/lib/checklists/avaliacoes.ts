import { supabase } from "@/integrations/supabase/client";
import { carregarEstrutura, type EstruturaChecklist } from "@/lib/checklists/checklists";
import type { Avaliacao, Observacao, Peso } from "@/lib/checklists/avaliacao";

export interface Atribuicao {
  id: string;
  checklist_id: string;
  avaliador_id: string;
  created_at: string;
}

export type StatusAvaliacao = "rascunho" | "concluida";

export interface RegistroAvaliacao {
  id: string;
  checklist_id: string;
  avaliador_id: string;
  colaborador_nome: string;
  setor: string;
  tutor: string;
  data_inicio: string | null;
  data_avaliacao: string;
  status: StatusAvaliacao;
  media: number;
  marcados: Record<string, boolean>;
  observacoes: Record<string, Observacao>;
  created_at: string;
  updated_at: string;
}

const check = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

const meuId = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada.");
  return data.user.id;
};

/* ---------- liberações (atribuições) ---------- */

export async function listarAtribuicoes(): Promise<Atribuicao[]> {
  return check(await supabase.from("atribuicoes").select("*")) as Atribuicao[];
}

export async function liberarChecklist(checklist_id: string, avaliador_id: string) {
  const { error } = await supabase.from("atribuicoes").insert({ checklist_id, avaliador_id });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

export async function revogarChecklist(checklist_id: string, avaliador_id: string) {
  const { error } = await supabase
    .from("atribuicoes")
    .delete()
    .eq("checklist_id", checklist_id)
    .eq("avaliador_id", avaliador_id);
  if (error) throw new Error(error.message);
}

export interface ChecklistLiberado {
  id: string;
  nome: string;
  descricao: string;
  nota_minima: number;
}

/** Checklists ativos liberados para o avaliador autenticado. */
export async function listarChecklistsLiberados(): Promise<ChecklistLiberado[]> {
  const id = await meuId();
  const atrib = check(
    await supabase.from("atribuicoes").select("checklist_id").eq("avaliador_id", id),
  ) as { checklist_id: string }[];
  if (!atrib.length) return [];
  return check(
    await supabase
      .from("checklists")
      .select("id, nome, descricao, nota_minima")
      .in(
        "id",
        atrib.map((a) => a.checklist_id),
      )
      .eq("ativo", true)
      .order("nome"),
  ) as ChecklistLiberado[];
}

/* ---------- avaliações ---------- */

const normalizar = (r: Record<string, unknown>): RegistroAvaliacao => ({
  ...(r as unknown as RegistroAvaliacao),
  marcados: (r['marcados'] ?? {}) as Record<string, boolean>,
  observacoes: (r['observacoes'] ?? {}) as Record<string, Observacao>,
});

export async function listarMinhasAvaliacoes(): Promise<RegistroAvaliacao[]> {
  const id = await meuId();
  const rows = check(
    await supabase
      .from("avaliacoes")
      .select("*")
      .eq("avaliador_id", id)
      .order("updated_at", { ascending: false }),
  ) as Record<string, unknown>[];
  return rows.map(normalizar);
}

export async function listarTodasAvaliacoes(): Promise<RegistroAvaliacao[]> {
  const rows = check(
    await supabase.from("avaliacoes").select("*").order("updated_at", { ascending: false }),
  ) as Record<string, unknown>[];
  return rows.map(normalizar);
}

export async function criarAvaliacao(checklist_id: string): Promise<RegistroAvaliacao> {
  const avaliador_id = await meuId();
  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", avaliador_id)
    .maybeSingle();
  const row = check(
    await supabase
      .from("avaliacoes")
      .insert({
        checklist_id,
        avaliador_id,
        tutor: perfil?.full_name || perfil?.username || "",
        data_avaliacao: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single(),
  ) as Record<string, unknown>;
  return normalizar(row);
}

export async function carregarAvaliacao(
  id: string,
): Promise<{ registro: RegistroAvaliacao; estrutura: EstruturaChecklist }> {
  const row = check(
    await supabase.from("avaliacoes").select("*").eq("id", id).single(),
  ) as Record<string, unknown>;
  const registro = normalizar(row);
  const estrutura = await carregarEstrutura(registro.checklist_id);
  return { registro, estrutura };
}

export async function salvarAvaliacao(r: RegistroAvaliacao) {
  const { error } = await supabase
    .from("avaliacoes")
    .update({
      colaborador_nome: r.colaborador_nome,
      setor: r.setor,
      tutor: r.tutor,
      data_inicio: r.data_inicio || null,
      data_avaliacao: r.data_avaliacao,
      status: r.status,
      media: r.media,
      marcados: r.marcados as unknown as Record<string, never>,
      observacoes: r.observacoes as unknown as Record<string, never>,
    })

    .eq("id", r.id);
  if (error) throw new Error(error.message);
}

export async function excluirAvaliacao(id: string) {
  const { error } = await supabase.from("avaliacoes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- ponte com o modelo de cálculo ---------- */

const clampPeso = (p: number): Peso => (Math.min(5, Math.max(1, Math.round(p))) as Peso);

export function paraAvaliacao(
  registro: RegistroAvaliacao,
  estrutura: EstruturaChecklist,
): Avaliacao {
  return {
    id: registro.id,
    colaborador: registro.colaborador_nome,
    tutor: registro.tutor,
    setor: registro.setor,
    dataInicio: registro.data_inicio ?? "",
    dataAvaliacao: registro.data_avaliacao ?? "",
    criterios: estrutura.criterios.map((c) => ({
      id: c.id,
      nome: c.nome,
      peso: clampPeso(c.peso),
    })),
    exercicios: estrutura.exercicios.map((e) => ({ id: e.id, nome: e.nome })),
    marcados: registro.marcados,
    observacoes: registro.observacoes,
  };
}

export const observacaoVazia: Observacao = { positivos: "", melhorias: "", feedback: "" };
