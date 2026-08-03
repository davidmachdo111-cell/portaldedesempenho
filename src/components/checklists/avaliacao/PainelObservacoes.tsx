import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Observacao } from "@/lib/checklists/avaliacao";

const campos: { key: keyof Observacao; label: string; ph: string }[] = [
  { key: "positivos", label: "Pontos positivos", ph: "O que o colaborador fez bem neste exercício..." },
  { key: "melhorias", label: "Oportunidades de melhoria", ph: "O que pode evoluir..." },
  { key: "feedback", label: "Feedback para o colaborador", ph: "Mensagem direta ao colaborador..." },
];

export function PainelObservacoes({
  open,
  onOpenChange,
  titulo,
  subtitulo,
  valor,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titulo: string;
  subtitulo?: string | undefined;
  valor: Observacao;
  onChange: (patch: Partial<Observacao>) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-heading">{titulo}</SheetTitle>
          <SheetDescription>
            {subtitulo ?? "Observações vinculadas a este exercício."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          {campos.map((c) => (
            <label key={c.key} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </span>
              <Textarea
                rows={4}
                placeholder={c.ph}
                value={valor[c.key]}
                onChange={(e) => onChange({ [c.key]: e.target.value })}
                className="resize-none rounded-lg border-border bg-card text-sm focus-visible:ring-primary/25"
              />
            </label>
          ))}
          <p className="text-xs text-muted-foreground">
            As observações são salvas automaticamente e incluídas no relatório final.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
