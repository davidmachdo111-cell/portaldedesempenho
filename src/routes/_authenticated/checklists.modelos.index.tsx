import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/checklists/ChecklistsShell";
import {
  criarCategoria,
  criarChecklist,
  duplicarChecklist,
  excluirCategoria,
  excluirChecklist,
  formatarData,
  listarCategorias,
  listarChecklists,
} from "@/lib/checklists/checklists";

export const Route = createFileRoute("/_authenticated/checklists/modelos/")({
  component: ListaChecklists,
});

function ListaChecklists() {
  const router = useRouter();
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string>("todas");
  const [novaCategoria, setNovaCategoria] = useState("");

  const checklists = useQuery({ queryKey: ["checklists"], queryFn: listarChecklists });
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["checklists"] });
    qc.invalidateQueries({ queryKey: ["categorias"] });
  };

  const criar = useMutation({
    mutationFn: () => criarChecklist(),
    onSuccess: (c) => {
      invalidar();
      router.navigate({ to: "/checklists/modelos/$id", params: { id: c.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicar = useMutation({
    mutationFn: duplicarChecklist,
    onSuccess: () => {
      invalidar();
      toast.success("Checklist duplicado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: excluirChecklist,
    onSuccess: () => {
      invalidar();
      toast.success("Checklist excluído.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addCategoria = useMutation({
    mutationFn: (nome: string) => criarCategoria(nome),
    onSuccess: () => {
      setNovaCategoria("");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removerCategoria = useMutation({
    mutationFn: excluirCategoria,
    onSuccess: invalidar,
    onError: (e: Error) => toast.error(e.message),
  });

  const lista = (checklists.data ?? []).filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.trim().toLowerCase()) &&
      (filtro === "todas" || c.categoria_id === filtro),
  );

  return (
    <AdminShell
      titulo="Checklists"
      descricao="Modelos mestres de avaliação de conhecimento"
      acoes={
        <Button size="sm" onClick={() => criar.mutate()} disabled={criar.isPending}>
          <Plus className="h-4 w-4" /> Novo checklist
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar checklist..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[{ id: "todas", nome: "Todas" }, ...(categorias.data ?? [])].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFiltro(c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    filtro === c.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-brand-support hover:bg-accent"
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {lista.map((c) => (
              <div key={c.id} className="surface flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/checklists/modelos/$id"
                    params={{ id: c.id }}
                    className="min-w-0 text-sm font-semibold text-heading hover:underline"
                  >
                    {c.nome}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.ativo ? "bg-accent text-brand-dark" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {c.descricao || "Sem descrição"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {c.categoria?.nome ?? "Sem categoria"} · {c.totalCriterios} critérios ·{" "}
                  {formatarData(c.created_at)}
                </p>
                <div className="mt-auto flex gap-1.5 pt-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/checklists/modelos/$id" params={{ id: c.id }}>
                      Editar
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicar.mutate(c.id)}
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Excluir "${c.nome}"?`)) excluir.mutate(c.id);
                    }}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!checklists.isLoading && !lista.length && (
              <p className="surface p-8 text-center text-sm text-muted-foreground sm:col-span-2">
                Nenhum checklist encontrado.
              </p>
            )}
          </div>
        </div>

        <aside className="surface h-fit p-5">
          <h2 className="text-sm font-semibold">Categorias</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Organize os modelos por área de conhecimento.
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const nome = novaCategoria.trim();
              if (nome) addCategoria.mutate(nome);
            }}
          >
            <Input
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Nova categoria"
              maxLength={60}
            />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          <ul className="mt-4 space-y-1">
            {(categorias.data ?? []).map((c) => (
              <li
                key={c.id}
                className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-accent/50"
              >
                <span className="truncate text-brand-support">{c.nome}</span>
                <button
                  onClick={() => removerCategoria.mutate(c.id)}
                  className="opacity-0 transition group-hover:opacity-100"
                  title="Remover categoria"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AdminShell>
  );
}
