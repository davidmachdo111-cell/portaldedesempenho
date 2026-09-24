import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ClipboardCheck, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/checklists/ChecklistsShell";
import {
  criarAvaliacao,
  excluirAvaliacao,
  listarChecklistsLiberados,
  listarMinhasAvaliacoesPaginadas,
} from "@/lib/checklists/avaliacoes";
import { formatarData } from "@/lib/checklists/checklists";

export const Route = createFileRoute("/_authenticated/checklists/avaliacoes/")({
  head: () => ({
    meta: [
      { title: "Minhas avaliações | Checklists de Conhecimento" },
      {
        name: "description",
        content: "Checklists liberados para o avaliador e avaliações em andamento ou concluídas.",
      },
      { property: "og:title", content: "Minhas avaliações" },
      {
        property: "og:description",
        content: "Área do avaliador para aplicar checklists de conhecimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaMinhasAvaliacoes,
});

function PaginaMinhasAvaliacoes() {
  const qc = useQueryClient();
  const router = useRouter();
  const [pagina, setPagina] = useState(1);

  const liberados = useQuery({
    queryKey: ["checklists-liberados"],
    queryFn: listarChecklistsLiberados,
  });
  const avaliacoes = useQuery({
    queryKey: ["minhas-avaliacoes", pagina],
    queryFn: () => listarMinhasAvaliacoesPaginadas(pagina),
  });

  const iniciar = useMutation({
    mutationFn: criarAvaliacao,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["minhas-avaliacoes"] });
      router.navigate({ to: "/checklists/avaliacoes/$id", params: { id: r.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: excluirAvaliacao,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["minhas-avaliacoes"] });
      toast.success("Avaliação excluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nomeChecklist = (id: string) =>
    (liberados.data ?? []).find((c) => c.id === id)?.nome ?? "Checklist";
  const registros = avaliacoes.data?.itens ?? [];

  return (
    <AdminShell
      titulo="Minhas avaliações"
      descricao="Checklists liberados para você e registros de acompanhamento"
    >
      <div className="space-y-6">
        <section className="surface overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Checklists liberados</h2>
          </header>
          <ul className="divide-y divide-border">
            {(liberados.data ?? []).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-brand-support">
                  <ClipboardCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-heading">{c.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.descricao || "Sem descrição"} · nota mínima {c.nota_minima}%
                  </p>
                </div>
                <Button size="sm" onClick={() => iniciar.mutate(c.id)} disabled={iniciar.isPending}>
                  <Play className="h-4 w-4" /> Iniciar avaliação
                </Button>
              </li>
            ))}
            {!liberados.isLoading && !(liberados.data ?? []).length && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhum checklist liberado para você ainda.
              </li>
            )}
          </ul>
        </section>

        <section className="surface overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">
               Avaliações registradas ({avaliacoes.data?.total ?? 0})
            </h2>
          </header>
          <ul className="divide-y divide-border">
            {registros.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-heading">
                    {a.colaborador_nome || "Colaborador não informado"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {nomeChecklist(a.checklist_id)} · {formatarData(a.data_avaliacao)} ·{" "}
                    {a.status === "concluida" ? "Concluída" : "Rascunho"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-heading">
                  {a.media.toFixed(1)}%
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link to="/checklists/avaliacoes/$id" params={{ id: a.id }}>
                    Abrir
                  </Link>
                </Button>
                <button
                  title="Excluir"
                  className="text-muted-foreground hover:text-heading"
                  onClick={() => {
                    if (confirm("Excluir esta avaliação?")) remover.mutate(a.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {!avaliacoes.isLoading && !registros.length && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Você ainda não iniciou nenhuma avaliação.
              </li>
            )}
          </ul>
          {(avaliacoes.data?.total ?? 0) > 20 && (
            <div className="flex items-center justify-center gap-3 border-t p-3">
              <Button variant="outline" size="sm" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</Button>
              <span className="text-xs text-muted-foreground">Página {pagina}</span>
              <Button variant="outline" size="sm" disabled={pagina * 20 >= (avaliacoes.data?.total ?? 0)} onClick={() => setPagina((p) => p + 1)}>Próxima</Button>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
