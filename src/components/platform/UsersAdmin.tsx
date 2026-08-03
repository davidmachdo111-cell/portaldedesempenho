import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Plus, Trash2, UserCog } from "lucide-react";

import {
  usersQueryOptions,
  rolesQueryOptions,
  permissionsQueryOptions,
} from "@/lib/platform-queries";
import {
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminSetPassword,
} from "@/lib/platform-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UserRow = {
  id: string;
  username: string;
  full_name: string;
  active: boolean;
  created_at: string;
  roleKeys: string[];
  permissionKeys: string[];
};

export function UsersAdmin() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery(usersQueryOptions);
  const { data: roles = [] } = useQuery(rolesQueryOptions);
  const { data: permissions = [] } = useQuery(permissionsQueryOptions);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [passwordFor, setPasswordFor] = useState<UserRow | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["platform"] });

  const create = useMutation({
    mutationFn: (input: {
      username: string;
      fullName: string;
      password: string;
      roleKeys: string[];
      permissionKeys: string[];
    }) => adminCreateUser({ data: input }),
    onSuccess: () => {
      toast.success("Usuário criado.");
      setCreateOpen(false);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (input: {
      userId: string;
      fullName?: string;
      active?: boolean;
      roleKeys?: string[];
      permissionKeys?: string[];
    }) => adminUpdateUser({ data: input }),
    onSuccess: () => {
      toast.success("Usuário atualizado.");
      setEditing(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => adminDeleteUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuário excluído.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setPassword = useMutation({
    mutationFn: (input: { userId: string; password: string }) => adminSetPassword({ data: input }),
    onSuccess: () => {
      toast.success("Senha alterada.");
      setPasswordFor(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            Criar, editar, ativar, inativar, excluir, definir perfis, permissões e senhas.
          </CardDescription>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Novo usuário
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Perfis</TableHead>
              <TableHead>Permissões extras</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell className="space-x-1">
                  {user.roleKeys.map((key) => (
                    <Badge key={key} variant="secondary">
                      {roles.find((r) => r.key === key)?.name ?? key}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell className="space-x-1">
                  {user.permissionKeys.map((key) => (
                    <Badge key={key} variant="outline">
                      {permissions.find((p) => p.key === key)?.name ?? key}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.active}
                    onCheckedChange={(active) => update.mutate({ userId: user.id, active })}
                  />
                </TableCell>
                <TableCell className="space-x-1 text-right whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => setEditing(user)}>
                    <UserCog className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPasswordFor(user)}>
                    <KeyRound className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Excluir o usuário ${user.username}?`)) remove.mutate(user.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Novo usuário"
        roles={roles}
        permissions={permissions}
        onSubmit={(values) => create.mutate(values as never)}
        withPassword
      />

      {editing && (
        <UserFormDialog
          open
          onOpenChange={() => setEditing(null)}
          title={`Editar ${editing.username}`}
          roles={roles}
          permissions={permissions}
          initial={{
            username: editing.username,
            fullName: editing.full_name,
            roleKeys: editing.roleKeys,
            permissionKeys: editing.permissionKeys,
          }}
          lockUsername
          onSubmit={(values) =>
            update.mutate({
              userId: editing.id,
              fullName: values.fullName,
              roleKeys: values.roleKeys,
              permissionKeys: values.permissionKeys,
            })
          }
        />
      )}

      {passwordFor && (
        <PasswordDialog
          username={passwordFor.username}
          onClose={() => setPasswordFor(null)}
          onSubmit={(password) => setPassword.mutate({ userId: passwordFor.id, password })}
        />
      )}
    </Card>
  );
}

type FormValues = {
  username: string;
  fullName: string;
  password: string;
  roleKeys: string[];
  permissionKeys: string[];
};

function UserFormDialog({
  open,
  onOpenChange,
  title,
  roles,
  permissions,
  initial,
  onSubmit,
  withPassword,
  lockUsername,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  roles: { key: string; name: string }[];
  permissions: { key: string; name: string }[];
  initial?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  withPassword?: boolean;
  lockUsername?: boolean;
}) {
  const [values, setValues] = useState<FormValues>({
    username: initial?.username ?? "",
    fullName: initial?.fullName ?? "",
    password: "",
    roleKeys: initial?.roleKeys ?? ["usuario"],
    permissionKeys: initial?.permissionKeys ?? [],
  });

  function toggle(list: string[], key: string) {
    return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Perfis organizam os usuários; as permissões controlam o acesso aos módulos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input
              value={values.username}
              disabled={lockUsername}
              placeholder="joao.silva"
              onChange={(e) => setValues((v) => ({ ...v, username: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input
              value={values.fullName}
              onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
            />
          </div>
          {withPassword && (
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                value={values.password}
                onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Perfis</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((role) => (
                <label key={role.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={values.roleKeys.includes(role.key)}
                    onCheckedChange={() =>
                      setValues((v) => ({ ...v, roleKeys: toggle(v.roleKeys, role.key) }))
                    }
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Permissões individuais</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissions.map((permission) => (
                <label key={permission.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={values.permissionKeys.includes(permission.key)}
                    onCheckedChange={() =>
                      setValues((v) => ({
                        ...v,
                        permissionKeys: toggle(v.permissionKeys, permission.key),
                      }))
                    }
                  />
                  {permission.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(values)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  username,
  onClose,
  onSubmit,
}: {
  username: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>Defina a nova senha de {username}.</DialogDescription>
        </DialogHeader>
        <Input value={password} onChange={(e) => setPassword(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(password)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
