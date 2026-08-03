import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AvaliacaoAcompanhamento {
  id: string;
  checklist_id: string;
  checklist_nome: string;
  avaliador_nome: string;
  colaborador_nome: string;
  setor: string;
  status: string;
  media: number;
  percentual: number;
  itens_concluidos: number;
  itens_totais: number;
  data_inicio: string | null;
  data_avaliacao: string;
  updated_at: string;
}

/** Lista todas as avaliações da plataforma para acompanhamento administrativo. */
export const listarAcompanhamento = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AvaliacaoAcompanhamento[]> => {
    const { data: admin } = await context.supabase.rpc("is_admin");
    if (!admin) throw new Error("Apenas administradores podem acompanhar as avaliações.");

    const { data: avaliacoes, error } = await context.supabase
      .from("avaliacoes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const linhas = avaliacoes ?? [];
    if (!linhas.length) return [];

    const { data: checklists } = await context.supabase.from("checklists").select("id, nome");
    const { data: criterios } = await context.supabase.from("criterios").select("checklist_id");
    const { data: exercicios } = await context.supabase.from("exercicios").select("checklist_id");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfis } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username")
      .in("id", [...new Set(linhas.map((l) => l.avaliador_id))]);

    const contar = (lista: { checklist_id: string }[] | null, id: string) =>
      (lista ?? []).filter((x) => x.checklist_id === id).length;

    return linhas.map((l) => {
      const totais = contar(criterios, l.checklist_id) * contar(exercicios, l.checklist_id);
      const marcados = Object.values((l.marcados ?? {}) as Record<string, boolean>).filter(
        Boolean,
      ).length;
      const perfil = (perfis ?? []).find((p) => p.id === l.avaliador_id);
      return {
        id: l.id,
        checklist_id: l.checklist_id,
        checklist_nome: (checklists ?? []).find((c) => c.id === l.checklist_id)?.nome ?? "Checklist",
        avaliador_nome: perfil?.full_name || perfil?.username || "Avaliador",
        colaborador_nome: l.colaborador_nome ?? "",
        setor: l.setor ?? "",
        status: l.status,
        media: Number(l.media ?? 0),
        percentual: totais ? (marcados / totais) * 100 : 0,
        itens_concluidos: marcados,
        itens_totais: totais,
        data_inicio: l.data_inicio,
        data_avaliacao: l.data_avaliacao,
        updated_at: l.updated_at,
      };
    });
  });
