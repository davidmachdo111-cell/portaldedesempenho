import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal de Desempenho — Módulos corporativos" },
      {
        name: "description",
        content:
          "Portal único com acesso aos módulos Checklists e Personagens e Simulados, com usuários, perfis e permissões centralizados.",
      },
      { property: "og:title", content: "Portal de Desempenho — Módulos corporativos" },
      {
        property: "og:description",
        content: "Portal único com acesso aos módulos Checklists e Personagens e Simulados, com usuários, perfis e permissões centralizados.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      window.location.replace(data.session ? "/portal" : "/auth");
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient">
      <div className="text-center text-brand-foreground">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-foreground/15 text-xl font-bold">
          P
        </div>
        <h1 className="text-xl font-semibold">Portal de Desempenho</h1>
        <p className="mt-1 text-sm text-brand-foreground/80">Redirecionando...</p>
      </div>
    </div>
  );
}
