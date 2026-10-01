import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { PersonaPrint } from "@/components/personas/PersonaPrint";
import { useSimuladoParaDownload } from "@/lib/meus-conteudos/api";
import { rotuloMomento } from "@/lib/personas/anexos";
import { formatarData } from "@/lib/personas/constants";

export function ImpressaoExercicio({
  exercicioId,
  onFinalizar,
}: {
  exercicioId: string;
  onFinalizar: () => void;
}) {
  const { data, isLoading, isError } = useSimuladoParaDownload(exercicioId);
  const iniciou = useRef(false);

  useEffect(() => {
    if (isLoading || iniciou.current) return;
    if (isError || !data) {
      iniciou.current = true;
      toast.error("Não foi possível preparar a impressão do exercício.");
      onFinalizar();
      return;
    }

    iniciou.current = true;
    document.body.classList.add("imprimindo-exercicio");

    const finalizar = () => {
      document.body.classList.remove("imprimindo-exercicio");
      onFinalizar();
    };
    window.addEventListener("afterprint", finalizar, { once: true });

    const quadro = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });

    return () => {
      window.cancelAnimationFrame(quadro);
      window.removeEventListener("afterprint", finalizar);
      document.body.classList.remove("imprimindo-exercicio");
    };
  }, [data, isError, isLoading, onFinalizar]);

  if (!data) return null;

  const { simulado, personas, anexos } = data;

  return (
    <div className="impressao-exercicio" aria-hidden="true">
      <section className="print-page mx-auto mb-8 flex min-h-[240mm] w-full max-w-[210mm] flex-col justify-between bg-card p-12 print:mb-0 print:min-h-[247mm] print:p-0">
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
                {anexos.map((anexo) => (
                  <li key={anexo.id}>
                    <span className="font-medium">{anexo.nome}</span> —{" "}
                    {rotuloMomento(anexo.momento)}
                    {anexo.descricao ? ` • ${anexo.descricao}` : ""}
                    {anexo.orientacoes ? ` • ${anexo.orientacoes}` : ""}
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

      {personas.map((persona, indice) => (
        <PersonaPrint key={persona.id} persona={persona} indice={indice + 1} />
      ))}
    </div>
  );
}