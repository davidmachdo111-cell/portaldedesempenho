import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/checklists")({
  head: () => ({
    meta: [
      { title: "Checklists — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Módulo Checklists: avaliações, critérios, pesos, dashboards, indicadores e geração de PDFs.",
      },
      { property: "og:title", content: "Checklists — Portal de Desempenho" },
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
  component: () => <Outlet />,
});
