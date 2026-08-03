import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, ClipboardList, FolderTree, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/checklists/ChecklistsShell";
import { listarChecklists, listarCategorias } from "@/lib/checklists/checklists";
import { listarTodasAvaliacoes } from "@/lib/checklists/avaliacoes";
import { listarAvaliadores } from "@/lib/checklists/avaliadores";
import { classificacao } from "@/lib/checklists/avaliacao";
import { formatarData } from "@/lib/checklists/checklists";

export const Route = createFileRoute("/_authenticated/checklists/")({
  component: Painel,
});

function Painel() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !isAdmin) router.navigate({ to: "/checklists/avaliacoes", replace: true });
  }, [loading, isAdmin, router]);
  const checklists = useQuery({ queryKey: ["checklists"], queryFn: listarChecklists });
  const avaliadores = useQuery({
    queryKey: ["avaliadores"],
    queryFn: listarAvaliadores,
  });
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });
  const avaliacoes = useQuery({ queryKey: ["avaliacoes-todas"], queryFn: listarTodasAvaliacoes });

  const lista = avaliacoes.data ?? [];
  const concluidas = lista.filter((a) => a.status === "concluida");
  const media = concluidas.length
    ? concluidas.reduce((s, a) => s + Number(a.media), 0) / concluidas.length
    : 0;

  const cards = [
    {
      label: "Checklists criados",
      valor: checklists.data?.length ?? 0,
      icon: ClipboardList,
      to: "/checklists/modelos" as const,
    },
    {
      label: "Avaliadores",
      valor: avaliadores.data?.length ?? 0,
      icon: Users,
      to: "/admin" as const,
    },
    {
      label: "Avaliações realizadas",
      valor: concluidas.length,
      icon: ClipboardCheck,
      to: "/checklists/liberacoes" as const,
    },
    {
      label: "Categorias",
      valor: categorias.data?.length ?? 0,
      icon: FolderTree,
      to: "/checklists/modelos" as const,
    },
  ];

  return (
    <AdminShell
      titulo="Home"
      descricao="Visão geral da plataforma de checklists"
      acoes={
        <Button asChild size="sm">
          <Link to="/checklists/modelos">
            <Plus className="h-4 w-4" /> Gerenciar checklists
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="surface p-5 transition hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </span>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-heading">{c.valor}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="surface overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Checklists recentes</h2>
          </header>
          <ul className="divide-y divide-border">
            {(checklists.data ?? []).slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  to="/checklists/modelos/$id"
                  params={{ id: c.id }}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-heading">{c.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.categoria?.nome ?? "Sem categoria"} · {c.totalCriterios} critérios
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      c.ativo ? "bg-accent text-brand-dark" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </Link>
              </li>
            ))}
            {!checklists.isLoading && !(checklists.data ?? []).length && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhum checklist criado ainda.
              </li>
            )}
          </ul>
        </section>

        <section className="surface overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Avaliações recentes</h2>
            {!!concluidas.length && (
              <span className="text-xs text-muted-foreground">
                Média geral: <b className="text-heading">{media.toFixed(1)}%</b>
              </span>
            )}
          </header>
          <ul className="divide-y divide-border">
            {lista.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-heading">
                    {a.colaborador_nome || "Sem colaborador informado"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.setor || "—"} · {formatarData(a.data_avaliacao)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-heading">
                  {a.status === "concluida"
                    ? `${Number(a.media).toFixed(0)}% · ${classificacao(Number(a.media))}`
                    : "Rascunho"}
                </span>
              </li>
            ))}
            {!avaliacoes.isLoading && !lista.length && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhuma avaliação registrada ainda.
              </li>
            )}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
