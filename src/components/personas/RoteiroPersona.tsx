import type { Persona } from "@/lib/personas/constants";

/**
 * Roteiro completo da persona renderizado na própria interface (somente leitura).
 * Mesma estrutura e conteúdo do PDF, com tokens semânticos para leitura em tela.
 */
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="border-b pb-1 text-xs font-bold uppercase tracking-widest text-primary">
        {titulo}
      </h3>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

export function RoteiroPersona({ persona }: { persona: Persona }) {
  const dados = (persona.dados_tecnicos ?? []).filter((d) => d.label || d.valor);
  const ocultas = (persona.informacoes_ocultas ?? []).filter((i) => i.pergunta || i.resposta);
  const gatilhos = (persona.falas_gatilho ?? []).filter(Boolean);
  const escalada = (persona.escalada ?? []).filter(Boolean);
  const chaves = (persona.palavras_chave ?? []).filter(Boolean);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-muted/40 p-4">
        <h2 className="text-lg font-bold">{persona.nome}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {[
            persona.idade && `${persona.idade} anos`,
            persona.sexo,
            persona.cidade,
            persona.tipo_cliente,
          ]
            .filter(Boolean)
            .join(" • ") || "—"}
        </p>
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          {[
            ["Exercício", persona.exercicio],
            ["Vertente", persona.vertente],
            ["Complexidade", persona.complexidade],
          ].map(([rotulo, valor]) => (
            <div key={rotulo as string}>
              <dt className="uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
              <dd className="font-medium">{valor || "—"}</dd>
            </div>
          ))}
        </dl>
      </header>

      {(persona.titularidade || persona.nome_dependente) && (
        <Bloco titulo="Titularidade">
          {persona.titularidade || "—"}
          {persona.nome_dependente ? ` — Dependente: ${persona.nome_dependente}` : ""}
        </Bloco>
      )}

      {dados.length > 0 && (
        <Bloco titulo="Dados do personagem">
          <table className="w-full border-collapse">
            <tbody>
              {dados.map((d, i) => (
                <tr key={i} className="border-b">
                  <td className="w-1/3 py-1.5 pr-3 font-semibold text-muted-foreground">
                    {d.label}
                  </td>
                  <td className="py-1.5">{d.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Bloco>
      )}

      {persona.objetivo && (
        <Bloco titulo="Objetivo">
          <p className="whitespace-pre-wrap">{persona.objetivo}</p>
        </Bloco>
      )}

      {persona.contexto_oculto && (
        <Bloco titulo="Contexto (uso exclusivo do auxiliar)">
          <p className="whitespace-pre-wrap">{persona.contexto_oculto}</p>
        </Bloco>
      )}

      {persona.perfil_comportamental?.length > 0 && (
        <Bloco titulo="Perfil emocional">
          <div className="flex flex-wrap gap-1.5">
            {persona.perfil_comportamental.map((p) => (
              <span key={p} className="rounded-full border px-2 py-0.5 text-xs">
                {p}
              </span>
            ))}
          </div>
        </Bloco>
      )}

      {persona.fala_inicial && (
        <Bloco titulo="Fala inicial">
          <p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-3 italic">
            “{persona.fala_inicial}”
          </p>
        </Bloco>
      )}

      {ocultas.length > 0 && (
        <Bloco titulo="Informações reveladas apenas se o agente investigar">
          <ul className="space-y-2">
            {ocultas.map((i, idx) => (
              <li key={idx} className="rounded-lg border p-2.5">
                <p className="font-semibold">P: {i.pergunta}</p>
                <p className="whitespace-pre-wrap text-muted-foreground">R: {i.resposta}</p>
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

      {persona.encerramento && (
        <Bloco titulo="Encerramento">
          <p className="whitespace-pre-wrap">{persona.encerramento}</p>
        </Bloco>
      )}

      {chaves.length > 0 && (
        <Bloco titulo="Palavras-chave">
          <div className="flex flex-wrap gap-1.5">
            {chaves.map((p) => (
              <span key={p} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {p}
              </span>
            ))}
          </div>
        </Bloco>
      )}
    </div>
  );
}
