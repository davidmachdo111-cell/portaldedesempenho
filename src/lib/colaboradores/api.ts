import { supabase } from "@/integrations/supabase/client";

/**
 * Cadastro central de colaboradores.
 * É a única fonte de dados de pessoas para os módulos (Checklists, Personagens
 * e Exercícios). Os módulos continuam com suas próprias tabelas de conteúdo —
 * aqui ficam apenas as pessoas, as liberações e o histórico.
 */

export type StatusColaborador = "ativo" | "inativo";
export type TipoAtividade = "checklist" | "simulado" | "persona";
export type StatusAtividade = "pendente" | "em_andamento" | "concluida";

export interface Colaborador {
  id: string;
  nome_completo: string;
  username: string;
  cargo: string;
  setor: string;
  celula: string;
  data_admissao: string | null;
  status: StatusColaborador;
  campos_extras: Record<string, unknown>;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AtividadeColaborador {
  id: string;
  colaborador_id: string;
  tipo: TipoAtividade;
  ref_id: string | null;
  titulo: string;
  ordem: number;
  status: StatusAtividade;
  concluida_em: string | null;
  avaliacao_id: string | null;
  observacao: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricoColaborador {
  id: string;
  colaborador_id: string | null;
  acao: string;
  detalhes: Record<string, unknown>;
  user_id: string | null;
  user_nome: string | null;
  created_at: string;
}

export interface ItemCatalogo {
  tipo: TipoAtividade;
  ref_id: string;
  titulo: string;
  detalhe: string;
}

export type ColaboradorInput = {
  nome_completo: string;
  username: string;
  cargo: string;
  setor: string;
  celula: string;
  data_admissao: string | null;
  status: StatusColaborador;
};

const check = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

async function autor() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id ?? null;
  if (!id) return { id: null as string | null, nome: null as string | null };
  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", id)
    .maybeSingle();
  return { id, nome: perfil?.full_name || perfil?.username || null };
}

async function registrar(
  colaborador_id: string,
  acao: string,
  detalhes: Record<string, unknown> = {},
) {
  const a = await autor();
  await supabase
    .from("colaborador_historico")
    .insert({
      colaborador_id,
      acao,
      detalhes: JSON.parse(JSON.stringify(detalhes)),
      user_id: a.id,
      user_nome: a.nome,
    });
}

/* ---------- colaboradores ---------- */

export const LABEL_TIPO: Record<TipoAtividade, string> = {
  checklist: "Checklist",
  simulado: "Exercício",
  persona: "Personagem",
};

export async function listarColaboradores(): Promise<Colaborador[]> {
  return check(
    await supabase.from("colaboradores").select("*").order("nome_completo"),
  ) as Colaborador[];
}

export async function carregarColaborador(id: string): Promise<Colaborador> {
  return check(
    await supabase.from("colaboradores").select("*").eq("id", id).single(),
  ) as Colaborador;
}

export async function criarColaborador(input: ColaboradorInput): Promise<Colaborador> {
  const a = await autor();
  const row = check(
    await supabase
      .from("colaboradores")
      .insert({ ...input, created_by: a.id })
      .select()
      .single(),
  ) as Colaborador;
  await registrar(row.id, "criado", { nome_completo: row.nome_completo });
  return row;
}

export async function atualizarColaborador(
  id: string,
  patch: Partial<ColaboradorInput>,
): Promise<Colaborador> {
  const row = check(
    await supabase.from("colaboradores").update(patch).eq("id", id).select().single(),
  ) as Colaborador;
  await registrar(id, "atualizado", patch as Record<string, unknown>);
  return row;
}

export async function excluirColaborador(id: string) {
  const { error } = await supabase.from("colaboradores").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- liberações ---------- */

export async function listarAtividades(colaboradorId: string): Promise<AtividadeColaborador[]> {
  return check(
    await supabase
      .from("colaborador_atividades")
      .select("*")
      .eq("colaborador_id", colaboradorId)
      .order("ordem")
      .order("created_at"),
  ) as AtividadeColaborador[];
}

export async function listarTodasAtividades(): Promise<AtividadeColaborador[]> {
  return check(
    await supabase.from("colaborador_atividades").select("*"),
  ) as AtividadeColaborador[];
}

export async function liberarAtividades(colaboradorId: string, itens: ItemCatalogo[]) {
  if (!itens.length) return;
  const atuais = await listarAtividades(colaboradorId);
  let ordem = atuais.length ? Math.max(...atuais.map((a) => a.ordem)) + 1 : 0;
  const a = await autor();
  const rows = itens.map((i) => ({
    colaborador_id: colaboradorId,
    tipo: i.tipo,
    ref_id: i.ref_id,
    titulo: i.titulo,
    ordem: ordem++,
    created_by: a.id,
  }));
  const { error } = await supabase.from("colaborador_atividades").insert(rows);
  if (error) throw new Error(error.message);
  await registrar(colaboradorId, "atividades_liberadas", { itens: itens.map((i) => i.titulo) });
}

export async function removerAtividade(atividade: AtividadeColaborador) {
  const { error } = await supabase
    .from("colaborador_atividades")
    .delete()
    .eq("id", atividade.id);
  if (error) throw new Error(error.message);
  await registrar(atividade.colaborador_id, "atividade_removida", { titulo: atividade.titulo });
}

export async function alterarStatusAtividade(
  atividade: AtividadeColaborador,
  status: StatusAtividade,
) {
  const { error } = await supabase
    .from("colaborador_atividades")
    .update({
      status,
      concluida_em: status === "concluida" ? new Date().toISOString() : null,
    })
    .eq("id", atividade.id);
  if (error) throw new Error(error.message);
  await registrar(atividade.colaborador_id, `atividade_${status}`, { titulo: atividade.titulo });
}

/** Reordena a lista completa de atividades do colaborador. */
export async function reordenarAtividades(ids: string[]) {
  await Promise.all(
    ids.map((id, index) =>
      supabase.from("colaborador_atividades").update({ ordem: index }).eq("id", id),
    ),
  );
}

/* ---------- catálogo (vem dos módulos, sem duplicar cadastro) ---------- */

export async function listarCatalogo(): Promise<ItemCatalogo[]> {
  const [checklists, simulacoes, personas] = await Promise.all([
    supabase.from("checklists").select("id, nome, descricao").eq("ativo", true).order("nome"),
    supabase.from("simulacoes").select("id, nome, exercicio").order("nome"),
    supabase.from("personas").select("id, nome, exercicio, status").order("nome"),
  ]);

  const itens: ItemCatalogo[] = [];
  for (const c of checklists.data ?? []) {
    itens.push({
      tipo: "checklist",
      ref_id: c.id,
      titulo: c.nome,
      detalhe: c.descricao || "Checklist",
    });
  }
  for (const s of simulacoes.data ?? []) {
    itens.push({
      tipo: "simulado",
      ref_id: s.id,
      titulo: s.nome,
      detalhe: s.exercicio || "Exercício",
    });
  }
  for (const p of personas.data ?? []) {
    itens.push({
      tipo: "persona",
      ref_id: p.id,
      titulo: p.nome,
      detalhe: p.exercicio || "Personagem",
    });
  }
  return itens;
}

/* ---------- histórico e integração com avaliações ---------- */

export async function listarHistorico(colaboradorId: string): Promise<HistoricoColaborador[]> {
  return check(
    await supabase
      .from("colaborador_historico")
      .select("*")
      .eq("colaborador_id", colaboradorId)
      .order("created_at", { ascending: false })
      .limit(60),
  ) as HistoricoColaborador[];
}

export interface AvaliacaoColaborador {
  id: string;
  checklist_id: string;
  status: string;
  media: number;
  data_avaliacao: string;
  updated_at: string;
}

export async function listarAvaliacoesDoColaborador(
  colaboradorId: string,
): Promise<AvaliacaoColaborador[]> {
  return check(
    await supabase
      .from("avaliacoes")
      .select("id, checklist_id, status, media, data_avaliacao, updated_at")
      .eq("colaborador_id", colaboradorId)
      .order("updated_at", { ascending: false }),
  ) as AvaliacaoColaborador[];
}

/**
 * Abre a avaliação de um checklist pendente já vinculada ao colaborador
 * cadastrado — evitando qualquer cadastro paralelo dentro do módulo.
 */
export async function iniciarAvaliacaoPendente(
  atividade: AtividadeColaborador,
  colaborador: Colaborador,
): Promise<string> {
  if (atividade.tipo !== "checklist" || !atividade.ref_id) {
    throw new Error("Esta atividade não é um checklist.");
  }
  const a = await autor();
  if (!a.id) throw new Error("Sessão expirada.");

  const existente = check(
    await supabase
      .from("avaliacoes")
      .select("id")
      .eq("colaborador_id", colaborador.id)
      .eq("checklist_id", atividade.ref_id)
      .eq("avaliador_id", a.id)
      .eq("status", "rascunho")
      .maybeSingle(),
  ) as { id: string } | null;
  if (existente) return existente.id;

  const row = check(
    await supabase
      .from("avaliacoes")
      .insert({
        checklist_id: atividade.ref_id,
        avaliador_id: a.id,
        colaborador_id: colaborador.id,
        colaborador_nome: colaborador.nome_completo,
        setor: colaborador.setor,
        tutor: a.nome ?? "",
        data_avaliacao: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single(),
  ) as { id: string };
  await registrar(colaborador.id, "avaliacao_iniciada", { titulo: atividade.titulo });
  return row.id;
}

/* ---------- métricas ---------- */

export function progresso(atividades: AtividadeColaborador[]) {
  const total = atividades.length;
  const concluidas = atividades.filter((a) => a.status === "concluida").length;
  return {
    total,
    concluidas,
    pendentes: total - concluidas,
    percentual: total ? Math.round((concluidas / total) * 100) : 0,
  };
}

export const formatarData = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

export const formatarDataHora = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("pt-BR") : "—";

/* ---------- desempenho: listagem paginada e contagens sob demanda ---------- */

export const COLUNAS_LISTA =
  "id, nome_completo, username, cargo, setor, celula, data_admissao, status, updated_at";

export type ColaboradorLista = Pick<
  Colaborador,
  | "id"
  | "nome_completo"
  | "username"
  | "cargo"
  | "setor"
  | "celula"
  | "data_admissao"
  | "status"
  | "updated_at"
>;

/** Busca uma página de colaboradores com filtro aplicado no banco. */
export async function listarColaboradoresPagina(opcoes: {
  busca?: string;
  pagina: number;
  porPagina: number;
}): Promise<{ itens: ColaboradorLista[]; total: number }> {
  const { busca = "", pagina, porPagina } = opcoes;
  const inicio = pagina * porPagina;
  let query = supabase
    .from("colaboradores")
    .select(COLUNAS_LISTA, { count: "exact" })
    .order("nome_completo")
    .range(inicio, inicio + porPagina - 1);

  const termo = busca.trim();
  if (termo) {
    const like = `%${termo}%`;
    query = query.or(
      [
        `nome_completo.ilike.${like}`,
        `username.ilike.${like}`,
        `cargo.ilike.${like}`,
        `setor.ilike.${like}`,
        `celula.ilike.${like}`,
      ].join(","),
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { itens: (data ?? []) as ColaboradorLista[], total: count ?? 0 };
}

/** Contagem de atividades apenas dos colaboradores exibidos na página atual. */
export async function resumoAtividades(
  colaboradorIds: string[],
): Promise<Record<string, { total: number; concluidas: number }>> {
  if (!colaboradorIds.length) return {};
  const { data, error } = await supabase
    .from("colaborador_atividades")
    .select("colaborador_id, status")
    .in("colaborador_id", colaboradorIds);
  if (error) throw new Error(error.message);
  const mapa: Record<string, { total: number; concluidas: number }> = {};
  for (const row of data ?? []) {
    const item = (mapa[row.colaborador_id] ??= { total: 0, concluidas: 0 });
    item.total += 1;
    if (row.status === "concluida") item.concluidas += 1;
  }
  return mapa;
}

/* ---------- conteúdos vinculados (exercícios e personagens do colaborador) ---------- */

export interface AnexoVinculado {
  id: string;
  nome: string;
  path: string;
  tamanho: number | null;
  descricao: string;
  momento: string;
  orientacoes: string;
}

export interface PersonaDoConteudo {
  id: string;
  nome: string;
  detalhe: string;
  anexos: AnexoVinculado[];
}

export interface ConteudoVinculado {
  atividadeId: string;
  tipo: "simulado" | "persona";
  refId: string;
  titulo: string;
  detalhe: string;
  status: StatusAtividade;
  concluidaEm: string | null;
  concluidoPorNome: string | null;
  anexos: AnexoVinculado[];
  /** Personagens que compõem o simulado (vazio quando o item já é um personagem). */
  personas: PersonaDoConteudo[];
}

type AnexoBruto = AnexoVinculado & { persona_id: string | null; simulacao_id: string | null };

/**
 * Exercícios e personagens liberados para o colaborador selecionado, com os
 * anexos enviados no cadastro e os personagens de cada simulado. As políticas
 * do banco garantem que apenas conteúdos vinculados fiquem visíveis.
 */
export async function listarConteudosVinculados(
  colaboradorId: string,
): Promise<ConteudoVinculado[]> {
  const { data: atividades, error } = await supabase
    .from("colaborador_atividades")
    .select("id, tipo, ref_id, titulo, ordem, status, concluida_em, concluido_por_nome")
    .eq("colaborador_id", colaboradorId)
    .in("tipo", ["simulado", "persona"])
    .order("ordem");
  if (error) throw new Error(error.message);

  const simuladoIds = (atividades ?? [])
    .filter((a) => a.tipo === "simulado" && a.ref_id)
    .map((a) => a.ref_id as string);
  const personaIdsDiretos = (atividades ?? [])
    .filter((a) => a.tipo === "persona" && a.ref_id)
    .map((a) => a.ref_id as string);

  if (!simuladoIds.length && !personaIdsDiretos.length) return [];

  const colunasAnexo =
    "id, nome, path, tamanho, descricao, momento, orientacoes, persona_id, simulacao_id";

  const simulados = simuladoIds.length
    ? ((
        await supabase.from("simulacoes").select("id, nome, exercicio, persona_ids").in("id", simuladoIds)
      ).data ?? []).map((s) => ({
        ...s,
        persona_ids: (s.persona_ids ?? []) as string[],
      }))
    : [];

  // Personagens do simulado entram na lista para que o material da persona
  // (PDF e demais anexos) também fique disponível.
  const personaIds = Array.from(
    new Set([...personaIdsDiretos, ...simulados.flatMap((s) => s.persona_ids)]),
  );

  const [personasRes, anexosRes] = await Promise.all([
    personaIds.length
      ? supabase.from("personas").select("id, nome, exercicio").in("id", personaIds)
      : Promise.resolve({ data: [] as { id: string; nome: string; exercicio: string | null }[] }),
    supabase
      .from("persona_materiais")
      .select(colunasAnexo)
      .or(
        [
          personaIds.length ? `persona_id.in.(${personaIds.join(",")})` : null,
          simuladoIds.length ? `simulacao_id.in.(${simuladoIds.join(",")})` : null,
        ]
          .filter(Boolean)
          .join(","),
      ),
  ]);

  const personasInfo = personasRes.data ?? [];
  const anexos = (anexosRes.data ?? []) as AnexoBruto[];
  const limpar = ({ persona_id: _p, simulacao_id: _s, ...anexo }: AnexoBruto): AnexoVinculado =>
    anexo;

  const montarPersona = (personaId: string): PersonaDoConteudo => {
    const info = personasInfo.find((p) => p.id === personaId);
    return {
      id: personaId,
      nome: info?.nome ?? "Personagem",
      detalhe: info?.exercicio || "Personagem",
      anexos: anexos.filter((m) => m.persona_id === personaId).map(limpar),
    };
  };

  return (atividades ?? [])
    .filter((a) => a.ref_id)
    .map((a) => {
      const refId = a.ref_id as string;
      const simulado = a.tipo === "simulado" ? simulados.find((s) => s.id === refId) : undefined;
      const persona = a.tipo === "persona" ? personasInfo.find((p) => p.id === refId) : undefined;
      return {
        atividadeId: a.id,
        tipo: a.tipo as "simulado" | "persona",
        refId,
        titulo: simulado?.nome ?? persona?.nome ?? a.titulo,
        detalhe:
          simulado?.exercicio ||
          persona?.exercicio ||
          (a.tipo === "simulado" ? "Exercício" : "Personagem"),
        status: (a.status ?? "pendente") as StatusAtividade,
        concluidaEm: a.concluida_em ?? null,
        concluidoPorNome: a.concluido_por_nome ?? null,
        anexos:
          a.tipo === "simulado"
            ? anexos.filter((m) => m.simulacao_id === refId).map(limpar)
            : anexos.filter((m) => m.persona_id === refId).map(limpar),
        personas: simulado ? simulado.persona_ids.map(montarPersona) : [],
      };
    });
}

/* ---------- controle de conclusão do treinamento ---------- */

export const LABEL_STATUS_ATIVIDADE: Record<StatusAtividade, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluído",
};

/**
 * Registra o andamento do treinamento de um personagem/simulado.
 * Ao concluir, guarda data e usuário responsável — sem substituir o checklist
 * de avaliação.
 */
export async function registrarAndamentoAtividade(
  atividade: { id: string; colaborador_id: string; titulo: string },
  status: StatusAtividade,
) {
  const a = await autor();
  const concluida = status === "concluida";
  const { error } = await supabase
    .from("colaborador_atividades")
    .update({
      status,
      concluida_em: concluida ? new Date().toISOString() : null,
      concluido_por: concluida ? a.id : null,
      concluido_por_nome: concluida ? a.nome : null,
    })
    .eq("id", atividade.id);
  if (error) throw new Error(error.message);
  await registrar(atividade.colaborador_id, `atividade_${status}`, {
    titulo: atividade.titulo,
    usuario: a.nome,
  });
}


/* ---------- vínculos com avaliadores e auxiliares ---------- */

export type PapelResponsavel = "avaliador" | "auxiliar";

export interface ResponsavelColaborador {
  id: string;
  colaborador_id: string;
  user_id: string;
  papel: PapelResponsavel;
  created_at: string;
}

/** Vínculos dos colaboradores informados (usado na listagem paginada). */
export async function listarResponsaveis(
  colaboradorIds: string[],
): Promise<Record<string, ResponsavelColaborador[]>> {
  if (!colaboradorIds.length) return {};
  const { data, error } = await supabase
    .from("colaborador_responsaveis")
    .select("id, colaborador_id, user_id, papel, created_at")
    .in("colaborador_id", colaboradorIds);
  if (error) throw new Error(error.message);
  const mapa: Record<string, ResponsavelColaborador[]> = {};
  for (const r of (data ?? []) as ResponsavelColaborador[]) {
    (mapa[r.colaborador_id] ??= []).push(r);
  }
  return mapa;
}

/** Todos os vínculos ativos — visão geral do administrador. */
export async function listarTodosVinculos(): Promise<
  (ResponsavelColaborador & { colaborador_nome: string })[]
> {
  const { data, error } = await supabase
    .from("colaborador_responsaveis")
    .select("id, colaborador_id, user_id, papel, created_at, colaboradores(nome_completo)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]).map((r) => {
    const row = r as ResponsavelColaborador & { colaboradores?: { nome_completo?: string } | null };
    return { ...row, colaborador_nome: row.colaboradores?.nome_completo ?? "—" };
  });
}

export async function vincularResponsavel(input: {
  colaborador_id: string;
  user_id: string;
  papel: PapelResponsavel;
  nome_colaborador?: string;
  nome_usuario?: string;
}) {
  const a = await autor();
  const { error } = await supabase.from("colaborador_responsaveis").insert({
    colaborador_id: input.colaborador_id,
    user_id: input.user_id,
    papel: input.papel,
    created_by: a.id,
  });
  if (error) throw new Error(error.message);
  await registrar(input.colaborador_id, "vinculo_responsavel_criado", {
    papel: input.papel,
    usuario: input.nome_usuario ?? input.user_id,
  });
}

export async function desvincularResponsavel(vinculo: ResponsavelColaborador, nome?: string) {
  const { error } = await supabase
    .from("colaborador_responsaveis")
    .delete()
    .eq("id", vinculo.id);
  if (error) throw new Error(error.message);
  await registrar(vinculo.colaborador_id, "vinculo_responsavel_removido", {
    papel: vinculo.papel,
    usuario: nome ?? vinculo.user_id,
  });
}

/** Nomes dos usuários responsáveis (visível a quem tem acesso ao módulo). */
export async function listarNomesResponsaveis(
  userIds: string[],
): Promise<Record<string, string>> {
  if (!userIds.length) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", userIds);
  if (error) throw new Error(error.message);
  return Object.fromEntries(
    (data ?? []).map((p) => [p.id, p.full_name || p.username]),
  );
}

/** O usuário atual é responsável (avaliador/auxiliar) por este colaborador? */
export async function souResponsavel(colaboradorId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("colaborador_sob_responsabilidade", {
    _colaborador_id: colaboradorId,
  });
  if (error) throw new Error(error.message);
  return data === true;
}

/* ---------- vínculos Exercício x Colaborador (tabela pivot) ---------- */

export interface ExercicioDisponivel {
  id: string;
  nome: string;
  detalhe: string;
}

export interface VinculoExercicio {
  id: string;
  colaborador_id: string;
  simulacao_id: string;
  created_at: string;
}

/** Exercícios que o usuário atual pode ver (o banco já filtra pelo vínculo). */
export async function listarExerciciosDisponiveis(): Promise<ExercicioDisponivel[]> {
  const { data, error } = await supabase
    .from("simulacoes")
    .select("id, nome, exercicio, persona_ids")
    .order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    detalhe: [s.exercicio, `${(s.persona_ids ?? []).length} personagem(ns)`]
      .filter(Boolean)
      .join(" · "),
  }));
}

/** Vínculos de exercícios dos colaboradores informados. */
export async function listarVinculosExercicios(
  colaboradorIds: string[],
): Promise<Record<string, VinculoExercicio[]>> {
  if (!colaboradorIds.length) return {};
  const { data, error } = await supabase
    .from("colaborador_exercicios")
    .select("id, colaborador_id, simulacao_id, created_at")
    .in("colaborador_id", colaboradorIds);
  if (error) throw new Error(error.message);
  const mapa: Record<string, VinculoExercicio[]> = {};
  for (const v of (data ?? []) as VinculoExercicio[]) {
    (mapa[v.colaborador_id] ??= []).push(v);
  }
  return mapa;
}

/**
 * Vincula um exercício ao colaborador. Além do pivot, cria a atividade
 * correspondente para que o acompanhamento de status continue funcionando.
 */
export async function vincularExercicio(colaboradorId: string, exercicio: ExercicioDisponivel) {
  const a = await autor();
  const { error } = await supabase.from("colaborador_exercicios").insert({
    colaborador_id: colaboradorId,
    simulacao_id: exercicio.id,
    created_by: a.id,
  });
  if (error && error.code !== "23505") throw new Error(error.message);

  const atuais = await listarAtividades(colaboradorId);
  const jaTem = atuais.some((x) => x.tipo === "simulado" && x.ref_id === exercicio.id);
  if (!jaTem) {
    await liberarAtividades(colaboradorId, [
      { tipo: "simulado", ref_id: exercicio.id, titulo: exercicio.nome, detalhe: exercicio.detalhe },
    ]);
  }
  await registrar(colaboradorId, "exercicio_vinculado", { exercicio: exercicio.nome });
}

/** Desvincula o exercício do colaborador — o exercício e os personagens permanecem. */
export async function desvincularExercicio(colaboradorId: string, exercicioId: string, nome?: string) {
  const { error } = await supabase
    .from("colaborador_exercicios")
    .delete()
    .eq("colaborador_id", colaboradorId)
    .eq("simulacao_id", exercicioId);
  if (error) throw new Error(error.message);

  const { error: erroAtividade } = await supabase
    .from("colaborador_atividades")
    .delete()
    .eq("colaborador_id", colaboradorId)
    .eq("tipo", "simulado")
    .eq("ref_id", exercicioId);
  if (erroAtividade) throw new Error(erroAtividade.message);

  await registrar(colaboradorId, "exercicio_desvinculado", { exercicio: nome ?? exercicioId });
}
