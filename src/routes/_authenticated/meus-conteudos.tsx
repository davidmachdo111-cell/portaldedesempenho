import { createFileRoute, Outlet } from "@tanstack/react-router";
import { exigirPermissao, PERM } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/meus-conteudos")({
  head: () => ({
    meta: [
      { title: "Meus Conteúdos — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Acesse os simulados, personagens e anexos liberados para você, com visualização e download dos materiais.",
      },
      { property: "og:title", content: "Meus Conteúdos — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Simulados, personagens e anexos liberados para o seu usuário.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => exigirPermissao([PERM.meusConteudos.ver], "/portal"),
  component: () => <Outlet />,
});
