import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HistoricoItem, Persona, Simulacao } from "./constants";

/* ------------------------------ helpers ------------------------------ */

async function registrarHistorico(input: {
  persona_id?: string | null;
  persona_nome?: string | null;
  acao: string;
  detalhes?: Record<string, unknown>;
}) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  // Identidade vem do cadastro central de usuários da plataforma.
  const { data: perfil } = user
    ? await supabase.from("profiles").select("full_name, username").eq("id", user.id).maybeSingle()
    : { data: null };
  const nome = perfil?.full_name || perfil?.username || user?.email || "Usuário";
  await supabase.from("persona_historico").insert({
    persona_id: input.persona_id ?? null,
    persona_nome: input.persona_nome ?? null,
    acao: input.acao,
    detalhes: (input.detalhes ?? {}) as never,
    user_id: user?.id ?? null,
    user_nome: nome,
  });
}

function diffPersona(antes: Partial<Persona>, depois: Partial<Persona>) {
  const alterados: string[] = [];
  for (const key of Object.keys(depois)) {
    const a = JSON.stringify((antes as Record<string, unknown>)[key] ?? null);
    const b = JSON.stringify((depois as Record<string, unknown>)[key] ?? null);
    if (a !== b) alterados.push(key);
  }
  return alterados;
}

/* ------------------------------ personas ------------------------------ */

export type PersonaResumo = Pick<
  Persona,
  | "id"
  | "nome"
  | "cidade"
  | "tipo_cliente"
  | "exercicio"
  | "vertente"
  | "complexidade"
  | "objetivo"
  | "status"
  | "favorita"
  | "created_at"
  | "updated_at"
>;

const COLUNAS_RESUMO =
  "id, nome, cidade, tipo_cliente, exercicio, vertente, complexidade, objetivo, status, favorita, created_at, updated_at";

export type FiltrosPersonas = {
  pagina: number;
  porPagina?: number;
  busca?: string;
  exercicio?: string;
  vertente?: string;
  complexidade?: string;
  status?: string;
  cidade?: string;
  tipoCliente?: string;
};

export function usePersonasPaginadas(filtros: FiltrosPersonas) {
  return useQuery({
    queryKey: ["personas", "lista", filtros],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<{ itens: PersonaResumo[]; total: number }> => {
      const porPagina = filtros.porPagina ?? 24;
      const inicio = (filtros.pagina - 1) * porPagina;
      let consulta = supabase
        .from("personas")
        .select(COLUNAS_RESUMO, { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(inicio, inicio + porPagina - 1);
      if (filtros.exercicio) consulta = consulta.eq("exercicio", filtros.exercicio);
      if (filtros.vertente) consulta = consulta.eq("vertente", filtros.vertente);
      if (filtros.complexidade) consulta = consulta.eq("complexidade", filtros.complexidade);
      if (filtros.status) consulta = consulta.eq("status", filtros.status);
      if (filtros.cidade) consulta = consulta.ilike("cidade", `%${filtros.cidade}%`);
      if (filtros.tipoCliente) consulta = consulta.ilike("tipo_cliente", `%${filtros.tipoCliente}%`);
      if (filtros.busca) {
        const termo = filtros.busca.replace(/[,%()]/g, " ").trim();
        if (termo) consulta = consulta.or(`nome.ilike.%${termo}%,objetivo.ilike.%${termo}%`);
      }
      const { data, error, count } = await consulta;
      if (error) throw error;
      return { itens: (data ?? []) as PersonaResumo[], total: count ?? 0 };
    },
  });
}

export function usePersonasPorIds(ids: string[]) {
  const chave = [...ids].sort();
  return useQuery({
    queryKey: ["personas", "ids", chave],
    enabled: chave.length > 0,
    queryFn: async (): Promise<Persona[]> => {
      const { data, error } = await supabase.from("personas").select("*").in("id", chave);
      if (error) throw error;
      return (data ?? []) as unknown as Persona[];
    },
  });
}

export function usePersonas() {
  return useQuery({
    queryKey: ["personas"],
    queryFn: async (): Promise<Persona[]> => {
      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Persona[];
    },
  });
}

export function usePersona(id?: string) {
  return useQuery({
    queryKey: ["persona", id],
    enabled: !!id && id !== "nova",
    queryFn: async (): Promise<Persona | null> => {
      const { data, error } = await supabase.from("personas").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as unknown as Persona) ?? null;
    },
  });
}

export function useSalvarPersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Partial<Persona> }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;

      if (id) {
        const { data: antes } = await supabase.from("personas").select("*").eq("id", id).maybeSingle();
        const { data, error } = await supabase
          .from("personas")
          .update({ ...values, updated_by: uid } as never)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        const campos = diffPersona((antes ?? {}) as Partial<Persona>, values);
        await registrarHistorico({
          persona_id: id,
          persona_nome: (data as unknown as Persona).nome,
          acao: "Persona editada",
          detalhes: { campos },
        });
        return data as unknown as Persona;
      }

      const { data, error } = await supabase
        .from("personas")
        .insert({ ...values, created_by: uid, updated_by: uid } as never)
        .select()
        .single();
      if (error) throw error;
      await registrarHistorico({
        persona_id: (data as unknown as Persona).id,
        persona_nome: (data as unknown as Persona).nome,
        acao: "Persona criada",
      });
      return data as unknown as Persona;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personas"] });
      qc.invalidateQueries({ queryKey: ["historico"] });
    },
  });
}

