import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { UsersAdmin } from "@/components/platform/UsersAdmin";
import {
  modulesQueryOptions,
  permissionsQueryOptions,
  rolesQueryOptions,
  sessionsQueryOptions,
} from "@/lib/platform-queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração Central — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Gerencie usuários, perfis, permissões, sessões e módulos de toda a plataforma em um só painel.",
      },
      { property: "og:title", content: "Administração Central — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Usuários, perfis, permissões, sessões e módulos centralizados.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: allowed } = await supabase.rpc("has_permission", {
      _user_id: data.user.id,
      _permission: "administracao",
    });
    if (allowed !== true) throw redirect({ to: "/portal" });
  },
  component: AdminPage,
});

function AdminPage() {
  const { data: roles = [] } = useQuery(rolesQueryOptions);
  const { data: permissions = [] } = useQuery(permissionsQueryOptions);
  const { data: sessions = [] } = useQuery(sessionsQueryOptions);
  const { data: modules = [] } = useQuery(modulesQueryOptions);

  return (
    <PlatformShell
      title="Administração Central"
      subtitle="Usuários, perfis, permissões, sessões e módulos"
    >
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="roles">Perfis</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersAdmin />
        </TabsContent>

        <TabsContent value="roles">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Perfis</CardTitle>
              <CardDescription>
                Cada perfil concentra um conjunto de permissões aplicado a todos os seus usuários.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {roles.map((role) => (
                <div key={role.key} className="rounded-lg border p-4">
                  <p className="font-medium">{role.name}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {role.permissionKeys.map((key) => (
                      <Badge key={key} variant="secondary">
                        {permissions.find((p) => p.key === key)?.name ?? key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Permissões</CardTitle>
              <CardDescription>
                Controle granular de acesso. Um novo módulo só precisa ser cadastrado e ter sua
                permissão criada aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chave</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.key}>
                      <TableCell className="font-mono text-xs">{permission.key}</TableCell>
                      <TableCell>{permission.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {permission.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Sessões</CardTitle>
              <CardDescription>Últimos acessos registrados na plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Dispositivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-xs">{session.user_id}</TableCell>
                      <TableCell>
                        {new Date(session.started_at as string).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {session.user_agent}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Módulos</CardTitle>
              <CardDescription>
                Cards exibidos no Portal Principal, controlados por permissão.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell className="font-mono text-xs">{module.route}</TableCell>
                      <TableCell className="font-mono text-xs">{module.permission_key}</TableCell>
                      <TableCell>
                        <Badge variant={module.active ? "secondary" : "outline"}>
                          {module.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PlatformShell>
  );
}
