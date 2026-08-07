import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { exigirPermissao, PERM } from "@/lib/permissions";

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
  beforeLoad: () => exigirPermissao([PERM.checklists.ver, PERM.checklists.aplicar], "/portal"),
  component: () => <Outlet />,
});
