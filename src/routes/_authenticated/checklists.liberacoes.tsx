import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminShell } from "@/components/checklists/ChecklistsShell";
import { useAuth } from "@/hooks/useAuth";
import { listarChecklists } from "@/lib/checklists/checklists";
import { listarAvaliadores } from "@/lib/checklists/avaliadores";
import { liberarChecklist, listarAtribuicoes, revogarChecklist } from "@/lib/checklists/avaliacoes";

export const Route = createFileRoute("/_authenticated/checklists/liberacoes")({
  component: PaginaLiberacoes,
});

function PaginaLiberacoes() {
  const qc = useQueryClient();
  const router = useRouter();
  const { podeGerenciarChecklists: isAdmin, loading } = useAuth();
  const [checklistSel, setChecklistSel] = useState<string>("");

  useEffect(() => {
    if (!loading && !isAdmin) router.navigate({ to: "/checklists/avaliacoes", replace: true });
  }, [loading, isAdmin, router]);

  const checklists = useQuery({ queryKey: ["checklists"], queryFn: listarChecklists });
  const avaliadores = useQuery({ queryKey: ["avaliadores"], queryFn: listarAvaliadores });
  const atribuicoes = useQuery({ queryKey: ["atribuicoes"], queryFn: listarAtribuicoes });

  const lista = checklists.data ?? [];
  const atual = checklistSel || lista[0]?.id || "";

  const alternar = useMutation({
    mutationFn: async (v: { avaliadorId: string; ativo: boolean }) =>
      v.ativo ? liberarChecklist(atual, v.avaliadorId) : revogarChecklist(atual, v.avaliadorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atribuicoes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const liberado = (avaliadorId: string) =>
    (atribuicoes.data ?? []).some(
      (a) => a.checklist_id === atual && a.avaliador_id === avaliadorId,
    );

  return (
    <AdminShell
      titulo="Liberações"
      descricao="Defina quais avaliadores podem preencher cada checklist"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="surface h-fit overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Checklists</h2>
          </header>
          <ul className="divide-y divide-border">
            {lista.map((c) => {
              const total = (atribuicoes.data ?? []).filter((a) => a.checklist_id === c.id).length;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setChecklistSel(c.id)}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-accent/40 ${
                      atual === c.id ? "bg-accent/60" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-heading">
                        {c.nome}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.totalCriterios} critérios
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-brand-support">
                      {total}
                    </span>
                  </button>
                </li>
              );
            })}
            {!checklists.isLoading && !lista.length && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Crie um checklist primeiro.
              </li>
            )}
          </ul>
        </section>

        <section className="surface overflow-hidden">
          <header className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Send className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Avaliadores autorizados</h2>
          </header>
          <ul className="divide-y divide-border">
            {(avaliadores.data ?? []).map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <Checkbox
                  disabled={!atual || alternar.isPending}
                  checked={liberado(a.id)}
                  onCheckedChange={(v) => alternar.mutate({ avaliadorId: a.id, ativo: v === true })}
                  className="h-5 w-5 rounded-[6px] border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-heading">{a.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{a.username}
                    {a.ativo ? "" : " · inativo"}
                  </p>
                </div>
              </li>
            ))}
            {!avaliadores.isLoading && !(avaliadores.data ?? []).length && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Cadastre avaliadores para liberar checklists.
              </li>
            )}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
