import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PersonaPrint } from "@/components/personas/PersonaPrint";
import { usePersonaParaDownload } from "@/lib/meus-conteudos/api";
import { rotuloMomento } from "@/lib/personas/anexos";

export const Route = createFileRoute("/_authenticated/meus-conteudos/persona/$id")({
  head: () => ({
    meta: [
      { title: "PDF do personagem liberado — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Documento A4 do personagem liberado para você, com roteiro completo e a lista de anexos com orientações de uso.",
      },
      { property: "og:title", content: "PDF do personagem liberado" },
      {
        property: "og:description",
        content: "Ficha A4 do personagem atribuído ao seu usuário.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PersonaDownload;
});

function PersonaDownload() {
  const { id } = Route.useParams();
  const { data, isLoading } = usePersonaParaDownload(id);

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
        Personagem não encontrado ou não liberado para o seu usuário.
      </p>
    );
  }

  const { persona, anexos } = data;

  return (
    <div className="min-h-screen bg-muted/50 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <p className="text-sm text-muted-foreground">{persona.nome} • formato A4</p>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <PersonaPrint persona={persona} indice={1} />

      {anexos.length > 0 && (
        <section className="print-page mx-auto w-full max-w-[210mm] bg-white p-12 shadow-soft print:p-0 print:shadow-none">
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
        </section>
      )}
    </div>
  );
}
