import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { exigirPermissao, PERM } from "@/lib/permissions";

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
  beforeLoad: () => exigirPermissao([PERM.colaboradores.ver], "/portal"),
  component: () => <Outlet />,
});
