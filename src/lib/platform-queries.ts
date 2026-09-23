import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { expandirPermissoes } from "@/lib/permissions";
import { carregarMeuAcesso } from "@/lib/platform-me.functions";

export type PlatformProfile = {
  id: string;
  username: string;
  full_name: string;
  active: boolean;
  created_at: string;
};

export type PlatformModule = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  permission_key: string | null;
  active: boolean;
  sort_order: number;
};

/** Identidade + permissões do usuário autenticado (base de todo o controle de acesso). */
export const meQueryOptions = queryOptions({
  queryKey: ["platform", "me"],
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const acesso = await carregarMeuAcesso();
    const roleKeys = acesso.roleKeys;
    const canonicas = acesso.canonicalPermissions;

    const isAdmin =
      roleKeys.includes("administrador") ||
      roleKeys.includes("admin") ||
      canonicas.includes("administracao.ver");

    return {
      userId: acesso.userId,
      profile: (acesso.profile as PlatformProfile | null) ?? null,
      roleKeys,
      permissions: expandirPermissoes(canonicas, isAdmin),
      canonicalPermissions: canonicas,
      isAdmin,
    };
  },
});

export const modulesQueryOptions = queryOptions({
  queryKey: ["platform", "modules"],
  staleTime: 10 * 60_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("modules")
      .select("id, key, name, description, icon, route, permission_key, active, sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as PlatformModule[];
  },
});

export const usersQueryOptions = queryOptions({
  queryKey: ["platform", "users"],
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const [profiles, roles, perms] = await Promise.all([
      supabase.from("profiles").select("id, username, full_name, active, created_at").order("username"),
      supabase.from("user_roles").select("user_id, role_key"),
      supabase.from("user_permissions").select("user_id, permission_key"),
    ]);
    if (profiles.error) throw profiles.error;
    return (profiles.data as PlatformProfile[]).map((p) => ({
      ...p,
      roleKeys: (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role_key),
      permissionKeys: (perms.data ?? [])
        .filter((r) => r.user_id === p.id)
        .map((r) => r.permission_key),
    }));
  },
});

export const rolesQueryOptions = queryOptions({
  queryKey: ["platform", "roles"],
  queryFn: async () => {
    const [roles, rp] = await Promise.all([
      supabase.from("roles").select("*").order("name"),
      supabase.from("role_permissions").select("role_key, permission_key"),
    ]);
    if (roles.error) throw roles.error;
    return (roles.data ?? []).map((r) => ({
      ...r,
      permissionKeys: (rp.data ?? [])
        .filter((x) => x.role_key === r.key)
        .map((x) => x.permission_key),
    }));
  },
});

export const permissionsQueryOptions = queryOptions({
  queryKey: ["platform", "permissions"],
  queryFn: async () => {
    const { data, error } = await supabase.from("permissions").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const sessionsQueryOptions = queryOptions({
  queryKey: ["platform", "sessions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});
