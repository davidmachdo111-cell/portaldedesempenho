import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/personagens")({
  head: () => ({
    meta: [
      { title: "Personagens e Exercícios — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Módulo Personagens e Exercícios: personagens, roteiros, cenários, simulações e PDFs para treinamentos.",
      },
      { property: "og:title", content: "Personagens e Exercícios — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Personagens, roteiros, cenários e exercícios para treinamentos.",
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
  component: () => <Outlet />,
});
