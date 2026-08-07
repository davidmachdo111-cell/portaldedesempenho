import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail, normalizeUsername } from "@/lib/platform";
import { getBootstrapStatus, bootstrapFirstAdmin } from "@/lib/platform-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Acesso único à plataforma corporativa: Checklists, Personagens e Exercícios e Administração Central.",
      },
      { property: "og:title", content: "Entrar — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Login único para todos os módulos da plataforma corporativa.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: bootstrap, refetch } = useQuery({
    queryKey: ["platform", "bootstrap"],
    queryFn: () => getBootstrapStatus(),
  });
  const needsBootstrap = bootstrap?.needsBootstrap === true;

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/portal");
    });
  }, []);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error) {
      toast.error("Usuário ou senha inválidos.");
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (profile && profile.active === false) {
        await supabase.auth.signOut();
        toast.error("Usuário inativo. Procure o administrador.");
        return;
      }
      await supabase.from("user_sessions").insert({
        user_id: auth.user.id,
        user_agent: navigator.userAgent.slice(0, 300),
      });
    }
    window.location.replace("/portal");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!normalizeUsername(username)) {
      toast.error("Informe o usuário no formato nome.sobrenome.");
      return;
    }
    setLoading(true);
    try {
      if (needsBootstrap) {
        await bootstrapFirstAdmin({
          data: { username, fullName: fullName || username, password },
        });
        toast.success("Administrador criado. Entrando...");
        await refetch();
      }
      await signIn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-brand-gradient p-12 text-brand-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-foreground/15 text-lg font-bold">
            P
          </div>
          <span className="text-sm font-semibold tracking-wide uppercase">
            Portal de Desempenho
          </span>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            Um único acesso para todos os módulos
          </h2>
          <p className="text-brand-foreground/80">
            Checklists, Personagens e Exercícios e Administração Central compartilham login,
            usuários, perfis e permissões.
          </p>
        </div>
        <p className="text-xs text-brand-foreground/70">Acesso restrito a usuários autorizados.</p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-sm shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>{needsBootstrap ? "Criar administrador" : "Entrar"}</CardTitle>
            <CardDescription>
              {needsBootstrap
                ? "Nenhum usuário cadastrado ainda. Crie o administrador inicial da plataforma."
                : "Utilize seu usuário e senha corporativos."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {needsBootstrap && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João Silva"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={username}
                  autoComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="joao.silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {needsBootstrap ? "Criar e entrar" : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
