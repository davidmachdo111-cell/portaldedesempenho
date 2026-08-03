import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/checklists")({
  head: () => ({
    meta: [
      { title: "Checklists — Plataforma Corporativa" },
      {
        name: "description",
        content:
          "Módulo Checklists: avaliações, critérios, pesos, dashboards, indicadores e geração de PDFs.",
      },
      { property: "og:title", content: "Checklists — Plataforma Corporativa" },
      {
        property: "og:description",
        content: "Avaliações, critérios, indicadores e relatórios do módulo Checklists.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: allowed } = await supabase.rpc("has_permission", {
      _user_id: data.user.id,
      _permission: "checklists",
    });
    if (allowed !== true) throw redirect({ to: "/portal" });
  },
  component: ChecklistsModule,
});

function ChecklistsModule() {
  return (
    <PlatformShell
      title="Checklists"
      subtitle="Avaliações, critérios, indicadores, pesos e PDFs"
    >
      <Card className="max-w-2xl shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Módulo pronto para receber o código atual</CardTitle>
          <CardDescription>
            A autenticação, os usuários e as permissões já estão centralizados. As telas atuais do
            Leafy Performance entram aqui, sob esta rota, preservando todas as regras de negócio —
            sem tela de login própria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/portal">Voltar ao Portal</Link>
          </Button>
        </CardContent>
      </Card>
    </PlatformShell>
  );
}
