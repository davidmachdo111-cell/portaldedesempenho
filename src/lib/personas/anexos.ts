import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Anexos de personagens e simulados.
 * Cada anexo pertence a exatamente um conteúdo (persona OU simulado), com
 * descrição, momento de uso e orientações de uso.
 */

export type VinculoAnexo = { tipo: "persona" | "simulado"; id: string };

export type MomentoAnexo =
  | "antes_atendimento"
  | "durante_atendimento"
  | "apos_etapa"
  | "durante_avaliacao"
  | "encerramento";

export const MOMENTOS: { valor: MomentoAnexo; label: string }[] = [
  { valor: "antes_atendimento", label: "Antes do início do atendimento" },
  { valor: "durante_atendimento", label: "Durante o atendimento" },
  { valor: "apos_etapa", label: "Disponibilizar após determinada etapa" },
  { valor: "durante_avaliacao", label: "Durante a avaliação" },
  { valor: "encerramento", label: "No encerramento" },
];

export const rotuloMomento = (momento: string) =>
  MOMENTOS.find((m) => m.valor === momento)?.label ?? momento;

export type Anexo = {
  id: string;
  persona_id: string | null;
  simulacao_id: string | null;
  nome: string;
  path: string;
  tipo: string | null;
  tamanho: number | null;
  descricao: string;
  momento: string;
  orientacoes: string;
  created_at: string;
};

export type MetaAnexo = {
  descricao: string;
  momento: MomentoAnexo;
  orientacoes: string;
};

/** Anexo escolhido antes de o cadastro existir (fica na memória até salvar). */
export type AnexoPendente = { tempId: string; file: File; meta: MetaAnexo };

const BUCKET = "persona-materiais";
const COLUNAS =
  "id, persona_id, simulacao_id, nome, path, tipo, tamanho, descricao, momento, orientacoes, created_at";

const chave = (v?: VinculoAnexo | null) => ["anexos", v?.tipo ?? "-", v?.id ?? "-"] as const;
const coluna = (v: VinculoAnexo) => (v.tipo === "persona" ? "persona_id" : "simulacao_id");

/** Envia um arquivo já vinculado a um conteúdo existente. */
export async function enviarAnexoAvulso(vinculo: VinculoAnexo, file: File, meta: MetaAnexo) {
  const { data: auth } = await supabase.auth.getUser();
  const nomeSeguro = file.name.replace(/[^\w.\-]/g, "_");
  const path = `${vinculo.tipo === "persona" ? "personas" : "simulados"}/${vinculo.id}/${crypto.randomUUID()}-${nomeSeguro}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (upErr) throw upErr;
  const { error } = await supabase.from("persona_materiais").insert({
    persona_id: vinculo.tipo === "persona" ? vinculo.id : null,
    simulacao_id: vinculo.tipo === "simulado" ? vinculo.id : null,
    nome: file.name,
    path,
    tipo: file.type,
    tamanho: file.size,
    descricao: meta.descricao,
    momento: meta.momento,
    orientacoes: meta.orientacoes,
    created_by: auth.user?.id ?? null,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

/**
 * Sobe os anexos escolhidos durante a criação, logo após o cadastro ser salvo,
 * permitindo cadastrar personagem/simulado e materiais em uma única etapa.
 */
export async function enviarAnexosPendentes(
  vinculo: VinculoAnexo,
  pendentes: AnexoPendente[],
): Promise<{ enviados: number; falhas: string[] }> {
  const falhas: string[] = [];
  let enviados = 0;
  for (const p of pendentes) {
    try {
      await enviarAnexoAvulso(vinculo, p.file, p.meta);
      enviados += 1;
    } catch (e) {
      falhas.push(`${p.file.name}: ${e instanceof Error ? e.message : "erro no envio"}`);
    }
  }
  return { enviados, falhas };
}


/** Lista apenas os anexos do conteúdo informado (nunca mistura conteúdos). */
export function useAnexos(vinculo?: VinculoAnexo | null) {
  const ativo = Boolean(vinculo?.id) && vinculo?.id !== "nova";
  return useQuery({
    queryKey: chave(vinculo),
    enabled: ativo,
    staleTime: 60_000,
    queryFn: async (): Promise<Anexo[]> => {
      const { data, error } = await supabase
        .from("persona_materiais")
        .select(COLUNAS)
        .eq(coluna(vinculo!), vinculo!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Anexo[];
    },
  });
}

export function useEnviarAnexo(vinculo?: VinculoAnexo | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, meta }: { file: File; meta: MetaAnexo }) => {
      if (!vinculo?.id || vinculo.id === "nova") {
        throw new Error("Salve o cadastro antes de anexar arquivos.");
      }
      const { data: auth } = await supabase.auth.getUser();
      const nomeSeguro = file.name.replace(/[^\w.\-]/g, "_");
      const path = `${vinculo.tipo === "persona" ? "personas" : "simulados"}/${vinculo.id}/${crypto.randomUUID()}-${nomeSeguro}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { error } = await supabase.from("persona_materiais").insert({
        persona_id: vinculo.tipo === "persona" ? vinculo.id : null,
        simulacao_id: vinculo.tipo === "simulado" ? vinculo.id : null,
        nome: file.name,
        path,
        tipo: file.type,
        tamanho: file.size,
        descricao: meta.descricao,
        momento: meta.momento,
        orientacoes: meta.orientacoes,
        created_by: auth.user?.id ?? null,
      });
      if (error) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: chave(vinculo) }),
  });
}

export function useAtualizarAnexo(vinculo?: VinculoAnexo | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, meta }: { id: string; meta: Partial<MetaAnexo> }) => {
      const { error } = await supabase.from("persona_materiais").update(meta).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: chave(vinculo) }),
  });
}

export function useRemoverAnexo(vinculo?: VinculoAnexo | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (anexo: Anexo) => {
      const { error } = await supabase.from("persona_materiais").delete().eq("id", anexo.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([anexo.path]);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: chave(vinculo) }),
  });
}

async function urlAssinada(path: string, download?: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 300, download ? { download } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

/** Abre o anexo em nova aba (visualização). */
export async function visualizarAnexo(path: string) {
  window.open(await urlAssinada(path), "_blank", "noopener");
}

/** Baixa o anexo mantendo o nome original do arquivo. */
export async function baixarAnexo(path: string, nome: string) {
  const url = await urlAssinada(path, nome);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function formatarTamanho(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
