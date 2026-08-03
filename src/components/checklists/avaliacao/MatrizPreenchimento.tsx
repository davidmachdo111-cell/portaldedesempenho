import { MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { type Avaliacao, chave, corFaixa, faixa, notaExercicio } from "@/lib/checklists/avaliacao";

/** Matriz somente de preenchimento: o avaliador marca critérios, sem editar a estrutura. */
export function MatrizPreenchimento({
  avaliacao,
  onToggle,
  onAbrirObservacoes,
  bloqueado,
}: {
  avaliacao: Avaliacao;
  onToggle: (exId: string, critId: string) => void;
  onAbrirObservacoes: (exId: string) => void;
  bloqueado?: boolean;
}) {
  const { criterios, exercicios } = avaliacao;

  return (
    <section className="surface overflow-hidden">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">Matriz de avaliação</h2>
        <p className="text-xs text-muted-foreground">
          Marque os critérios atendidos pelo colaborador em cada exercício.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-[42%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Critério
              </th>
              <th className="w-16 px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Peso
              </th>
              {exercicios.map((ex) => (
                <th key={ex.id} className="px-2 py-3 align-bottom">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-heading">{ex.nome}</span>
                    <button
                      type="button"
                      onClick={() => onAbrirObservacoes(ex.id)}
                      title="Observações do exercício"
                      className="no-print rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-heading"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criterios.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
              >
                <td className="px-5 py-2.5 text-sm font-medium text-heading">{c.nome}</td>
                <td className="px-2 py-2.5">
                  <span className="inline-flex h-7 w-8 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-brand-support">
                    {c.peso}
                  </span>
                </td>
                {exercicios.map((ex) => (
                  <td key={ex.id} className="px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        disabled={bloqueado}
                        checked={!!avaliacao.marcados[chave(ex.id, c.id)]}
                        onCheckedChange={() => onToggle(ex.id, c.id)}
                        className="h-5 w-5 rounded-[6px] border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {!criterios.length && (
              <tr>
                <td colSpan={2 + exercicios.length} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Este checklist ainda não possui critérios.
                </td>
              </tr>
            )}
            <tr className="bg-secondary/60">
              <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-dark">
                Nota do exercício
              </td>
              <td />
              {exercicios.map((ex) => {
                const nota = notaExercicio(avaliacao, ex.id);
                return (
                  <td key={ex.id} className="px-2 py-3 text-center">
                    <span
                      className="inline-flex min-w-14 justify-center rounded-full px-2.5 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: corFaixa[faixa(nota)] }}
                    >
                      {nota.toFixed(0)}%
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
