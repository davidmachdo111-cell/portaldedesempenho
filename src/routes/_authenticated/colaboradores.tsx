import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/colaboradores")({
  head: () => ({
    meta: [
      { title: "Colaboradores — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Cadastro central de colaboradores, liberação de treinamentos, pendências e acompanhamento individual.",
      },
      { property: "og:title", content: "Colaboradores — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Cadastro único de colaboradores e gestão das atividades liberadas.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: allowed } = await supabase.rpc("has_permission", {
      _user_id: data.user.id,
      _permission: "colaboradores",
    });
    if (allowed !== true) throw redirect({ to: "/portal" });
  },
  component: () => <Outlet />,
});
