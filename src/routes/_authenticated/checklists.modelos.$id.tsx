import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ChevronDown, GripVertical, ListChecks, Plus, Save, Search, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminShell } from "@/components/checklists/ChecklistsShell";
import {
  carregarEstrutura,
  listarCategorias,
  salvarEstrutura,
  type Criterio,
  type EstruturaChecklist,
  type Exercicio,
  type Secao,
  type ModoCampo,
} from "@/lib/checklists/checklists";

export const Route = createFileRoute("/_authenticated/checklists/modelos/$id")({
  head: () => ({
    meta: [
      { title: "Checklist Mestre | Portal de Desempenho" },
      { name: "description", content: "Edição do Checklist Mestre e matriz de vínculos entre critérios e exercícios." },
      { property: "og:title", content: "Checklist Mestre | Portal de Desempenho" },
      { property: "og:description", content: "Edição do Checklist Mestre e matriz de vínculos entre critérios e exercícios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: allowed } = await supabase.rpc("has_permission", {
      _user_id: data.user.id,
      _permission: "checklists_gerenciar",
    });
    if (allowed !== true) throw redirect({ to: "/checklists/avaliacoes" });
  },
  component: EditorChecklist,
});

const novoId = () => crypto.randomUUID();

function Arrastavel({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 ${
        isDragging ? "opacity-60 shadow-lift" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Arrastar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}
/**
 * Exercício como acordeão: cabeçalho com nome e contador de critérios
 * vinculados; conteúdo com seleção rápida dos critérios do checklist.
 * A relação é N:N — o mesmo critério pode pertencer a vários exercícios.
 */
function ItemExercicio({
  exercicio,
  secoes,
  criterios,
  vinculados,
  aberto,
  onAlternarAberto,
  onRenomear,
  onRemover,
  onAlternarCriterio,
  onMarcarTodos,
}: {
  exercicio: Exercicio;
  secoes: Secao[];
  criterios: Criterio[];
  vinculados: Set<string>;
  aberto: boolean;
  onAlternarAberto: () => void;
  onRenomear: (nome: string) => void;
  onRemover: () => void;
  onAlternarCriterio: (criterioId: string, marcado: boolean) => void;
  onMarcarTodos: (marcar: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercicio.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border border-border bg-card ${isDragging ? "opacity-60 shadow-lift" : ""}`}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground active:cursor-grabbing"
          aria-label="Arrastar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onAlternarAberto}
          aria-expanded={aberto}
          aria-label={aberto ? "Recolher exercício" : "Expandir exercício"}
          className="shrink-0 text-muted-foreground hover:text-heading"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? "rotate-180" : ""}`} />
        </button>
        <Input
          value={exercicio.nome}
          maxLength={120}
          onChange={(e) => onRenomear(e.target.value)}
          className="h-8 border-0 bg-transparent shadow-none focus-visible:bg-background"
        />
        <span className="shrink-0 whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-brand-support">
          Critérios vinculados: {vinculados.size}
        </span>
        <button
          onClick={onRemover}
          title="Remover exercício"
          className="shrink-0 text-muted-foreground hover:text-heading"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {aberto && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          {!criterios.length && (
            <p className="text-sm text-muted-foreground">
              Cadastre critérios nas seções acima para vinculá-los a este exercício.
            </p>
          )}
          {criterios.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onMarcarTodos(true)}>
                Selecionar todos
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onMarcarTodos(false)}>
                Limpar seleção
              </Button>
            </div>
          )}
          {secoes
            .map((s) => ({ secao: s, itens: criterios.filter((c) => c.secao_id === s.id) }))
            .concat([
              {
                secao: { id: "__sem", checklist_id: "", nome: "Sem seção", ordem: 999 } as Secao,
                itens: criterios.filter((c) => !c.secao_id || !secoes.some((s) => s.id === c.secao_id)),
              },
            ])
            .filter((g) => g.itens.length > 0)
            .map((g) => (
              <div key={g.secao.id} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.secao.nome}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {g.itens.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={vinculados.has(c.id)}
                        onCheckedChange={(v) => onAlternarCriterio(c.id, v === true)}
                      />
                      <span className="min-w-0 flex-1 truncate">{c.nome}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">Peso {c.peso}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function MatrizVinculos({
  exercicios,
  secoes,
  criterios,
  vinculos,
  onChange,
}: {
  exercicios: Exercicio[];
  secoes: Secao[];
  criterios: Criterio[];
  vinculos: EstruturaChecklist["vinculos"];
  onChange: (vinculos: EstruturaChecklist["vinculos"]) => void;
}) {
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const { vinculosPorExercicio, totaisPorExercicio } = useMemo(() => {
    const criterioPorId = new Map(criterios.map((criterio) => [criterio.id, criterio]));
    const indice = new Map(exercicios.map((exercicio) => [exercicio.id, new Set<string>()]));

    for (const vinculo of vinculos) {
      if (criterioPorId.has(vinculo.criterio_id)) {
        indice.get(vinculo.exercicio_id)?.add(vinculo.criterio_id);
      }
    }

    const totais = new Map(
      exercicios.map((exercicio) => {
        const ids = indice.get(exercicio.id) ?? new Set<string>();
        const peso = [...ids].reduce(
          (total, criterioId) => total + (criterioPorId.get(criterioId)?.peso ?? 0),
          0,
        );
        return [exercicio.id, { quantidade: ids.size, peso }] as const;
      }),
    );

    return { vinculosPorExercicio: indice, totaisPorExercicio: totais };
  }, [criterios, exercicios, vinculos]);

  const secoesPorId = useMemo(() => new Set(secoes.map((secao) => secao.id)), [secoes]);
  const grupos = useMemo(() => {
    const visiveis = criterios.filter(
      (criterio) => !termo || criterio.nome.toLocaleLowerCase("pt-BR").includes(termo),
    );
    return secoes
      .map((secao) => ({ secao, itens: visiveis.filter((criterio) => criterio.secao_id === secao.id) }))
      .concat([
        {
          secao: { id: "__sem", checklist_id: "", nome: "Sem seção", ordem: 999 } as Secao,
          itens: visiveis.filter((criterio) => !criterio.secao_id || !secoesPorId.has(criterio.secao_id)),
        },
      ])
      .filter((grupo) => grupo.itens.length > 0);
  }, [criterios, secoes, secoesPorId, termo]);

  const temVinculo = (exercicioId: string, criterioId: string) =>
    vinculosPorExercicio.get(exercicioId)?.has(criterioId) ?? false;

  const alterarPares = (
    pares: Array<{ exercicio_id: string; criterio_id: string }>,
    marcar: boolean,
  ) => {
    const porChave = new Map(
      vinculos.map((vinculo) => [`${vinculo.exercicio_id}:${vinculo.criterio_id}`, vinculo]),
    );
    for (const par of pares) {
      const chave = `${par.exercicio_id}:${par.criterio_id}`;
      if (marcar) porChave.set(chave, par);
      else porChave.delete(chave);
    }
    onChange([...porChave.values()]);
  };

  const estadoSelecao = (selecionados: number, total: number) =>
    selecionados === total && total > 0 ? true : selecionados > 0 ? "indeterminate" : false;

  if (!exercicios.length || !criterios.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cadastre ao menos um exercício e um critério para usar a matriz.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-heading">Matriz de critérios</h3>
          <div className="relative mt-2 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar critério"
              aria-label="Buscar critério"
              className="pl-9"
            />
          </div>
        </div>
        <p className="shrink-0 pb-2 text-xs text-muted-foreground">
          {criterios.length} critérios · {exercicios.length} exercícios
        </p>
      </div>
      <div className="relative isolate max-h-[min(68vh,46rem)] max-w-full overflow-auto rounded-lg border border-border bg-card [--matrix-criterion-width:22rem] [--matrix-all-width:4rem] [--matrix-exercise-width:11rem] [scrollbar-gutter:stable]">
        <table className="w-px table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-[var(--matrix-criterion-width)]" />
            <col className="w-[var(--matrix-all-width)]" />
            {exercicios.map((exercicio) => <col key={exercicio.id} className="w-[var(--matrix-exercise-width)]" />)}
          </colgroup>
          <thead className="relative z-30">
            <tr>
              <th scope="col" className="sticky left-0 top-0 z-50 w-[var(--matrix-criterion-width)] border-b border-r border-border bg-card px-5 py-5 text-left align-middle font-semibold text-foreground">
                Seção / critério
              </th>
              <th scope="col" className="sticky left-[var(--matrix-criterion-width)] top-0 z-50 w-[var(--matrix-all-width)] border-b border-r border-border bg-card px-2 py-5 text-center align-middle text-xs font-medium text-muted-foreground">
                Todos
              </th>
              {exercicios.map((exercicio) => {
                const total = totaisPorExercicio.get(exercicio.id) ?? { quantidade: 0, peso: 0 };
                return (
                  <th key={exercicio.id} scope="col" className="sticky top-0 z-40 w-[var(--matrix-exercise-width)] border-b border-r border-border bg-card px-4 py-5 text-center align-top last:border-r-0">
                    <span className="block min-h-10 whitespace-normal break-words font-semibold leading-5 text-foreground" title={exercicio.nome}>{exercicio.nome}</span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {total.quantidade} critérios · {total.peso} pts
                    </span>
                    <Checkbox
                      className="mx-auto mt-4 flex size-4"
                      aria-label={`Selecionar todos os critérios para ${exercicio.nome}`}
                      checked={estadoSelecao(total.quantidade, criterios.length)}
                      onCheckedChange={(valor) =>
                        alterarPares(
                          criterios.map((criterio) => ({ exercicio_id: exercicio.id, criterio_id: criterio.id })),
                          valor === true,
                        )
                      }
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grupos.map(({ secao, itens }) => (
              <Fragment key={secao.id}>
                <tr>
                  <th scope="rowgroup" className="sticky left-0 z-20 w-[var(--matrix-criterion-width)] border-b border-r border-border bg-muted px-5 py-3.5 text-left text-xs font-semibold uppercase leading-5 text-foreground">
                    {secao.nome}
                  </th>
                  <td className="sticky left-[var(--matrix-criterion-width)] z-20 w-[var(--matrix-all-width)] border-b border-r border-border bg-muted px-2 py-3.5 text-center align-middle">
                    {(() => {
                      const selecionados = itens.reduce(
                        (total, criterio) => total + exercicios.filter((exercicio) => temVinculo(exercicio.id, criterio.id)).length,
                        0,
                      );
                      const total = itens.length * exercicios.length;
                      return (
                        <Checkbox
                          className="mx-auto flex size-4"
                          aria-label={`Vincular critérios exibidos da seção ${secao.nome} a todos os exercícios`}
                          checked={estadoSelecao(selecionados, total)}
                          onCheckedChange={(valor) =>
                            alterarPares(
                              exercicios.flatMap((exercicio) => itens.map((criterio) => ({ exercicio_id: exercicio.id, criterio_id: criterio.id }))),
                              valor === true,
                            )
                          }
                        />
                      );
                    })()}
                  </td>
                  {exercicios.map((exercicio) => {
                    const quantidade = itens.filter((c) => temVinculo(exercicio.id, c.id)).length;
                    return (
                      <td key={exercicio.id} className="border-b border-r border-border bg-muted px-4 py-3.5 text-center align-middle last:border-r-0">
                        <Checkbox
                          className="mx-auto flex size-4"
                          aria-label={`Vincular critérios exibidos da seção ${secao.nome} a ${exercicio.nome}`}
                          checked={estadoSelecao(quantidade, itens.length)}
                          onCheckedChange={(valor) =>
                            alterarPares(
                              itens.map((criterio) => ({ exercicio_id: exercicio.id, criterio_id: criterio.id })),
                              valor === true,
                            )
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
                {itens.map((criterio) => {
                  const quantidade = exercicios.filter((e) => temVinculo(e.id, criterio.id)).length;
                  return (
                    <tr key={criterio.id} className="group/criterio">
                      <th scope="row" className="sticky left-0 z-10 w-[var(--matrix-criterion-width)] border-b border-r border-border/60 bg-card px-5 py-4 text-left align-middle group-hover/criterio:bg-muted">
                        <span className="block whitespace-normal break-words font-normal leading-6 text-foreground" title={criterio.nome}>{criterio.nome}</span>
                        <span className="mt-1 block text-xs font-normal leading-4 text-muted-foreground">Peso {criterio.peso}</span>
                      </th>
                      <td className="sticky left-[var(--matrix-criterion-width)] z-10 w-[var(--matrix-all-width)] border-b border-r border-border/60 bg-card px-2 py-4 text-center align-middle group-hover/criterio:bg-muted">
                        <Checkbox
                          className="mx-auto flex size-4"
                          aria-label={`Vincular ${criterio.nome} a todos os exercícios`}
                          checked={estadoSelecao(quantidade, exercicios.length)}
                          onCheckedChange={(valor) =>
                            alterarPares(
                              exercicios.map((exercicio) => ({ exercicio_id: exercicio.id, criterio_id: criterio.id })),
                              valor === true,
                            )
                          }
                        />
                      </td>
                      {exercicios.map((exercicio) => (
                        <td key={exercicio.id} className="border-b border-r border-border/60 bg-card px-4 py-4 text-center align-middle group-hover/criterio:bg-muted last:border-r-0">
                          <Checkbox
                            className="mx-auto flex size-4"
                            aria-label={`Vincular ${criterio.nome} a ${exercicio.nome}`}
                            checked={temVinculo(exercicio.id, criterio.id)}
                            onCheckedChange={(valor) =>
                              alterarPares(
                                [{ exercicio_id: exercicio.id, criterio_id: criterio.id }],
                                valor === true,
                              )
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {!grupos.length && (
        <p className="py-5 text-center text-sm text-muted-foreground">Nenhum critério encontrado.</p>
      )}
    </div>
  );
}


function EditorChecklist() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [estrutura, setEstrutura] = useState<EstruturaChecklist | null>(null);
  const [expandidos, setExpandidos] = useState<string[]>([]);

  const consulta = useQuery({
    queryKey: ["checklist", id],
    queryFn: () => carregarEstrutura(id),
  });
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });

  useEffect(() => {
    if (consulta.data) setEstrutura(consulta.data);
  }, [consulta.data]);

  const salvar = useMutation({
    mutationFn: (e: EstruturaChecklist) => salvarEstrutura(e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists"] });
      qc.invalidateQueries({ queryKey: ["checklist", id] });
      toast.success("Checklist salvo.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!estrutura) {
    return (
      <AdminShell titulo="Checklist" descricao="Carregando...">
        <div className="surface h-40 animate-pulse" />
      </AdminShell>
    );
  }

  const { checklist, secoes, criterios, exercicios, vinculos } = estrutura;
  const vinculadosPorExercicio = new Map<string, Set<string>>(
    exercicios.map((x) => [
      x.id,
      new Set(vinculos.filter((v) => v.exercicio_id === x.id).map((v) => v.criterio_id)),
    ]),
  );
  const patch = (p: Partial<EstruturaChecklist>) => setEstrutura({ ...estrutura, ...p });
  const patchChecklist = (p: Partial<typeof checklist>) =>
    patch({ checklist: { ...checklist, ...p } });

  const addSecao = () =>
    patch({
      secoes: [
        ...secoes,
        { id: novoId(), checklist_id: checklist.id, nome: "Nova seção", ordem: secoes.length },
      ] as Secao[],
    });

  const addCriterio = (secaoId: string) =>
    patch({
      criterios: [
        ...criterios,
        {
          id: novoId(),
          checklist_id: checklist.id,
          secao_id: secaoId,
          nome: "Novo critério",
          peso: 3,
          obrigatorio: false,
          ordem: criterios.length,
        },
      ] as Criterio[],
    });

  const addExercicio = () =>
    patch({
      exercicios: [
        ...exercicios,
        {
          id: novoId(),
          checklist_id: checklist.id,
          nome: `Exercício ${exercicios.length + 1}`,
          obrigatorio: true,
          ordem: exercicios.length,
        },
      ] as Exercicio[],
    });

  const reordenar = <T extends { id: string }>(lista: T[], e: DragEndEvent): T[] => {
    const { active, over } = e;
    if (!over || active.id === over.id) return lista;
    const de = lista.findIndex((i) => i.id === active.id);
    const para = lista.findIndex((i) => i.id === over.id);
    if (de < 0 || para < 0) return lista;
    return arrayMove(lista, de, para);
  };

  return (
    <AdminShell
      titulo={checklist.nome || "Checklist"}
      descricao="Edite seções, critérios, pesos e exercícios"
      acoes={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/checklists/modelos">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          <Button size="sm" onClick={() => salvar.mutate(estrutura)} disabled={salvar.isPending}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <section className="surface space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome do checklist</Label>
                <Input
                  value={checklist.nome}
                  maxLength={120}
                  onChange={(e) => patchChecklist({ nome: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={checklist.categoria_id ?? "none"}
                  onValueChange={(v) => patchChecklist({ categoria_id: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {(categorias.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                value={checklist.descricao}
                maxLength={500}
                rows={2}
                onChange={(e) => patchChecklist({ descricao: e.target.value })}
              />
            </div>
          </section>

          <section className="surface overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Seções e critérios</h2>
                <p className="text-xs text-muted-foreground">
                  Arraste para reordenar. O peso define o impacto na nota (1 a 5).
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addSecao}>
                <Plus className="h-4 w-4" /> Seção
              </Button>
            </header>

            <div className="space-y-5 p-5">
              {secoes.map((s) => {
                const daSecao = criterios.filter((c) => c.secao_id === s.id);
                return (
                  <div key={s.id} className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Input
                        value={s.nome}
                        maxLength={80}
                        onChange={(e) =>
                          patch({
                            secoes: secoes.map((x) =>
                              x.id === s.id ? { ...x, nome: e.target.value } : x,
                            ),
                          })
                        }
                        className="h-9 font-semibold text-heading"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          patch({
                            secoes: secoes.filter((x) => x.id !== s.id),
                            criterios: criterios.filter((c) => c.secao_id !== s.id),
                          })
                        }
                        title="Remover seção"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => {
                        const reordenados = reordenar(daSecao, e);
                        const outros = criterios.filter((c) => c.secao_id !== s.id);
                        patch({ criterios: [...outros, ...reordenados] });
                      }}
                    >
                      <SortableContext
                        items={daSecao.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {daSecao.map((c) => (
                            <Arrastavel key={c.id} id={c.id}>
                              <Input
                                value={c.nome}
                                maxLength={160}
                                onChange={(e) =>
                                  patch({
                                    criterios: criterios.map((x) =>
                                      x.id === c.id ? { ...x, nome: e.target.value } : x,
                                    ),
                                  })
                                }
                                className="h-8 border-0 bg-transparent shadow-none focus-visible:bg-background"
                              />
                              <Select
                                value={String(c.peso)}
                                onValueChange={(v) =>
                                  patch({
                                    criterios: criterios.map((x) =>
                                      x.id === c.id ? { ...x, peso: Number(v) } : x,
                                    ),
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 w-16 shrink-0 text-xs font-semibold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5].map((p) => (
                                    <SelectItem key={p} value={String(p)}>
                                      Peso {p}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() =>
                                  patch({ criterios: criterios.filter((x) => x.id !== c.id) })
                                }
                                title="Remover critério"
                                className="shrink-0 text-muted-foreground hover:text-heading"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </Arrastavel>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => addCriterio(s.id)}
                    >
                      <Plus className="h-4 w-4" /> Critério
                    </Button>
                  </div>
                );
              })}
              {!secoes.length && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Adicione uma seção para começar.
                </p>
              )}
            </div>
          </section>

          <section className="surface overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Exercícios</h2>
                <p className="text-xs text-muted-foreground">
                  Vincule critérios pela matriz ou edite um exercício por vez.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addExercicio}>
                <Plus className="h-4 w-4" /> Exercício
              </Button>
            </header>
            <Tabs defaultValue="matriz" className="p-5">
              <TabsList aria-label="Modo de vínculo dos critérios">
                <TabsTrigger value="matriz" className="gap-2">
                  <Table2 className="size-4" /> Matriz
                </TabsTrigger>
                <TabsTrigger value="exercicio" className="gap-2">
                  <ListChecks className="size-4" /> Por exercício
                </TabsTrigger>
              </TabsList>
              <TabsContent value="matriz" className="mt-4">
                <MatrizVinculos
                  exercicios={exercicios}
                  secoes={secoes}
                  criterios={criterios}
                  vinculos={vinculos}
                  onChange={(novosVinculos) => patch({ vinculos: novosVinculos })}
                />
              </TabsContent>
              <TabsContent value="exercicio" className="mt-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => patch({ exercicios: reordenar(exercicios, e) })}
                >
                  <SortableContext
                    items={exercicios.map((x) => x.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {exercicios.map((x) => (
                        <ItemExercicio
                          key={x.id}
                          exercicio={x}
                          secoes={secoes}
                          criterios={criterios}
                          vinculados={vinculadosPorExercicio.get(x.id) ?? new Set<string>()}
                          aberto={expandidos.includes(x.id)}
                          onAlternarAberto={() =>
                            setExpandidos((atual) =>
                              atual.includes(x.id)
                                ? atual.filter((i) => i !== x.id)
                                : [...atual, x.id],
                            )
                          }
                          onRenomear={(nome) =>
                            patch({ exercicios: exercicios.map((y) => (y.id === x.id ? { ...y, nome } : y)) })
                          }
                          onRemover={() =>
                            patch({
                              exercicios: exercicios.filter((y) => y.id !== x.id),
                              vinculos: vinculos.filter((v) => v.exercicio_id !== x.id),
                            })
                          }
                          onAlternarCriterio={(criterioId, marcado) =>
                            patch({
                              vinculos: marcado
                                ? [...vinculos, { exercicio_id: x.id, criterio_id: criterioId }]
                                : vinculos.filter(
                                    (v) => !(v.exercicio_id === x.id && v.criterio_id === criterioId),
                                  ),
                            })
                          }
                          onMarcarTodos={(marcar) =>
                            patch({
                              vinculos: marcar
                                ? [
                                    ...vinculos.filter((v) => v.exercicio_id !== x.id),
                                    ...criterios.map((c) => ({ exercicio_id: x.id, criterio_id: c.id })),
                                  ]
                                : vinculos.filter((v) => v.exercicio_id !== x.id),
                            })
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {!exercicios.length && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum exercício cadastrado.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="surface h-fit space-y-5 p-5">
          <h2 className="text-sm font-semibold">Configurações</h2>

          <div className="space-y-1.5">
            <Label>Nota mínima de aprovação (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={checklist.nota_minima}
              onChange={(e) =>
                patchChecklist({
                  nota_minima: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-heading">Permitir observações</p>
              <p className="text-xs text-muted-foreground">Campos de feedback por exercício.</p>
            </div>
            <Switch
              checked={checklist.permite_observacoes}
              onCheckedChange={(v) => patchChecklist({ permite_observacoes: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-heading">Observações obrigatórias</p>
              <p className="text-xs text-muted-foreground">Exigir preenchimento no envio.</p>
            </div>
            <Switch
              checked={checklist.observacoes_obrigatorias}
              disabled={!checklist.permite_observacoes}
              onCheckedChange={(v) => patchChecklist({ observacoes_obrigatorias: v })}
            />
          </div>

          <div className="space-y-1.5 border-t border-border pt-4">
            <Label>Pontos fortes</Label>
            <Select
              value={checklist.pontos_fortes_modo}
              onValueChange={(v) => patchChecklist({ pontos_fortes_modo: v as ModoCampo })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                <SelectItem value="opcional">Opcional</SelectItem>
                <SelectItem value="oculto">Oculto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Pontos de desenvolvimento</Label>
            <Select
              value={checklist.pontos_desenvolvimento_modo}
              onValueChange={(v) => patchChecklist({ pontos_desenvolvimento_modo: v as ModoCampo })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                <SelectItem value="opcional">Opcional</SelectItem>
                <SelectItem value="oculto">Oculto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-heading">Checklist ativo</p>
              <p className="text-xs text-muted-foreground">Disponível para distribuição.</p>
            </div>
            <Switch
              checked={checklist.ativo}
              onCheckedChange={(v) => patchChecklist({ ativo: v })}
            />
          </div>

          <div className="rounded-xl bg-secondary p-4 text-xs text-brand-support">
            <p className="font-semibold text-brand-dark">Resumo</p>
            <p className="mt-1">
              {secoes.length} seções · {criterios.length} critérios · {exercicios.length} exercícios
            </p>
            <p>Peso total: {criterios.reduce((s, c) => s + c.peso, 0)}</p>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