export function useAcoesPersona() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["personas"] });
    qc.invalidateQueries({ queryKey: ["historico"] });
  };

  const duplicar = useMutation({
    mutationFn: async (persona: PersonaResumo) => {
      const { data: auth } = await supabase.auth.getUser();
      const { data: original, error: erroOriginal } = await supabase
        .from("personas")
        .select("*")
        .eq("id", persona.id)
        .single();
      if (erroOriginal) throw erroOriginal;
      const {
        id: _id,
        created_at: _c,
        updated_at: _u,
        created_by: _cb,
        updated_by: _ub,
        ...resto
      } = original as unknown as Persona;
      const { data, error } = await supabase
        .from("personas")
        .insert({
          ...resto,
          nome: `${persona.nome} (cópia)`,
          favorita: false,
          created_by: auth.user?.id ?? null,
          updated_by: auth.user?.id ?? null,
        } as never)
        .select()
        .single();
      if (error) throw error;
      await registrarHistorico({
        persona_id: (data as unknown as Persona).id,
        persona_nome: (data as unknown as Persona).nome,
        acao: "Persona duplicada",
        detalhes: { origem: persona.nome },
      });
      return data as unknown as Persona;
    },
    onSuccess: invalidate,
  });

  const alternarStatus = useMutation({
    mutationFn: async (persona: PersonaResumo) => {
      const novo = persona.status === "ativa" ? "arquivada" : "ativa";
      const { error } = await supabase.from("personas").update({ status: novo }).eq("id", persona.id);
      if (error) throw error;
      await registrarHistorico({
        persona_id: persona.id,
        persona_nome: persona.nome,
        acao: novo === "arquivada" ? "Persona arquivada" : "Persona reativada",
      });
      return novo;
    },
    onSuccess: invalidate,
  });

  const alternarFavorita = useMutation({
    mutationFn: async (persona: PersonaResumo) => {
      const { error } = await supabase
        .from("personas")
        .update({ favorita: !persona.favorita })
        .eq("id", persona.id);
      if (error) throw error;
      return !persona.favorita;
    },
    onSuccess: invalidate,
  });

  const excluir = useMutation({
    mutationFn: async (persona: PersonaResumo) => {
      await registrarHistorico({
        persona_id: null,
        persona_nome: persona.nome,
        acao: "Persona excluída",
      });
      const { error } = await supabase.from("personas").delete().eq("id", persona.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { duplicar, alternarStatus, alternarFavorita, excluir };
}

/* ------------------------------ histórico ------------------------------ */

export function useHistorico(personaId?: string, limite = 30) {
  return useQuery({
    queryKey: ["historico", personaId ?? "geral", limite],
    queryFn: async (): Promise<HistoricoItem[]> => {
      let q = supabase
        .from("persona_historico")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limite);
      if (personaId) q = q.eq("persona_id", personaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as HistoricoItem[];
    },
  });
}

/* --------------------------- perfis personalizados --------------------------- */

export function usePerfisPersonalizados() {
  return useQuery({
    queryKey: ["perfis"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("perfis_comportamentais").select("nome").order("nome");
      if (error) throw error;
      return (data ?? []).map((p) => (p as { nome: string }).nome);
    },
  });
}

export function useCriarPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase.from("perfis_comportamentais").insert({ nome });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["perfis"] }),
  });
}

