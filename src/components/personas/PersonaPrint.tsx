import type { Persona } from "@/lib/personas/constants";

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="avoid-break mb-4">
      <h3 className="mb-1.5 border-b border-brand/30 pb-1 text-[11px] font-bold uppercase tracking-widest text-brand-dark">
        {titulo}
      </h3>
      <div className="text-[12.5px] leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

export function PersonaPrint({ persona, indice }: { persona: Persona; indice: number }) {
  const dados = (persona.dados_tecnicos ?? []).filter((d) => d.label || d.valor);
  const ocultas = (persona.informacoes_ocultas ?? []).filter((i) => i.pergunta || i.resposta);
  const gatilhos = (persona.falas_gatilho ?? []).filter(Boolean);
  const escalada = (persona.escalada ?? []).filter(Boolean);

  return (
    <article className="print-page mx-auto mb-8 w-full max-w-[210mm] bg-white p-8 text-foreground shadow-soft print:mb-0 print:p-0 print:shadow-none">
      <header className="avoid-break mb-5 flex items-start justify-between gap-4 rounded-xl border border-brand/25 bg-brand/5 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand">
            Persona {indice}
          </p>
          <h2 className="text-2xl font-bold text-brand-dark">{persona.nome}</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {[persona.idade && `${persona.idade} anos`, persona.sexo, persona.cidade, persona.tipo_cliente]
              .filter(Boolean)
              .join(" • ") || "—"}
          </p>
        </div>
        <div className="space-y-1 text-right text-[11px]">
          <p>
            <strong>Exercício:</strong> {persona.exercicio || "—"}
          </p>
          <p>
            <strong>Vertente:</strong> {persona.vertente || "—"}
          </p>
          <p>
            <strong>Complexidade:</strong> {persona.complexidade || "—"}
          </p>
        </div>
      </header>

      {(persona.titularidade || persona.nome_dependente) && (
        <Bloco titulo="Titularidade">
          {persona.titularidade || "—"}
          {persona.nome_dependente ? ` — Dependente: ${persona.nome_dependente}` : ""}
        </Bloco>
      )}

      {dados.length > 0 && (
        <Bloco titulo="Dados do personagem">
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              {dados.map((d, i) => (
                <tr key={i} className="border-b border-border/70">
                  <td className="w-1/3 py-1 pr-3 font-semibold text-muted-foreground">{d.label}</td>
                  <td className="py-1">{d.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Bloco>
      )}

      {persona.objetivo && <Bloco titulo="Objetivo">{persona.objetivo}</Bloco>}
      {persona.contexto_oculto && (
        <Bloco titulo="Contexto (uso exclusivo do auxiliar)">{persona.contexto_oculto}</Bloco>
      )}

      {persona.perfil_comportamental?.length > 0 && (
        <Bloco titulo="Perfil emocional">
          <div className="flex flex-wrap gap-1.5">
            {persona.perfil_comportamental.map((p) => (
              <span key={p} className="rounded-full border border-brand/30 px-2 py-0.5 text-[11px]">
                {p}
              </span>
            ))}
          </div>
        </Bloco>
      )}

      {persona.fala_inicial && (
        <Bloco titulo="Fala inicial">
          <p className="rounded-lg bg-muted/60 p-3 italic">“{persona.fala_inicial}”</p>
        </Bloco>
      )}

      {ocultas.length > 0 && (
        <Bloco titulo="Informações reveladas apenas se o agente investigar">
          <ul className="space-y-2">
            {ocultas.map((i, idx) => (
              <li key={idx} className="rounded-lg border border-border p-2.5">
                <p className="font-semibold">P: {i.pergunta}</p>
                <p className="text-muted-foreground">R: {i.resposta}</p>
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      {gatilhos.length > 0 && (
        <Bloco titulo="Falas gatilho">
          <ul className="list-disc space-y-1 pl-5">
            {gatilhos.map((f, i) => (
              <li key={i}>“{f}”</li>
            ))}
          </ul>
        </Bloco>
      )}

      {escalada.length > 0 && (
        <Bloco titulo="Escalada (conduta inadequada do agente)">
          <ul className="list-disc space-y-1 pl-5">
            {escalada.map((f, i) => (
              <li key={i}>“{f}”</li>
            ))}
          </ul>
        </Bloco>
      )}

      {persona.encerramento && <Bloco titulo="Encerramento">{persona.encerramento}</Bloco>}

      <footer className="mt-6 border-t border-border pt-2 text-[10px] text-muted-foreground">
        Portal de Desempenho • Material de apoio para simulação — uso interno
      </footer>
    </article>
  );
}
