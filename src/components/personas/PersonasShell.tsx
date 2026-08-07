import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, Library, UserPlus } from "lucide-react";

import { PlatformShell } from "@/components/platform/PlatformShell";

const NAV = [
  { to: "/personagens", label: "Dashboard", icon: LayoutDashboard, exact: true, params: {} },
  {
    to: "/personagens/biblioteca",
    label: "Biblioteca de Personas",
    icon: Library,
    exact: false,
    params: {},
  },
  {
    to: "/personagens/personas/$id",
    label: "Criar Persona",
    icon: UserPlus,
    exact: false,
    params: { id: "nova" },
  },
  {
    to: "/personagens/exercicio",
    label: "Montar Simulação",
    icon: ClipboardList,
    exact: false,
    params: {},
  },
] as const;


/**
 * Casca do módulo Personagens e Simulados, agora dentro da navegação única da plataforma.
 */
export function AppShell({
  children,
  titulo,
  descricao,
  acoes,
}: {
  children: ReactNode;
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <PlatformShell title={titulo} {...(descricao ? { subtitle: descricao } : {})}>
      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={item.params as never}
              activeOptions={{ exact: item.exact }}

              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        {acoes && <div className="ml-auto flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {children}
    </PlatformShell>
  );
}
