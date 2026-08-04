import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Anexo } from "@/lib/personas/anexos";
import type { Persona } from "@/lib/personas/constants";

/**
 * Conteúdos liberados para o próprio usuário (perfil Auxiliar).
 * Todas as consultas são filtradas pelo colaborador vinculado ao usuário
 * autenticado — o banco também garante isso pelas políticas de acesso.
 */

export type SimuladoLiberado = {
  id: string;
  nome: string;
  exercicio: string | null;
  observacoes: string | null;
  persona_ids: string[];
};

export type PersonaLiberada = Pick<
  Persona,
  "id" | "nome" | "exercicio" | "vertente" | "complexidade" | "objetivo"
>;

export type MeusConteudos = {
  colaborador: { id: string; nome_completo: string } | null;
  simulados: SimuladoLiberado[];
  personas: PersonaLiberada[];
  anexosPorSimulado: Record<string, Anexo[]>;
  anexosPorPersona: Record<string, Anexo[]>;
};

const COLUNAS_ANEXO =
  "id, persona_id, simulacao_id, nome, path, tipo, tamanho, descricao, momento, orientacoes, created_at";

export function useMeusConteudos() {
  return useQuery({
    queryKey: ["meus-conteudos"],
    staleTime: 60_000,
    queryFn: async (): Promise<MeusConteudos> => {
      const vazio: MeusConteudos = {
        colaborador: null,
        simulados: [],
        personas: [],
        anexosPorSimulado: {},
        anexosPorPersona: {},
      };

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return vazio;

      const { data: colaborador } = await supabase
        .from("colaboradores")
        .select("id, nome_completo")
        .eq("user_id", uid)
        .maybeSingle();
      if (!colaborador) return vazio;

      const { data: atividades } = await supabase
        .from("colaborador_atividades")
        .select("tipo, ref_id")
        .eq("colaborador_id", colaborador.id)
        .in("tipo", ["simulado", "persona"]);

      const simuladoIds = (atividades ?? [])
        .filter((a) => a.tipo === "simulado" && a.ref_id)
        .map((a) => a.ref_id as string);
      const personaIdsDiretos = (atividades ?? [])
        .filter((a) => a.tipo === "persona" && a.ref_id)
        .map((a) => a.ref_id as string);

      if (simuladoIds.length === 0 && personaIdsDiretos.length === 0) {
        return { ...vazio, colaborador };
      }

      const simulados = simuladoIds.length
        ? (
            (
              await supabase
                .from("simulacoes")
                .select("id, nome, exercicio, observacoes, persona_ids")
                .in("id", simuladoIds)
                .order("nome")
            ).data ?? []
          ).map((s) => ({ ...s, persona_ids: (s.persona_ids ?? []) as string[] }))
        : [];

      const personaIds = Array.from(
        new Set([...personaIdsDiretos, ...simulados.flatMap((s) => s.persona_ids)]),
      );

      const [personasRes, anexosRes] = await Promise.all([
        personaIds.length
          ? supabase
              .from("personas")
              .select("id, nome, exercicio, vertente, complexidade, objetivo")
              .in("id", personaIds)
              .order("nome")
          : Promise.resolve({ data: [] as PersonaLiberada[] }),
        supabase
          .from("persona_materiais")
          .select(COLUNAS_ANEXO)
          .or(
            [
              personaIds.length ? `persona_id.in.(${personaIds.join(",")})` : null,
              simuladoIds.length ? `simulacao_id.in.(${simuladoIds.join(",")})` : null,
            ]
              .filter(Boolean)
              .join(","),
          )
          .order("created_at", { ascending: false }),
      ]);

      const anexosPorSimulado: Record<string, Anexo[]> = {};
      const anexosPorPersona: Record<string, Anexo[]> = {};
      for (const anexo of (anexosRes.data ?? []) as Anexo[]) {
        if (anexo.simulacao_id) {
          (anexosPorSimulado[anexo.simulacao_id] ??= []).push(anexo);
        } else if (anexo.persona_id) {
          (anexosPorPersona[anexo.persona_id] ??= []).push(anexo);
        }
      }

      return {
        colaborador,
        simulados,
        personas: (personasRes.data ?? []) as PersonaLiberada[],
        anexosPorSimulado,
        anexosPorPersona,
      };
    },
  });
}

/** Personas completas de um simulado liberado (usado na versão para download). */
export function useSimuladoParaDownload(simuladoId: string) {
  return useQuery({
    queryKey: ["meus-conteudos", "simulado", simuladoId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: simulado, error } = await supabase
        .from("simulacoes")
        .select("id, nome, exercicio, responsavel, observacoes, persona_ids")
        .eq("id", simuladoId)
        .maybeSingle();
      if (error) throw error;
      if (!simulado) return null;

      const ids = (simulado.persona_ids ?? []) as string[];
      const personas = ids.length
        ? ((await supabase.from("personas").select("*").in("id", ids)).data ?? [])
        : [];

      const anexos =
        ((await supabase.from("persona_materiais").select(COLUNAS_ANEXO).eq("simulacao_id", simuladoId))
          .data ?? []) as Anexo[];

      return {
        simulado,
        personas: ids
          .map((id) => (personas as unknown as Persona[]).find((p) => p.id === id))
          .filter(Boolean) as Persona[],
        anexos,
      };
    },
  });
}
