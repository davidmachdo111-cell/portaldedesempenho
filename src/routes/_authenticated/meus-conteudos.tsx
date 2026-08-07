import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/meus-conteudos")({
  head: () => ({
    meta: [
      { title: "Meus Conteúdos — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Acesse os exercícios, personagens e anexos liberados para você, com visualização e download dos materiais.",
      },
      { property: "og:title", content: "Meus Conteúdos — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Exercícios, personagens e anexos liberados para o seu usuário.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
