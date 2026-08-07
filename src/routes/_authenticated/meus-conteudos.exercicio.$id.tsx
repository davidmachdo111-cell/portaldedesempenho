import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PersonaPrint } from "@/components/personas/PersonaPrint";
import { formatarData } from "@/lib/personas/constants";
import { useSimuladoParaDownload } from "@/lib/meus-conteudos/api";
import { rotuloMomento } from "@/lib/personas/anexos";

export const Route = createFileRoute("/_authenticated/meus-conteudos/exercicio/$id")({
  head: () => ({
    meta: [
      { title: "Exercício liberado para download — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Documento A4 do exercício liberado para você, com capa, personagens e a lista de anexos com orientações de uso.",
      },
      { property: "og:title", content: "Exercício liberado para download" },
      {
        property: "og:description",
        content: "Material A4 do exercício atribuído ao seu usuário.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SimuladoDownload,
});

function SimuladoDownload() {
  const { id } = Route.useParams();
  const { data, isLoading } = useSimuladoParaDownload(id);

  useEffect(() => {
    if (!isLoading && data) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
    return;
  }, [isLoading, data]);

  if (isLoading) {
    return <p className="p-10 text-center text-muted-foreground">Carregando…</p>;
  }
  if (!data) {
    return (
      <p className="p-10 text-center text-muted-foreground">
        Exercício não encontrado ou não liberado para o seu usuário.
      </p>
    );
  }

  const { simulado, personas, anexos } = data;

  return (
    <div className="min-h-screen bg-muted/50 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <p className="text-sm text-muted-foreground">
          {personas.length} personagem(ns) • formato A4
        </p>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <section className="print-page mx-auto mb-8 flex min-h-[240mm] w-full max-w-[210mm] flex-col justify-between bg-white p-12 shadow-soft print:mb-0 print:min-h-[247mm] print:p-0 print:shadow-none">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            Portal de Desempenho
          </p>
          <div className="mt-2 h-1 w-24 rounded-full bg-highlight" />
        </div>
        <div>
          <h1 className="text-5xl font-bold leading-tight text-brand-dark">{simulado.nome}</h1>
          <dl className="mt-10 grid max-w-md grid-cols-2 gap-y-4 text-sm">
            <dt className="font-semibold text-muted-foreground">Exercício</dt>
            <dd>{simulado.exercicio || "—"}</dd>
            <dt className="font-semibold text-muted-foreground">Personagens</dt>
            <dd>{personas.length}</dd>
            <dt className="font-semibold text-muted-foreground">Data</dt>
            <dd>{formatarData(new Date().toISOString())}</dd>
            <dt className="font-semibold text-muted-foreground">Responsável</dt>
            <dd>{simulado.responsavel || "—"}</dd>
          </dl>
          {anexos.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Anexos e orientações de uso
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {anexos.map((a) => (
                  <li key={a.id}>
                    <span className="font-medium">{a.nome}</span> — {rotuloMomento(a.momento)}
                    {a.descricao ? ` • ${a.descricao}` : ""}
                    {a.orientacoes ? ` • ${a.orientacoes}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Documento de uso interno — material de apoio do exercício.
        </p>
      </section>

      {personas.map((p, i) => (
        <PersonaPrint key={p.id} persona={p} indice={i + 1} />
      ))}
    </div>
  );
}
