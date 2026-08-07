import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { exigirPermissao, PERM } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/personagens")({
  head: () => ({
    meta: [
      { title: "Personagens e Simulados — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Módulo Personagens e Simulados: personagens, roteiros, cenários, simulações e PDFs para treinamentos.",
      },
      { property: "og:title", content: "Personagens e Simulados — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Personagens, roteiros, cenários e simulações para treinamentos.",
      },
    ],
  }),
  beforeLoad: () => exigirPermissao([PERM.personagens.ver], "/portal"),
  component: () => <Outlet />,
});
