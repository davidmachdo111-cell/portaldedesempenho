import { useDeferredValue, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Eye,
  LayoutGrid,
  Pencil,
  Printer,
  Search,
  Star,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/personas/PersonasShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAcoesPersona, usePersona, usePersonasPaginadas, usePersonasPorIds, type PersonaResumo } from "@/lib/personas/api";
import { useAuth } from "@/hooks/useAuth";
import {
  COMPLEXIDADES,
  COMPLEXIDADE_TOM,
  EXERCICIOS,
  VERTENTES,
  formatarData,
  type Persona,
} from "@/lib/personas/constants";
import { PersonaPrint } from "@/components/personas/PersonaPrint";
import { AcoesPdfPersona } from "@/components/personas/PdfPersonaAcoes";
import { usePdfsDePersonas } from "@/lib/personas/pdf";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/personagens/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Personas | Portal de Desempenho" },
      {
        name: "description",
        content:
          "Pesquise, filtre, duplique, arquive e imprima todas as personas cadastradas para exercícios realísticas.",
      },
      { property: "og:title", content: "Biblioteca de Personas" },
      {
        property: "og:description",
        content: "Todas as personas cadastradas com filtros avançados e ações em um clique.",
      },
    ],
  }),
  component: Biblioteca,
});

const TODOS = "__todos__";

