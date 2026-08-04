import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function SecaoFormulario({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-6">
      <header className="mb-5">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </header>
      {children}
    </section>
  );
}

export function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Lista dinâmica de textos simples (falas gatilho, escalada). */
export function ListaTextos({
  itens,
  onChange,
  placeholder,
  rotuloAdicionar,
}: {
  itens: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  rotuloAdicionar: string;
}) {
  return (
    <div className="space-y-3">
      {itens.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <Textarea
            value={item}
            placeholder={placeholder}
            rows={2}
            onChange={(e) => {
              const copia = [...itens];
              copia[i] = e.target.value;
              onChange(copia);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-1 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(itens.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...itens, ""])}>
        <Plus className="size-4" /> {rotuloAdicionar}
      </Button>
    </div>
  );
}

/** Lista dinâmica de pares (pergunta/resposta ou campo/valor). */
export function ListaPares({
  itens,
  onChange,
  labelA,
  labelB,
  rotuloAdicionar,
  sugestoes,
  multilinha,
}: {
  itens: { a: string; b: string }[];
  onChange: (v: { a: string; b: string }[]) => void;
  labelA: string;
  labelB: string;
  rotuloAdicionar: string;
  sugestoes?: string[];
  multilinha?: boolean;
}) {
  const set = (i: number, patch: Partial<{ a: string; b: string }>) => {
    const copia = itens.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange(copia);
  };

  return (
    <div className="space-y-4">
      {itens.map((item, i) => (
        <div key={i} className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label={labelA}>
              <Input
                value={item.a}
                list={sugestoes ? "sugestoes-campos" : undefined}
                onChange={(e) => set(i, { a: e.target.value })}
              />
            </Campo>
            <Campo label={labelB}>
              {multilinha ? (
                <Textarea rows={2} value={item.b} onChange={(e) => set(i, { b: e.target.value })} />
              ) : (
                <Input value={item.b} onChange={(e) => set(i, { b: e.target.value })} />
              )}
            </Campo>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange(itens.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="size-4" /> Remover
            </Button>
          </div>
        </div>
      ))}
      {sugestoes && (
        <datalist id="sugestoes-campos">
          {sugestoes.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...itens, { a: "", b: "" }])}
      >
        <Plus className="size-4" /> {rotuloAdicionar}
      </Button>
    </div>
  );
}
