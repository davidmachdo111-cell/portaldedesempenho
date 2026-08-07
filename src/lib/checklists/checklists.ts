import { supabase } from "@/integrations/supabase/client";

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
}




export type ModoCampo = "obrigatorio" | "opcional" | "oculto";

export interface Checklist {
  id: string;
  nome: string;
  descricao: string;
  categoria_id: string | null;
  nota_minima: number;
  permite_observacoes: boolean;
  observacoes_obrigatorias: boolean;
  pontos_fortes_modo: ModoCampo;
  pontos_desenvolvimento_modo: ModoCampo;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Secao {
  id: string;
  checklist_id: string;
  nome: string;
  ordem: number;
}

export interface Criterio {
  id: string;
  checklist_id: string;
  secao_id: string | null;
  nome: string;
  peso: number;
  obrigatorio: boolean;
  ordem: number;
}

export interface Exercicio {
  id: string;
  checklist_id: string;
  nome: string;
  obrigatorio: boolean;
  ordem: number;
}

/** Vínculo N:N entre um exercício do checklist e um critério. */
export interface VinculoExercicioCriterio {
  exercicio_id: string;
  criterio_id: string;
}

export interface EstruturaChecklist {
  checklist: Checklist;
  secoes: Secao[];
  criterios: Criterio[];
  exercicios: Exercicio[];
  /** Critérios vinculados a cada exercício (N:N, sem duplicar critérios). */
  vinculos: VinculoExercicioCriterio[];
}

const check = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

/* ---------- categorias ---------- */

export async function listarCategorias(): Promise<Categoria[]> {
  return check(await supabase.from("categorias").select("*").order("nome"));
}

export async function criarCategoria(nome: string): Promise<Categoria> {
  return check(await supabase.from("categorias").insert({ nome }).select().single());
}

export async function excluirCategoria(id: string) {
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) throw new Error(error.message);
}




/* ---------- checklists ---------- */

export interface ChecklistResumo extends Checklist {
  categoria: Categoria | null;
  totalCriterios: number;
}

export async function listarChecklists(): Promise<ChecklistResumo[]> {
  const checklists = check(
    await supabase.from("checklists").select("*").order("created_at", { ascending: false }),
  ) as Checklist[];
  const categorias = await listarCategorias();
  const criterios = check(await supabase.from("criterios").select("id, checklist_id")) as {
    id: string;
    checklist_id: string;
  }[];

  return checklists.map((c) => ({
    ...c,
    categoria: categorias.find((cat) => cat.id === c.categoria_id) ?? null,
    totalCriterios: criterios.filter((cr) => cr.checklist_id === c.id).length,
  }));
}

export async function criarChecklist(nome = "Novo checklist"): Promise<Checklist> {
  const { data: userData } = await supabase.auth.getUser();
  const checklist = check(
    await supabase
      .from("checklists")
      .insert({ nome, created_by: userData.user?.id ?? null })
      .select()
      .single(),
  ) as Checklist;

  const secao = check(
    await supabase
      .from("secoes")
      .insert({ checklist_id: checklist.id, nome: "Conhecimento técnico", ordem: 0 })
      .select()
      .single(),
  ) as Secao;

  await supabase.from("criterios").insert({
    checklist_id: checklist.id,
    secao_id: secao.id,
    nome: "Novo critério",
    peso: 3,
    ordem: 0,
  });
  await supabase
    .from("exercicios")
    .insert({ checklist_id: checklist.id, nome: "Exercício 1", ordem: 0 });

  return checklist;
}

export async function carregarEstrutura(id: string): Promise<EstruturaChecklist> {
  const checklist = check(
    await supabase.from("checklists").select("*").eq("id", id).single(),
  ) as Checklist;
  const secoes = check(
    await supabase.from("secoes").select("*").eq("checklist_id", id).order("ordem"),
  ) as Secao[];
  const criterios = check(
    await supabase.from("criterios").select("*").eq("checklist_id", id).order("ordem"),
  ) as Criterio[];
  const exercicios = check(
    await supabase.from("exercicios").select("*").eq("checklist_id", id).order("ordem"),
  ) as Exercicio[];
  return { checklist, secoes, criterios, exercicios };
}

