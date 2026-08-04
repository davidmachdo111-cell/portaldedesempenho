import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { ArrowRight, LayoutGrid } from "lucide-react";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { meQueryOptions, modulesQueryOptions } from "@/lib/platform-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    ],
  }),
  component: PortalPage,
});

function PortalPage() {
  const { data: me } = useQuery(meQueryOptions);
  const { data: modules, isLoading } = useQuery(modulesQueryOptions);

  const permissions = me?.permissions ?? [];
  const allowed = (modules ?? []).filter(
    (m) => m.active && (!m.permission_key || permissions.includes(m.permission_key)),
  );

  return (
    <PlatformShell
      title={`Olá, ${me?.profile?.full_name?.split(" ")[0] ?? ""}`}
      subtitle="Selecione um módulo para começar"
    >
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
              Seu usuário ainda não possui permissão para acessar módulos. Procure o administrador da
              plataforma.
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
    </PlatformShell>
  );
}
