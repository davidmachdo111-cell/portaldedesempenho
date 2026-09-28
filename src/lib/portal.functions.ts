import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GlobalSearchResult = {
  id: string;
  type: "colaborador" | "persona" | "exercicio";
  title: string;
  subtitle: string;
};

export const searchPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ term: z.string().trim().min(2).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const term = `%${data.term.replace(/[%_]/g, "")} %`.replace(" %", "%");
    const [collaborators, personas, exercises] = await Promise.all([
      context.supabase
        .from("colaboradores")
        .select("id, nome_completo, cargo, setor")
        .ilike("nome_completo", term)
        .limit(6),
      context.supabase
        .from("personas")
        .select("id, nome, exercicio, vertente")
        .ilike("nome", term)
        .limit(6),
      context.supabase
        .from("simulacoes")
        .select("id, nome, exercicio")
        .ilike("nome", term)
        .limit(6),
    ]);

    const errors = [collaborators.error, personas.error, exercises.error].filter(Boolean);
    if (errors.length === 3) throw new Error("Não foi possível realizar a busca.");

    return [
      ...(collaborators.data ?? []).map((row) => ({
        id: row.id,
        type: "colaborador" as const,
        title: row.nome_completo,
        subtitle: [row.cargo, row.setor].filter(Boolean).join(" · ") || "Colaborador",
      })),
      ...(personas.data ?? []).map((row) => ({
        id: row.id,
        type: "persona" as const,
        title: row.nome,
        subtitle: [row.exercicio, row.vertente].filter(Boolean).join(" · ") || "Persona",
      })),
      ...(exercises.data ?? []).map((row) => ({
        id: row.id,
        type: "exercicio" as const,
        title: row.nome,
        subtitle: row.exercicio || "Exercício",
      })),
    ] satisfies GlobalSearchResult[];
  });

export const getPortalSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [isAdminRes, rolesRes] = await Promise.all([
      context.supabase.rpc("is_admin", { _user_id: context.userId }),
      context.supabase.from("user_roles").select("role_key").eq("user_id", context.userId),
    ]);
    const roleKeys = (rolesRes.data ?? []).map((row) => row.role_key);
    const isAdmin = isAdminRes.data === true;
    const mode = isAdmin ? "admin" : roleKeys.includes("avaliador") ? "avaliador" : "auxiliar";

    if (mode === "admin") {
      const [collaborators, personas, exercises, evaluations] = await Promise.all([
        context.supabase.from("colaboradores").select("id", { count: "exact", head: true }),
        context.supabase.from("personas").select("id", { count: "exact", head: true }),
        context.supabase.from("simulacoes").select("id", { count: "exact", head: true }),
        context.supabase.from("avaliacoes").select("id", { count: "exact", head: true }).eq("status", "rascunho"),
      ]);
      return {
        mode,
        metrics: [
          { label: "Colaboradores", value: collaborators.count ?? 0, target: "colaboradores" as const },
          { label: "Personas", value: personas.count ?? 0, target: "personas" as const },
          { label: "Exercícios", value: exercises.count ?? 0, target: "exercicios" as const },
          { label: "Avaliações em andamento", value: evaluations.count ?? 0, target: "avaliacoes" as const },
        ],
      };
    }

    if (mode === "avaliador") {
      const [linked, drafts] = await Promise.all([
        context.supabase.from("colaborador_responsaveis").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
        context.supabase.from("avaliacoes").select("id", { count: "exact", head: true }).eq("avaliador_id", context.userId).eq("status", "rascunho"),
      ]);
      return {
        mode,
        metrics: [
          { label: "Colaboradores vinculados", value: linked.count ?? 0, target: "colaboradores" as const },
          { label: "Avaliações em andamento", value: drafts.count ?? 0, target: "avaliacoes" as const },
        ],
      };
    }

    const { data: collaborator } = await context.supabase
      .from("colaboradores")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    const activities = collaborator
      ? await context.supabase
          .from("colaborador_atividades")
          .select("id", { count: "exact", head: true })
          .eq("colaborador_id", collaborator.id)
          .neq("status", "concluida")
      : { count: 0 };
    return {
      mode,
      metrics: [
        { label: "Conteúdos pendentes", value: activities.count ?? 0, target: "conteudos" as const },
      ],
    };
  });