export async function salvarEstrutura(e: EstruturaChecklist) {
  const { checklist, secoes, criterios, exercicios } = e;

  const upd = await supabase
    .from("checklists")
    .update({
      nome: checklist.nome,
      descricao: checklist.descricao,
      categoria_id: checklist.categoria_id,
      nota_minima: checklist.nota_minima,
      permite_observacoes: checklist.permite_observacoes,
      observacoes_obrigatorias: checklist.observacoes_obrigatorias,
      pontos_fortes_modo: checklist.pontos_fortes_modo,
      pontos_desenvolvimento_modo: checklist.pontos_desenvolvimento_modo,
      ativo: checklist.ativo,
    })
    .eq("id", checklist.id);
  if (upd.error) throw new Error(upd.error.message);

  const original = await carregarEstrutura(checklist.id);

  const removerSecoes = original.secoes.filter((s) => !secoes.some((x) => x.id === s.id));
  const removerCriterios = original.criterios.filter((c) => !criterios.some((x) => x.id === c.id));
  const removerExercicios = original.exercicios.filter(
    (x) => !exercicios.some((y) => y.id === x.id),
  );

  if (removerCriterios.length)
    await supabase
      .from("criterios")
      .delete()
      .in(
        "id",
        removerCriterios.map((c) => c.id),
      );
  if (removerExercicios.length)
    await supabase
      .from("exercicios")
      .delete()
      .in(
        "id",
        removerExercicios.map((c) => c.id),
      );
  if (removerSecoes.length)
    await supabase
      .from("secoes")
      .delete()
      .in(
        "id",
        removerSecoes.map((c) => c.id),
      );

  if (secoes.length) {
    const r = await supabase.from("secoes").upsert(
      secoes.map((s, i) => ({
        id: s.id,
        checklist_id: checklist.id,
        nome: s.nome,
        ordem: i,
      })),
    );
    if (r.error) throw new Error(r.error.message);
  }
  if (criterios.length) {
    const r = await supabase.from("criterios").upsert(
      criterios.map((c, i) => ({
        id: c.id,
        checklist_id: checklist.id,
        secao_id: c.secao_id,
        nome: c.nome,
        peso: c.peso,
        obrigatorio: c.obrigatorio,
        ordem: i,
      })),
    );
    if (r.error) throw new Error(r.error.message);
  }
  if (exercicios.length) {
    const r = await supabase.from("exercicios").upsert(
      exercicios.map((x, i) => ({
        id: x.id,
        checklist_id: checklist.id,
        nome: x.nome,
        obrigatorio: x.obrigatorio,
        ordem: i,
      })),
    );
    if (r.error) throw new Error(r.error.message);
  }
}

export async function duplicarChecklist(id: string): Promise<Checklist> {
  const { checklist, secoes, criterios, exercicios } = await carregarEstrutura(id);
  const { data: userData } = await supabase.auth.getUser();

  const novo = check(
    await supabase
      .from("checklists")
      .insert({
        nome: `${checklist.nome} (cópia)`,
        descricao: checklist.descricao,
        categoria_id: checklist.categoria_id,
        nota_minima: checklist.nota_minima,
        permite_observacoes: checklist.permite_observacoes,
        observacoes_obrigatorias: checklist.observacoes_obrigatorias,
        pontos_fortes_modo: checklist.pontos_fortes_modo,
        pontos_desenvolvimento_modo: checklist.pontos_desenvolvimento_modo,
        created_by: userData.user?.id ?? null,
      })
      .select()
      .single(),
  ) as Checklist;

  const mapaSecoes = new Map<string, string>();
  for (const s of secoes) {
    const nova = check(
      await supabase
        .from("secoes")
        .insert({ checklist_id: novo.id, nome: s.nome, ordem: s.ordem })
        .select()
        .single(),
    ) as Secao;
    mapaSecoes.set(s.id, nova.id);
  }
  if (criterios.length) {
    await supabase.from("criterios").insert(
      criterios.map((c) => ({
        checklist_id: novo.id,
        secao_id: c.secao_id ? (mapaSecoes.get(c.secao_id) ?? null) : null,
        nome: c.nome,
        peso: c.peso,
        obrigatorio: c.obrigatorio,
        ordem: c.ordem,
      })),
    );
  }
  if (exercicios.length) {
    await supabase.from("exercicios").insert(
      exercicios.map((x) => ({
        checklist_id: novo.id,
        nome: x.nome,
        obrigatorio: x.obrigatorio,
        ordem: x.ordem,
      })),
    );
  }
  return novo;
}

export async function excluirChecklist(id: string) {
  const { error } = await supabase.from("checklists").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export const formatarData = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
