import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { MessageSquareText, ThumbsUp, TrendingUp } from "lucide-react";
import {
  type Avaliacao,
  classificacao,
  corFaixa,
  faixa,
  indiceCriterio,
  mediaGeral,
  notaExercicio,
} from "@/lib/checklists/avaliacao";

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function PainelResultados({
  avaliacao,
  onAbrirPainel,
  mostrarFortes = true,
  mostrarDesenvolvimento = true,
}: {
  avaliacao: Avaliacao;
  onAbrirPainel: (exId: string) => void;
  mostrarFortes?: boolean;
  mostrarDesenvolvimento?: boolean;
}) {
  const media = mediaGeral(avaliacao);
  const dados = avaliacao.exercicios.map((e) => ({
    nome: e.nome,
    nota: Number(notaExercicio(avaliacao, e.id).toFixed(1)),
  }));
  const ordenados = [...avaliacao.criterios].sort(
    (a, b) => indiceCriterio(avaliacao, b.id) - indiceCriterio(avaliacao, a.id),
  );
  const fortes = ordenados.slice(0, 3);
  const fracos = [...ordenados].reverse().slice(0, 3);

  return (
    <div className="flex flex-col gap-5">
      <section
        className="rounded-xl p-6 text-white shadow-[var(--shadow-lift)]"
        style={{
          background:
            "linear-gradient(135deg, var(--color-brand-dark), var(--color-primary))",
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
          Média geral
        </p>
        <p className="mt-1 text-5xl font-bold tabular-nums text-white">
          {media.toFixed(0)}
          <span className="text-2xl">%</span>
        </p>
        <p className="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          {classificacao(media)}
        </p>
      </section>

      <Card title="Desempenho por exercício" icon={TrendingUp}>
        <ul className="flex flex-col gap-3.5">
          {avaliacao.exercicios.map((ex) => {
            const nota = notaExercicio(avaliacao, ex.id);
            return (
              <li key={ex.id}>
                <button
                  onClick={() => onAbrirPainel(ex.id)}
                  className="w-full text-left transition hover:opacity-80"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-heading">{ex.nome}</span>
                    <span className="shrink-0 font-bold tabular-nums text-heading">
                      {nota.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${nota}%`, backgroundColor: corFaixa[faixa(nota)] }}
                    />
                  </div>
                </button>
              </li>
            );
          })}
          {!avaliacao.exercicios.length && (
            <li className="text-xs text-muted-foreground">Nenhum exercício cadastrado.</li>
          )}
        </ul>
      </Card>

      <Card title="Evolução do colaborador" icon={TrendingUp}>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="nome"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Nota"]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="nota"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
        {mostrarFortes && (
        <Card title="Pontos fortes" icon={ThumbsUp}>
          <ul className="flex flex-col gap-2.5">
            {fortes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{c.nome}</span>
                <span className="shrink-0 rounded-full bg-leaf px-2 py-0.5 text-xs font-semibold text-brand-support">
                  {indiceCriterio(avaliacao, c.id).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
        )}

        {mostrarDesenvolvimento && (
        <Card title="Pontos de desenvolvimento" icon={MessageSquareText}>
          <ul className="flex flex-col gap-2.5">
            {fracos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{c.nome}</span>
                <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-brand-dark">
                  {indiceCriterio(avaliacao, c.id).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
        )}
      </div>
    </div>
  );
}
