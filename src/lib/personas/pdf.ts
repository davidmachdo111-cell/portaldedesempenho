import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * PDF da persona — fonte única do documento.
 * O arquivo pertence exclusivamente à persona (tabela `persona_materiais`);
 * exercícios apenas reutilizam o PDF das personas vinculadas, sem cópias.
 */
export type PdfPersona = { id: string; nome: string; path: string };

const ehPdf = (nome: string, tipo: string | null) =>
  (tipo ?? "").includes("pdf") || nome.toLowerCase().endsWith(".pdf");

/** Escolhe o PDF de uma lista de anexos já carregada. */
export function pdfDosAnexos<
  T extends { id: string; nome: string; path: string; tipo?: string | null },
>(anexos: T[]): PdfPersona | null {
  const achado = anexos.find((a) => ehPdf(a.nome, a.tipo ?? null)) ?? null;
  return achado ? { id: achado.id, nome: achado.nome, path: achado.path } : null;
}

/** Busca, em uma única consulta, o PDF de cada persona informada. */
export function usePdfsDePersonas(ids: string[]) {
  const chave = [...ids].sort();
  return useQuery({
    queryKey: ["personas", "pdfs", chave],
    enabled: chave.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, PdfPersona>> => {
      const { data, error } = await supabase
        .from("persona_materiais")
        .select("id, persona_id, nome, path, tipo, created_at")
        .in("persona_id", chave)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const mapa: Record<string, PdfPersona> = {};
      for (const a of data ?? []) {
        if (!a.persona_id || mapa[a.persona_id]) continue;
        if (!ehPdf(a.nome, a.tipo)) continue;
        mapa[a.persona_id] = { id: a.id, nome: a.nome, path: a.path };
      }
      return mapa;
    },
  });
}
