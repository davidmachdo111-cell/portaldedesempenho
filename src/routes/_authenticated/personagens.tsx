import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/personagens")({
  head: () => ({
    meta: [
      { title: "Personagens e Simulados — Plataforma Corporativa" },
      {
        name: "description",
        content:
          "Módulo Personagens e Simulados: personagens, roteiros, cenários, simulações e PDFs para treinamentos.",
      },
      { property: "og:title", content: "Personagens e Simulados — Plataforma Corporativa" },
      {
        property: "og:description",
        content: "Personagens, roteiros, cenários e simulações para treinamentos.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: allowed } = await supabase.rpc("has_permission", {
      _user_id: data.user.id,
      _permission: "personagens_simulados",
    });
    if (allowed !== true) throw redirect({ to: "/portal" });
  },
  component: PersonagensModule,
});

function PersonagensModule() {
  return (
    <PlatformShell
      title="Personagens e Simulados"
      subtitle="Personagens, roteiros, cenários e simulações"
    >
      <Card className="max-w-2xl shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Módulo pronto para receber o código atual</CardTitle>
          <CardDescription>
            As telas atuais do Sim Persona Craft entram aqui, sob esta rota, reaproveitando o login,
            os usuários e as permissões da plataforma — sem tela de login própria e sem alterar
            nenhuma funcionalidade.
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