/* ------------------------------ materiais ------------------------------ */

export type Material = {
  id: string;
  persona_id: string;
  nome: string;
  path: string;
  tipo: string | null;
  tamanho: number | null;
  created_at: string;
};

export function useMateriais(personaId?: string) {
  return useQuery({
    queryKey: ["materiais", personaId],
    enabled: !!personaId && personaId !== "nova",
    queryFn: async (): Promise<Material[]> => {
      const { data, error } = await supabase
        .from("persona_materiais")
        .select("*")
        .eq("persona_id", personaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Material[];
    },
  });
}

export function useUploadMaterial(personaId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!personaId) throw new Error("Salve a persona antes de anexar materiais.");
      const { data: auth } = await supabase.auth.getUser();
      const path = `${personaId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("persona-materiais").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("persona_materiais").insert({
        persona_id: personaId,
        nome: file.name,
        path,
        tipo: file.type,
        tamanho: file.size,
        created_by: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiais", personaId] }),
  });
}

export function useRemoverMaterial(personaId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (material: Material) => {
      await supabase.storage.from("persona-materiais").remove([material.path]);
      const { error } = await supabase.from("persona_materiais").delete().eq("id", material.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiais", personaId] }),
  });
}

export async function abrirMaterial(path: string) {
  const { data, error } = await supabase.storage.from("persona-materiais").createSignedUrl(path, 300);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}

/* ------------------------------ exercícios ------------------------------ */

/**
 * Sincroniza a relação N:N entre exercício e personagens (tabela pivot).
 * Remover um exercício apaga apenas os vínculos — os personagens continuam
 * disponíveis para outros exercícios.
 */
async function sincronizarPersonasDoExercicio(simulacaoId: string, personaIds: string[]) {
  const { data: atuais, error: erroLeitura } = await supabase
    .from("simulacao_personas")
    .select("id, persona_id")
    .eq("simulacao_id", simulacaoId);
  if (erroLeitura) throw erroLeitura;

  const existentes = (atuais ?? []) as { id: string; persona_id: string }[];
  const remover = existentes.filter((v) => !personaIds.includes(v.persona_id)).map((v) => v.id);
  const inserir = personaIds
    .filter((id) => !existentes.some((v) => v.persona_id === id))
    .map((id) => ({
      simulacao_id: simulacaoId,
      persona_id: id,
      ordem: personaIds.indexOf(id),
    }));

  if (remover.length) {
    const { error } = await supabase.from("simulacao_personas").delete().in("id", remover);
    if (error) throw error;
  }
  if (inserir.length) {
    const { error } = await supabase.from("simulacao_personas").insert(inserir);
    if (error) throw error;
  }
  // Mantém a ordem escolhida também nos vínculos que já existiam.
  await Promise.all(
    personaIds.map((personaId, ordem) =>
      supabase
        .from("simulacao_personas")
        .update({ ordem })
        .eq("simulacao_id", simulacaoId)
        .eq("persona_id", personaId),
    ),
  );
}

export function useSimulacoes() {
  return useQuery({
    queryKey: ["simulacoes"],
    queryFn: async (): Promise<Simulacao[]> => {
      const { data, error } = await supabase
        .from("simulacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Simulacao[];
    },
  });
}

export function useSalvarSimulacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Partial<Simulacao> }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { persona_ids: personaIds, ...campos } = values;

      let salva: Simulacao;
      if (id) {
        const { data, error } = await supabase
          .from("simulacoes")
          .update(campos as never)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        salva = data as unknown as Simulacao;
      } else {
        const { data, error } = await supabase
          .from("simulacoes")
          .insert({ ...campos, created_by: auth.user?.id ?? null } as never)
          .select()
          .single();
        if (error) throw error;
        salva = data as unknown as Simulacao;
      }

      if (personaIds) {
        await sincronizarPersonasDoExercicio(salva.id, personaIds);
        salva = { ...salva, persona_ids: personaIds };
      }
      return salva;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulacoes"] }),
  });
}

export function useExcluirSimulacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Os vínculos com personagens caem por cascata; os personagens permanecem.
      const { error } = await supabase.from("simulacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulacoes"] }),
  });
}
