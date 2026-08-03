import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  Send,
} from "lucide-react";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { useAuth } from "@/hooks/useAuth";

const itensAdmin = [
  { to: "/checklists", label: "Home", icon: LayoutDashboard },
  { to: "/checklists/modelos", label: "Checklists", icon: ClipboardList },
  { to: "/checklists/acompanhamento", label: "Acompanhamento", icon: Activity },
  { to: "/checklists/liberacoes", label: "Liberações", icon: Send },
  { to: "/checklists/setores", label: "Setores", icon: Building2 },
] as const;

const itensAvaliador = [
  { to: "/checklists/avaliacoes", label: "Minhas avaliações", icon: ClipboardCheck },
] as const;

/**
 * Casca do módulo Checklists: preserva cabeçalho, menu e ações do sistema original,
 * agora dentro da navegação única da plataforma.
 */
export function AdminShell({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  const { isAdmin } = useAuth();
  const itens = isAdmin ? [...itensAdmin, ...itensAvaliador] : [...itensAvaliador];

  return (
    <PlatformShell title={titulo} {...(descricao ? { subtitle: descricao } : {})}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-1">
          {itens.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              activeOptions={{ exact: i.to === "/checklists" }}
              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60"
            >
              <i.icon className="size-4" />
              {i.label}
            </Link>
          ))}
        </nav>
        {acoes && <div className="ml-auto flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {children}
    </PlatformShell>
  );
}
