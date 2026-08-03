import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Avaliacao,
  type Peso,
  chave,
  corFaixa,
  faixa,
  notaExercicio,
} from "@/lib/checklists/avaliacao";

interface Props {
  avaliacao: Avaliacao;
  onToggle: (exId: string, critId: string) => void;
  onRenomearCriterio: (id: string, nome: string) => void;
  onPeso: (id: string, peso: Peso) => void;
  onRemoverCriterio: (id: string) => void;
  onAddCriterio: () => void;
  onRenomearExercicio: (id: string, nome: string) => void;
  onRemoverExercicio: (id: string) => void;
  onAddExercicio: () => void;
  onAbrirPainel: (exId: string, critId?: string) => void;
}

export function MatrizAvaliacao({
  avaliacao,
  onToggle,
  onRenomearCriterio,
  onPeso,
  onRemoverCriterio,
  onAddCriterio,
  onRenomearExercicio,
  onRemoverExercicio,
  onAddExercicio,
  onAbrirPainel,
}: Props) {
  const { criterios, exercicios } = avaliacao;

  return (
    <section className="surface overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Matriz de avaliação</h2>
          <p className="text-xs text-muted-foreground">
            Marque os critérios atendidos em cada exercício.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="outline" size="sm" onClick={onAddCriterio}>
            <Plus className="h-4 w-4" /> Critério
          </Button>
          <Button size="sm" onClick={onAddExercicio}>
            <Plus className="h-4 w-4" /> Exercício
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-[38%] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Critério
              </th>
              <th className="w-24 px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Peso
              </th>
              {exercicios.map((ex) => (
                <th key={ex.id} className="px-2 py-3 align-bottom">
                  <div className="flex flex-col items-center gap-1">
                    <input
                      value={ex.nome}
                      onChange={(e) => onRenomearExercicio(ex.id, e.target.value)}
                      className="ghost-input w-28 px-1.5 py-1 text-center text-xs font-semibold text-heading"
                    />
                    <button
                      onClick={() => onRemoverExercicio(ex.id)}
                      title="Remover exercício"
                      className="no-print rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-heading focus:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
                className="group border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
              >
                <td className="px-5 py-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <input
                      value={c.nome}
                      onChange={(e) => onRenomearCriterio(c.id, e.target.value)}
                      className="ghost-input w-full px-2 py-1.5 text-sm font-medium text-heading"
                    />
                    <button
                      onClick={() => onRemoverCriterio(c.id)}
                      title="Remover critério"
                      className="no-print shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-heading group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <Select
                    value={String(c.peso)}
                    onValueChange={(v) => onPeso(c.id, Number(v) as Peso)}
                  >
                    <SelectTrigger className="h-8 w-16 border-border/70 bg-secondary text-xs font-semibold text-brand-support">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <SelectItem key={p} value={String(p)}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                {exercicios.map((ex) => (
                  <td key={ex.id} className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={!!avaliacao.marcados[chave(ex.id, c.id)]}
                        onCheckedChange={() => {
                          onToggle(ex.id, c.id);
                          onAbrirPainel(ex.id, c.id);
                        }}
                        className="h-5 w-5 rounded-[6px] border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
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
