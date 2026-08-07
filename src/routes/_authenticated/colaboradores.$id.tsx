import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  PlayCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { ConteudosVinculados } from "@/components/colaboradores/ConteudosVinculados";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  alterarStatusAtividade,
  atualizarColaborador,
  carregarColaborador,
  formatarData,
  formatarDataHora,
  iniciarAvaliacaoPendente,
  LABEL_TIPO,
  liberarAtividades,
  listarAtividades,
  listarAvaliacoesDoColaborador,
  listarCatalogo,
  listarHistorico,
  progresso,
  removerAtividade,
  reordenarAtividades,
  type AtividadeColaborador,
  type ColaboradorInput,
  type ItemCatalogo,
  type TipoAtividade,
} from "@/lib/colaboradores/api";

export const Route = createFileRoute("/_authenticated/colaboradores/$id")({
  component: PainelColaborador,
});

function PainelColaborador() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { podeGerenciarColaboradores, podeAvaliar } = useAuth();

  const [liberar, setLiberar] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [edicao, setEdicao] = useState<Partial<ColaboradorInput> | null>(null);

  const colaborador = useQuery({
    queryKey: ["colaboradores", id],
    queryFn: () => carregarColaborador(id),
  });
  const atividades = useQuery({
    queryKey: ["colaboradores", id, "atividades"],
    queryFn: () => listarAtividades(id),
  });
  const historico = useQuery({
    queryKey: ["colaboradores", id, "historico"],
    queryFn: () => listarHistorico(id),
  });
  const avaliacoes = useQuery({
    queryKey: ["colaboradores", id, "avaliacoes"],
    queryFn: () => listarAvaliacoesDoColaborador(id),
  });
  const catalogo = useQuery({
    queryKey: ["colaboradores", "catalogo"],
    queryFn: listarCatalogo,
    enabled: liberar,
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["colaboradores"] });
  const erro = (e: Error) => toast.error(e.message);

  const salvarDados = useMutation({
    mutationFn: () => atualizarColaborador(id, edicao ?? {}),
    onSuccess: () => {
      toast.success("Cadastro atualizado.");
      setEdicao(null);
      invalidar();
    },
    onError: erro,
  });

  const liberarMut = useMutation({
    mutationFn: async () => {
      const itens = (catalogo.data ?? []).filter((i) =>
        selecionados.includes(`${i.tipo}:${i.ref_id}`),
      );
      await liberarAtividades(id, itens);
    },
    onSuccess: () => {
      toast.success("Atividades liberadas.");
      setLiberar(false);
      setSelecionados([]);
      invalidar();
    },
    onError: erro,
  });

  const remover = useMutation({
    mutationFn: (a: AtividadeColaborador) => removerAtividade(a),
    onSuccess: invalidar,
    onError: erro,
  });

  const alternarStatus = useMutation({
    mutationFn: (a: AtividadeColaborador) =>
      alterarStatusAtividade(a, a.status === "concluida" ? "pendente" : "concluida"),
    onSuccess: invalidar,
    onError: erro,
  });

  const reordenar = useMutation({
    mutationFn: (ids: string[]) => reordenarAtividades(ids),
    onSuccess: invalidar,
    onError: erro,
  });

  const avaliar = useMutation({
    mutationFn: async (a: AtividadeColaborador) => {
      const dados = colaborador.data;
      if (!dados) throw new Error("Colaborador não carregado.");
      return iniciarAvaliacaoPendente(a, dados);
    },
    onSuccess: (avaliacaoId) => {
      navigate({ to: "/checklists/avaliacoes/$id", params: { id: avaliacaoId } });
    },
    onError: erro,
  });

  const dados = colaborador.data;
  // Auxiliar não tem acesso a checklists: as atividades desse tipo ficam ocultas.
  const lista = (atividades.data ?? []).filter(
    (a) => podeVerChecklists || a.tipo !== "checklist",
  );
  const m = progresso(lista);
  const porTipo = (tipo: TipoAtividade) => lista.filter((a) => a.tipo === tipo);
  const ultima =
    lista
      .map((a) => a.concluida_em)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null;

  function mover(index: number, delta: number) {
    const ids = lista.map((a) => a.id);
    const alvo = index + delta;
    if (alvo < 0 || alvo >= ids.length) return;
    const copia = [...ids];
    const atual = copia[index]!;
    copia[index] = copia[alvo]!;
    copia[alvo] = atual;
    reordenar.mutate(copia);
  }

  const agrupado = catalogo.data ?? [];
  const tipos: TipoAtividade[] = ["checklist", "simulado", "persona"];

  return (
    <PlatformShell
      title={dados?.nome_completo ?? "Colaborador"}
      subtitle="Painel individual de treinamentos e atividades"
    >
      {!dados ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica
              titulo="Progresso"
              valor={`${m.percentual}%`}
              detalhe={`${m.concluidas} de ${m.total} atividades`}
            />
            <Metrica
              titulo="Pendentes"
              valor={String(m.pendentes)}
              detalhe="Aguardando conclusão"
            />
            <Metrica
              titulo="Checklists"
              valor={`${porTipo("checklist").filter((a) => a.status === "concluida").length}/${porTipo("checklist").length}`}
              detalhe="Concluídos / liberados"
            />
            <Metrica
              titulo="Simulados"
              valor={`${porTipo("simulado").filter((a) => a.status === "concluida").length}/${porTipo("simulado").length}`}
              detalhe={`Última atividade: ${formatarData(ultima)}`}
            />
          </div>

          <Tabs defaultValue="atividades">
            <TabsList>
              <TabsTrigger value="atividades">Treinamentos e Atividades</TabsTrigger>
              <TabsTrigger value="conteudos">Personagens e Simulados</TabsTrigger>
              <TabsTrigger value="dados">Dados cadastrais</TabsTrigger>
              <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="atividades" className="mt-4 space-y-4">
              {podeGerenciarColaboradores && (
                <Button onClick={() => setLiberar(true)}>
                  <Plus className="size-4" /> Liberar atividades
                </Button>
              )}
              <div className="overflow-hidden rounded-xl border bg-card">
                <ul className="divide-y">
                  {lista.map((a, index) => (
                      <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                        {a.status === "concluida" ? (
                          <CheckCircle2 className="size-5 shrink-0 text-primary" />
                        ) : (
                          <Circle className="size-5 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.titulo}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {LABEL_TIPO[a.tipo]}
                            {a.status === "concluida"
                              ? ` · concluído em ${formatarDataHora(a.concluida_em)}`
                              : " · pendente"}
                          </p>
                        </div>
                        <Badge variant={a.status === "concluida" ? "default" : "secondary"}>
                          {a.status === "concluida" ? "Concluído" : "Pendente"}
                        </Badge>
                        {podeAvaliar && a.tipo === "checklist" && a.status !== "concluida" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={avaliar.isPending}
                            onClick={() => avaliar.mutate(a)}
                          >
                            <PlayCircle className="size-4" /> Avaliar
                          </Button>
                        )}
                        {podeGerenciarColaboradores && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => mover(index, -1)}>
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => mover(index, 1)}>
                              <ArrowDown className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Alternar conclusão"
                              onClick={() => alternarStatus.mutate(a)}
                            >
                              <ClipboardCheck className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => remover.mutate(a)}
                              title="Remover liberação"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  {!atividades.isLoading && !lista.length && (
                    <li className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Nenhuma atividade liberada para este colaborador.
                    </li>
                  )}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="conteudos" className="mt-4">
              <ConteudosVinculados colaboradorId={id} />
            </TabsContent>

            <TabsContent value="dados" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dados cadastrais</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {podeGerenciarColaboradores ? (
                    <>
                      <Campo
                        label="Nome completo"
                        value={edicao?.nome_completo ?? dados.nome_completo}
                        onChange={(v) => setEdicao({ ...edicao, nome_completo: v })}
                      />
                      <Campo
                        label="Cargo"
                        value={edicao?.cargo ?? dados.cargo}
                        onChange={(v) => setEdicao({ ...edicao, cargo: v })}
                      />
                      <Campo
                        label="Setor"
                        value={edicao?.setor ?? dados.setor}
                        onChange={(v) => setEdicao({ ...edicao, setor: v })}
                      />
                      <Campo
                        label="Célula"
                        value={edicao?.celula ?? dados.celula}
                        onChange={(v) => setEdicao({ ...edicao, celula: v })}
                      />
                      <Campo
                        label="Data de admissão"
                        type="date"
                        value={edicao?.data_admissao ?? dados.data_admissao ?? ""}
                        onChange={(v) => setEdicao({ ...edicao, data_admissao: v || null })}
                      />
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={edicao?.status ?? dados.status}
                          onValueChange={(v) =>
                            setEdicao({ ...edicao, status: v as "ativo" | "inativo" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          disabled={!edicao || salvarDados.isPending}
                          onClick={() => salvarDados.mutate()}
                        >
                          <Save className="size-4" /> Salvar alterações
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Leitura label="Nome completo" value={dados.nome_completo} />
                      <Leitura label="Usuário" value={`@${dados.username}`} />
                      <Leitura label="Cargo" value={dados.cargo || "—"} />
                      <Leitura label="Setor" value={dados.setor || "—"} />
                      <Leitura label="Célula" value={dados.celula || "—"} />
                      <Leitura label="Admissão" value={formatarData(dados.data_admissao)} />
                      <Leitura
                        label="Status"
                        value={dados.status === "ativo" ? "Ativo" : "Inativo"}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="avaliacoes" className="mt-4">
              <div className="overflow-hidden rounded-xl border bg-card">
                <ul className="divide-y">
                  {(avaliacoes.data ?? []).map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {lista.find((x) => x.ref_id === a.checklist_id)?.titulo ?? "Checklist"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(a.data_avaliacao)} · média {Number(a.media).toFixed(1)}
                        </p>
                      </div>
                      <Badge variant={a.status === "concluida" ? "default" : "secondary"}>
                        {a.status === "concluida" ? "Concluída" : "Rascunho"}
                      </Badge>
                    </li>
                  ))}
                  {!avaliacoes.isLoading && !(avaliacoes.data ?? []).length && (
                    <li className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Nenhuma avaliação registrada.
                    </li>
                  )}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <div className="overflow-hidden rounded-xl border bg-card">
                <ul className="divide-y">
                  {(historico.data ?? []).map((h) => (
                    <li key={h.id} className="px-5 py-3">
                      <p className="text-sm font-medium">{h.acao.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatarDataHora(h.created_at)}
                        {h.user_nome ? ` · ${h.user_nome}` : ""}
                      </p>
                    </li>
                  ))}
                  {!historico.isLoading && !(historico.data ?? []).length && (
                    <li className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Sem histórico registrado.
                    </li>
                  )}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={liberar} onOpenChange={setLiberar}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Liberar treinamentos e atividades</DialogTitle>
            <DialogDescription>
              Selecione os conteúdos criados nos módulos que este colaborador deverá realizar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {tipos.map((tipo) => {
              const itens = agrupado.filter((i) => i.tipo === tipo);
              if (!itens.length) return null;
              return (
                <section key={tipo} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {LABEL_TIPO[tipo]}s
                  </h3>
                  <ul className="space-y-1">
                    {itens.map((i: ItemCatalogo) => {
                      const chave = `${i.tipo}:${i.ref_id}`;
                      const jaLiberado = lista.some(
                        (a) => a.tipo === i.tipo && a.ref_id === i.ref_id,
                      );
                      return (
                        <li key={chave} className="flex items-center gap-3">
                          <Checkbox
                            disabled={jaLiberado}
                            checked={jaLiberado || selecionados.includes(chave)}
                            onCheckedChange={(v) =>
                              setSelecionados((prev) =>
                                v === true ? [...prev, chave] : prev.filter((x) => x !== chave),
                              )
                            }
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm">{i.titulo}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {jaLiberado ? "já liberado" : i.detalhe}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
            {catalogo.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiberar(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!selecionados.length || liberarMut.isPending}
              onClick={() => liberarMut.mutate()}
            >
              Liberar selecionados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlatformShell>
  );
}

function Metrica({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {titulo}
        </p>
        <p className="mt-1 text-2xl font-semibold">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
      </CardContent>
    </Card>
  );
}

function Campo({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Leitura({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
