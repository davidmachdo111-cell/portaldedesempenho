import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

export interface PaginaAcompanhamento {
  itens: AvaliacaoAcompanhamento[];
  total: number;
  avaliadores: string[];
}

/** Lista todas as avaliações da plataforma para acompanhamento administrativo. */
export const listarAcompanhamento = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        pagina: z.number().int().positive().default(1),
        porPagina: z.number().int().min(10).max(100).default(25),
        busca: z.string().max(100).default(""),
        avaliador: z.string().max(120).optional(),
        setor: z.string().max(120).optional(),
        status: z.enum(["rascunho", "concluida"]).optional(),
      })
      .parse(data),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<PaginaAcompanhamento> => {
    const { data: admin } = await context.supabase.rpc("is_admin");
    if (!admin) throw new Error("Apenas administradores podem acompanhar as avaliações.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfisDisponiveis } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username")
      .order("full_name");
    const nomePerfil = (perfil: { full_name: string | null; username: string }) =>
      perfil.full_name || perfil.username || "Avaliador";
    const avaliadores = (perfisDisponiveis ?? []).map(nomePerfil);
    const idsDoAvaliador = data.avaliador
      ? (perfisDisponiveis ?? []).filter((p) => nomePerfil(p) === data.avaliador).map((p) => p.id)
      : [];

    let consulta = context.supabase
      .from("avaliacoes")
      .select(
        "id, checklist_id, avaliador_id, colaborador_nome, setor, status, media, marcados, data_inicio, data_avaliacao, updated_at",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false });
    if (data.status) consulta = consulta.eq("status", data.status);
    if (data.setor) consulta = consulta.eq("setor", data.setor);
    if (data.avaliador) {
      if (!idsDoAvaliador.length) return { itens: [], total: 0, avaliadores };
      consulta = consulta.in("avaliador_id", idsDoAvaliador);
    }
    if (data.busca.trim()) {
      const termo = data.busca.replace(/[,%()]/g, " ").trim();
      consulta = consulta.ilike("colaborador_nome", `%${termo}%`);
    }
    const inicio = (data.pagina - 1) * data.porPagina;
    const { data: avaliacoes, error, count } = await consulta.range(
      inicio,
      inicio + data.porPagina - 1,
    );
    if (error) throw new Error(error.message);
    const linhas = avaliacoes ?? [];
    if (!linhas.length) return { itens: [], total: count ?? 0, avaliadores };

    const checklistIds = [...new Set(linhas.map((linha) => linha.checklist_id))];
    const [checklistsRes, criteriosRes, exerciciosRes] = await Promise.all([
      context.supabase.from("checklists").select("id, nome").in("id", checklistIds),
      context.supabase.from("criterios").select("checklist_id").in("checklist_id", checklistIds),
      context.supabase.from("exercicios").select("checklist_id").in("checklist_id", checklistIds),
    ]);
    const checklists = checklistsRes.data;
    const criterios = criteriosRes.data;
    const exercicios = exerciciosRes.data;

    const contar = (lista: { checklist_id: string }[] | null, id: string) =>
      (lista ?? []).filter((x) => x.checklist_id === id).length;

    const itens = linhas.map((l) => {
      const totais = contar(criterios, l.checklist_id) * contar(exercicios, l.checklist_id);
      const marcados = Object.values((l.marcados ?? {}) as Record<string, boolean>).filter(
        Boolean,
      ).length;
      const perfil = (perfisDisponiveis ?? []).find((p) => p.id === l.avaliador_id);
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
    return { itens, total: count ?? 0, avaliadores };
  });
