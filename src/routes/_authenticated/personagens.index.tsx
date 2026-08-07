import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, ArrowUpRight, ClipboardList, History, Layers, Star, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/personas/PersonasShell";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useHistorico, usePersonas, useSimulacoes } from "@/lib/personas/api";
import {
  COMPLEXIDADES,
  EXERCICIOS,
  VERTENTES,
  formatarData,
  type Persona,
} from "@/lib/personas/constants";

export const Route = createFileRoute("/_authenticated/personagens/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Portal de Desempenho" },
      {
        name: "description",
        content:
          "Indicadores do Portal de Desempenho: totais por exercício, vertente e complexidade, últimas alterações e exercícios montadas.",
      },
      { property: "og:title", content: "Dashboard | Portal de Desempenho" },
      {
        property: "og:description",
        content: "Painel de indicadores das personas usadas em exercícios realísticos.",
      },
    ],
  }),
  component: Dashboard,
});

const CORES = [
  "var(--brand)",
  "var(--brand-dark)",
  "var(--highlight)",
  "var(--warning)",
  "var(--brand-support)",
];

function Indicador({
  titulo,
  valor,
  icone: Icone,
  destaque,
}: {
  titulo: string;
  valor: number;
  icone: React.ElementType;
  destaque?: "brand" | "highlight" | "warning";
}) {
  const tom =
    destaque === "highlight"
      ? "bg-highlight/25 text-highlight-foreground"
      : destaque === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-brand/10 text-brand";
  return (
    <div className="surface-card flex items-center gap-4 p-5 transition-shadow hover:shadow-raised">
      <div className={`flex size-11 items-center justify-center rounded-xl ${tom}`}>
        <Icone className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{titulo}</p>
        <p className="text-2xl font-bold">{valor}</p>
      </div>
    </div>
  );
}

function contar(personas: Persona[], chave: keyof Persona, valores: readonly string[]) {
  return valores
    .map((v) => ({ nome: v, total: personas.filter((p) => p[chave] === v).length }))
    .filter((d) => d.total > 0);
}

function Dashboard() {
  const { podeGerenciarPersonagens } = useAuth();
  const { data: personas = [], isLoading } = usePersonas();
  const { data: historico = [] } = useHistorico(undefined, 8);
  const { data: simulacoes = [] } = useSimulacoes();

  const ativas = personas.filter((p) => p.status === "ativa");
  const arquivadas = personas.filter((p) => p.status === "arquivada");

  const porExercicio = useMemo(() => contar(personas, "exercicio", EXERCICIOS), [personas]);
  const porVertente = useMemo(() => contar(personas, "vertente", VERTENTES), [personas]);
  const porComplexidade = useMemo(
    () => contar(personas, "complexidade", COMPLEXIDADES),
    [personas],
  );

  const ultimas = [...personas]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);

  return (
    <AppShell
      titulo="Dashboard"
      descricao="Visão geral do Portal de Desempenho"
      acoes={
        <>
          <Button asChild variant="outline">
            <Link to="/personagens/biblioteca">Biblioteca</Link>
          </Button>
          {podeGerenciarPersonagens && (
            <Button asChild>
              <Link to="/personagens/personas/$id" params={{ id: "nova" }}>
                Nova persona
              </Link>
            </Button>
          )}
        </>
      }
    >
      {isLoading ? (
        <p className="text-muted-foreground">Carregando indicadores…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador titulo="Total de personas" valor={personas.length} icone={Users} />
            <Indicador titulo="Personas ativas" valor={ativas.length} icone={Layers} />
            <Indicador
              titulo="Personas arquivadas"
              valor={arquivadas.length}
              icone={Archive}
              destaque="warning"
            />
            <Indicador
              titulo="Exercícios montados"
              valor={simulacoes.length}
              icone={ClipboardList}
              destaque="highlight"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="surface-card p-5 lg:col-span-2">
              <h2 className="mb-4 font-semibold">Distribuição por exercício</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porExercicio}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="nome"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      dy={10}
                      height={50}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="total" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="surface-card p-5">
              <h2 className="mb-4 font-semibold">Distribuição por vertente</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porVertente}
                      dataKey="total"
                      nameKey="nome"
                      innerRadius={45}
                      outerRadius={80}
                    >
                      {porVertente.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {porVertente.map((v, i) => (
                  <li key={v.nome} className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: CORES[i % CORES.length] }}
                    />
                    <span className="flex-1 text-muted-foreground">{v.nome}</span>
                    <strong>{v.total}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="surface-card p-5">
              <h2 className="mb-4 font-semibold">Por complexidade</h2>
              <ul className="space-y-3">
                {porComplexidade.length === 0 && (
                  <li className="text-sm text-muted-foreground">Nenhuma persona cadastrada.</li>
                )}
                {porComplexidade.map((c) => {
                  const pct = Math.round((c.total / Math.max(personas.length, 1)) * 100);
                  return (
                    <li key={c.nome}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{c.nome}</span>
                        <strong>{c.total}</strong>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Últimas personas criadas</h2>
                <Star className="size-4 text-highlight" />
              </div>
              <ul className="space-y-3">
                {ultimas.length === 0 && (
                  <li className="text-sm text-muted-foreground">Nada por aqui ainda.</li>
                )}
                {ultimas.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/personagens/personas/$id"
                      params={{ id: p.id }}
                      className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{p.nome}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.exercicio} • {p.vertente}
                        </span>
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-brand" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Últimas alterações</h2>
                <History className="size-4 text-muted-foreground" />
              </div>
              <ul className="space-y-3">
                {historico.length === 0 && (
                  <li className="text-sm text-muted-foreground">Sem registros de alteração.</li>
                )}
                {historico.map((h) => (
                  <li key={h.id} className="border-l-2 border-brand/40 pl-3">
                    <p className="text-sm font-medium">
                      {h.acao} — {h.persona_nome ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.user_nome ?? "Usuário"} • {formatarData(h.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