function Selecao({
  valor,
  onChange,
  opcoes,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  opcoes: readonly string[];
  placeholder: string;
}) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{placeholder}: todos</SelectItem>
        {opcoes.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Biblioteca() {
  const navigate = useNavigate();
  const { podeGerenciarPersonagens } = useAuth();
  const { duplicar, alternarStatus, alternarFavorita, excluir } = useAcoesPersona();

  const [busca, setBusca] = useState("");
  const [exercicio, setExercicio] = useState(TODOS);
  const [vertente, setVertente] = useState(TODOS);
  const [complexidade, setComplexidade] = useState(TODOS);
  const [status, setStatus] = useState("ativa");
  const [cidade, setCidade] = useState("");
  const [tipoCliente, setTipoCliente] = useState("");
  const [visual, setVisual] = useState<"cards" | "tabela">("cards");
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [visualizando, setVisualizando] = useState<PersonaResumo | null>(null);
  const [aExcluir, setAExcluir] = useState<PersonaResumo | null>(null);
  const [pagina, setPagina] = useState(1);
  const buscaAdiada = useDeferredValue(busca);
  const filtros = {
    pagina,
    busca: buscaAdiada,
    exercicio: exercicio === TODOS ? undefined : exercicio,
    vertente: vertente === TODOS ? undefined : vertente,
    complexidade: complexidade === TODOS ? undefined : complexidade,
    status: status === TODOS ? undefined : status,
    cidade,
    tipoCliente,
  };
  const consulta = usePersonasPaginadas(filtros);
  const personas = consulta.data?.itens ?? [];
  const total = consulta.data?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / 24));
  const { data: pdfs = {} } = usePdfsDePersonas(personas.map((p) => p.id));
  const { data: selecionadasObj = [] } = usePersonasPorIds(selecionadas);
  const { data: personaCompleta } = usePersona(visualizando?.id);
  const isLoading = consulta.isLoading;

  useEffect(() => setPagina(1), [buscaAdiada, exercicio, vertente, complexidade, status, cidade, tipoCliente]);

  function alternarSelecao(id: string) {
    setSelecionadas((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function imprimirSelecionadas() {
    if (selecionadas.length === 0) {
      toast.error("Selecione ao menos uma persona.");
      return;
    }
    navigate({
      to: "/personagens/imprimir",
      search: { ids: selecionadas.join(","), nome: "Impressão em lote" },
    });
  }

  return (
    <AppShell
      titulo="Biblioteca de Personas"
      descricao={`${personas.length} de ${total} personas`}
      acoes={
        <>
          <Button variant="outline" onClick={imprimirSelecionadas}>
            <Printer className="size-4" /> Imprimir ({selecionadas.length})
          </Button>
          {podeGerenciarPersonagens && (
            <Button asChild>
              <Link to="/personagens/personas/$id" params={{ id: "nova" }}>
                Nova persona
              </Link>
            </Button>
          )}
        </>
      }
    >
      <div className="surface-card mb-6 p-5">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Pesquisar por nome, palavra-chave, objetivo, contexto…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Selecao
              valor={exercicio}
              onChange={setExercicio}
              opcoes={EXERCICIOS}
              placeholder="Exercício"
            />
            <Selecao
              valor={vertente}
              onChange={setVertente}
              opcoes={VERTENTES}
              placeholder="Vertente"
            />
            <Selecao
              valor={complexidade}
              onChange={setComplexidade}
              opcoes={COMPLEXIDADES}
              placeholder="Complexidade"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Status: ativas</SelectItem>
                <SelectItem value="arquivada">Status: arquivadas</SelectItem>
                <SelectItem value={TODOS}>Status: todas</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="w-full sm:w-40"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <Input
              className="w-full sm:w-44"
              placeholder="Tipo de cliente"
              value={tipoCliente}
              onChange={(e) => setTipoCliente(e.target.value)}
            />
            <div className="ml-auto flex gap-1 rounded-xl border border-border p-1">
              <Button
                size="sm"
                variant={visual === "cards" ? "default" : "ghost"}
                onClick={() => setVisual("cards")}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                size="sm"
                variant={visual === "tabela" ? "default" : "ghost"}
                onClick={() => setVisual("tabela")}
              >
                <TableIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando personas…</p>
      ) : personas.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <p className="font-medium">Nenhuma persona encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {podeGerenciarPersonagens
              ? "Ajuste os filtros ou cadastre uma nova persona."
              : "Ajuste os filtros para encontrar os personagens liberados para você."}
          </p>
          {podeGerenciarPersonagens && (
            <Button asChild className="mt-5">
              <Link to="/personagens/personas/$id" params={{ id: "nova" }}>
                Criar persona
              </Link>
            </Button>
          )}
        </div>
      ) : visual === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((p) => (
            <article
              key={p.id}
              className={cn(
                "surface-card flex flex-col p-5 transition-shadow hover:shadow-raised",
                selecionadas.includes(p.id) && "ring-2 ring-brand",
              )}
            >
              <div className="mb-3 flex items-start gap-3">
                <Checkbox
                  checked={selecionadas.includes(p.id)}
                  onCheckedChange={() => alternarSelecao(p.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{p.nome}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.cidade, p.tipo_cliente].filter(Boolean).join(" • ") ||
                      "Sem cidade definida"}
                  </p>
                </div>
                <button
                  onClick={() => alternarFavorita.mutate(p)}
                  aria-label="Favoritar"
                  className="text-muted-foreground transition-colors hover:text-highlight"
                >
                  <Star className={cn("size-4", p.favorita && "fill-highlight text-highlight")} />
                </button>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{p.exercicio}</Badge>
                <Badge variant="outline">{p.vertente}</Badge>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    COMPLEXIDADE_TOM[p.complexidade ?? ""] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {p.complexidade}
                </span>
                {p.status === "arquivada" && <Badge variant="outline">Arquivada</Badge>}
              </div>

              <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                {p.objetivo || "Sem objetivo definido."}
              </p>

              <p className="mb-4 text-xs text-muted-foreground">
                Criada em {formatarData(p.created_at)} • Alterada em {formatarData(p.updated_at)}
              </p>

              <div className="mt-auto flex flex-wrap gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setVisualizando(p)}>
                  <Eye className="size-4" /> Ver
                </Button>
                <AcoesPdfPersona nome={p.nome} pdf={pdfs[p.id]} compacto />
                {podeGerenciarPersonagens && (
                  <>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/personagens/personas/$id" params={{ id: p.id }}>
                        <Pencil className="size-4" /> Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        duplicar.mutate(p, { onSuccess: () => toast.success("Persona duplicada.") })
                      }
                    >
                      <Copy className="size-4" /> Duplicar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => alternarStatus.mutate(p)}>
                      {p.status === "ativa" ? (
                        <>
                          <Archive className="size-4" /> Arquivar
                        </>
                      ) : (
                        <>
                          <ArchiveRestore className="size-4" /> Reativar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setAExcluir(p)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3"></th>
                <th className="p-3">Nome</th>
                <th className="p-3">Exercício</th>
                <th className="p-3">Vertente</th>
                <th className="p-3">Complexidade</th>
                <th className="p-3">Status</th>
                <th className="p-3">Criada</th>
                <th className="p-3">Última alteração</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/70 last:border-0 hover:bg-muted/40"
                >
                  <td className="p-3">
                    <Checkbox
                      checked={selecionadas.includes(p.id)}
                      onCheckedChange={() => alternarSelecao(p.id)}
                    />
                  </td>
                  <td className="p-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      {p.favorita && <Star className="size-3.5 fill-highlight text-highlight" />}
                      {p.nome}
                    </span>
                  </td>
                  <td className="p-3">{p.exercicio}</td>
                  <td className="p-3">{p.vertente}</td>
                  <td className="p-3">{p.complexidade}</td>
                  <td className="p-3 capitalize">{p.status}</td>
                  <td className="p-3 text-muted-foreground">{formatarData(p.created_at)}</td>
                  <td className="p-3 text-muted-foreground">{formatarData(p.updated_at)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setVisualizando(p)}>
                        <Eye className="size-4" />
                      </Button>
                      <AcoesPdfPersona nome={p.nome} pdf={pdfs[p.id]} compacto />
                      {podeGerenciarPersonagens && (
                        <>
                          <Button size="icon" variant="ghost" asChild>
                            <Link to="/personagens/personas/$id" params={{ id: p.id }}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => duplicar.mutate(p)}>
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => alternarStatus.mutate(p)}
                          >
                            <Archive className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setAExcluir(p)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 24 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página {pagina} de {paginas}</span>
          <Button variant="outline" disabled={pagina >= paginas} onClick={() => setPagina((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      )}

      {selecionadasObj.length > 0 && (
        <div className="no-print mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
          <span className="text-sm">
            <strong>{selecionadasObj.length}</strong> persona(s) selecionada(s) para impressão.
          </span>
          <Button size="sm" onClick={imprimirSelecionadas}>
            <Printer className="size-4" /> Gerar PDF / imprimir
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelecionadas([])}>
            Limpar seleção
          </Button>
        </div>
      )}

      <Dialog open={!!visualizando} onOpenChange={(o) => !o && setVisualizando(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{visualizando?.nome}</DialogTitle>
          </DialogHeader>
          {personaCompleta ? (
            <PersonaPrint persona={personaCompleta} indice={1} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando detalhes…</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aExcluir} onOpenChange={(o) => !o && setAExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{aExcluir?.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Considere arquivar a persona para mantê-la disponível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (aExcluir)
                  excluir.mutate(aExcluir, { onSuccess: () => toast.success("Persona excluída.") });
                setAExcluir(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
