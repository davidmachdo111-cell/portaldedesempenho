import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  LayoutGrid,
  ShieldCheck,
  ClipboardCheck,
  Users,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { meQueryOptions } from "@/lib/platform-queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/portal", label: "Portal", icon: LayoutGrid, permission: null },
  { to: "/checklists", label: "Checklists", icon: ClipboardCheck, permission: "checklists" },
  {
    to: "/personagens",
    label: "Personagens e Simulados",
    icon: Users,
    permission: "personagens_simulados",
  },
  { to: "/admin", label: "Administração", icon: ShieldCheck, permission: "administracao" },
] as const;

export function PlatformShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { data: me } = useQuery(meQueryOptions);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const permissions = me?.permissions ?? [];
  const visible = navItems.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  );

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-gradient font-bold text-brand-foreground">
            P
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Plataforma</p>
            <p className="text-xs text-sidebar-foreground/70">Corporativa</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {visible.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium">{me?.profile?.full_name}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{me?.profile?.username}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="mt-3 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {visible.map((item) => (
              <Button key={item.to} variant="outline" size="sm" asChild>
                <Link to={item.to}>
                  <item.icon className="size-4" />
                </Link>
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
