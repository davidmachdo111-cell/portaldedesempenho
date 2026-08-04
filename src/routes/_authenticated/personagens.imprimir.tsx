import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaPrint } from "@/components/personas/PersonaPrint";
import { usePersonas } from "@/lib/personas/api";
import { formatarData } from "@/lib/personas/constants";
import { useAuth } from "@/hooks/useAuth";

type Busca = {
  ids: string;
  nome?: string | undefined;
  exercicio?: string | undefined;
  responsavel?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/personagens/imprimir")({
  validateSearch: (search: Record<string, unknown>): Busca => ({
    ids: String(search["ids"] ?? ""),
    nome: search["nome"] ? String(search["nome"]) : undefined,
    exercicio: search["exercicio"] ? String(search["exercicio"]) : undefined,
    responsavel: search["responsavel"] ? String(search["responsavel"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Impressão de simulação | Portal de Desempenho" },
      {
        name: "description",
        content: "Documento em A4 com capa e uma persona por página, pronto para impressão ou PDF.",
      },
      { property: "og:title", content: "Impressão de simulação" },
      { property: "og:description", content: "Material de apoio das personas em formato A4." },
    ],
  }),
  component: Imprimir,
});

function Imprimir() {
  const { ids, nome, exercicio, responsavel } = Route.useSearch();
  const { data: personas = [], isLoading } = usePersonas();
  const { nome: usuario } = useAuth();

  const lista = ids
    .split(",")
    .filter(Boolean)
    .map((id: string) => personas.find((p) => p.id === id))
    .filter(Boolean) as typeof personas;

  useEffect(() => {
    if (!isLoading && lista.length > 0) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
    return;
  }, [isLoading, lista.length]);

  return (
    <div className="min-h-screen bg-muted/50 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <p className="text-sm text-muted-foreground">
          {lista.length} persona(s) • uma por página, formato A4
        </p>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhuma persona selecionada.</p>
      ) : (
        <>
          {/* Capa */}
          <section className="print-page mx-auto mb-8 flex min-h-[240mm] w-full max-w-[210mm] flex-col justify-between bg-white p-12 shadow-soft print:mb-0 print:min-h-[247mm] print:p-0 print:shadow-none">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
                Portal de Desempenho
              </p>
              <div className="mt-2 h-1 w-24 rounded-full bg-highlight" />
            </div>
            <div>
              <h1 className="text-5xl font-bold leading-tight text-brand-dark">
                {nome || "Simulação"}
              </h1>
              <dl className="mt-10 grid max-w-md grid-cols-2 gap-y-4 text-sm">
                <dt className="font-semibold text-muted-foreground">Exercício</dt>
                <dd>{exercicio || lista[0]?.exercicio || "—"}</dd>
                <dt className="font-semibold text-muted-foreground">Quantidade de personas</dt>
                <dd>{lista.length}</dd>
                <dt className="font-semibold text-muted-foreground">Data</dt>
                <dd>{formatarData(new Date().toISOString())}</dd>
                <dt className="font-semibold text-muted-foreground">Responsável</dt>
                <dd>{responsavel || usuario || "—"}</dd>
              </dl>
            </div>
            <p className="text-xs text-muted-foreground">
              Documento de uso interno — material de apoio para o auxiliar da simulação.
            </p>
          </section>

          {lista.map((p, i) => (
            <PersonaPrint key={p.id} persona={p} indice={i + 1} />
          ))}
        </>
      )}
    </div>
  );
}
