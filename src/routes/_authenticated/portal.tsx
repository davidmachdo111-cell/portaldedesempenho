import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as Icons from "lucide-react";
import { ArrowRight, BarChart3, ClipboardCheck, FolderOpen, LayoutGrid, Users } from "lucide-react";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { meQueryOptions, modulesQueryOptions } from "@/lib/platform-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortalSummary } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Portal Principal — Portal de Desempenho" },
      {
        name: "description",
        content: "Acesse os módulos liberados para o seu usuário na plataforma corporativa.",
      },
      { property: "og:title", content: "Portal Principal — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Portal central de módulos da plataforma corporativa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalPage,
});

function PortalPage() {
  const { data: me } = useQuery(meQueryOptions);
  const { data: modules, isLoading } = useQuery(modulesQueryOptions);
  const loadSummary = useServerFn(getPortalSummary);
  const summary = useQuery({
    queryKey: ["portal", "summary"],
    queryFn: () => loadSummary(),
    staleTime: 60_000,
  });

  const permissions = me?.permissions ?? [];
  const allowed = (modules ?? []).filter(
    (m) => m.active && (!m.permission_key || permissions.includes(m.permission_key)),
  );
  const profileLabel = summary.data?.mode === "admin"
    ? "Administrador"
    : summary.data?.mode === "avaliador"
      ? "Avaliador"
      : "Auxiliar";
  const metricRoute = (target: string) => {
    if (target === "avaliacoes") return "/checklists/avaliacoes";
    if (target === "conteudos") return "/meus-conteudos";
    if (target === "personas" || target === "exercicios") return "/personagens";
    return "/colaboradores";
  };
  const metricIcon = (target: string) => {
    if (target === "avaliacoes") return ClipboardCheck;
    if (target === "conteudos") return FolderOpen;
    if (target === "personas" || target === "exercicios") return Users;
    return BarChart3;
  };

  return (
    <PlatformShell
      title={`Olá, ${me?.profile?.full_name?.split(" ")[0] ?? ""}`}
      subtitle={`${profileLabel} · visão personalizada do seu acesso`}
    >
      <section aria-labelledby="resumo-title" className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 id="resumo-title" className="text-base font-semibold">Resumo</h2>
            <p className="text-sm text-muted-foreground">Informações relevantes para o seu perfil.</p>
          </div>
        </div>
        {summary.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />)}
          </div>
        ) : summary.isError ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Não foi possível carregar o resumo agora. Os módulos continuam disponíveis abaixo.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(summary.data?.metrics ?? []).map((metric) => {
              const MetricIcon = metricIcon(metric.target);
              return (
                <Card key={metric.label} className="shadow-[var(--shadow-card)]">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <p className="text-2xl font-semibold tabular-nums">{metric.value}</p>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                    </div>
                    <Button variant="outline" size="icon" asChild aria-label={`Abrir ${metric.label}`}>
                      <Link to={metricRoute(metric.target)}><MetricIcon className="size-4" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="modulos-title">
        <h2 id="modulos-title" className="mb-4 text-base font-semibold">Módulos disponíveis</h2>
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      ) : allowed.length === 0 ? (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Nenhum módulo liberado</CardTitle>
            <CardDescription>
              Seu usuário ainda não possui permissão para acessar módulos. Procure o administrador
              da plataforma.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {allowed.map((module) => {
            const Icon =
              (Icons as unknown as Record<string, typeof LayoutGrid>)[module.icon] ?? LayoutGrid;
            return (
              <Card
                key={module.id}
                className="group flex flex-col shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
              >
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-brand-gradient text-brand-foreground">
                    <Icon className="size-6" />
                  </div>
                  <CardTitle>{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full">
                    <Link to={module.route}>
                      Acessar <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </section>
    </PlatformShell>
  );
}
