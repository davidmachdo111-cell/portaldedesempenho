import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return null;

    const [profileRes, rolesRes, permsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role_key").eq("user_id", user.id),
      supabase.from("user_permissions").select("permission_key").eq("user_id", user.id),
    ]);

    const roleKeys = (rolesRes.data ?? []).map((r) => r.role_key);
    let rolePerms: string[] = [];
    if (roleKeys.length > 0) {
      const { data } = await supabase
        .from("role_permissions")
        .select("permission_key")
        .in("role_key", roleKeys);
      rolePerms = (data ?? []).map((r) => r.permission_key);
    }

    const permissions = Array.from(
      new Set([...(permsRes.data ?? []).map((p) => p.permission_key), ...rolePerms]),
    );

    return {
      userId: user.id,
      profile: (profileRes.data as PlatformProfile | null) ?? null,
      roleKeys,
      permissions,
      isAdmin: roleKeys.includes("administrador") || permissions.includes("administracao"),
    };
  },
});

export const modulesQueryOptions = queryOptions({
  queryKey: ["platform", "modules"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as PlatformModule[];
  },
});

export const usersQueryOptions = queryOptions({
  queryKey: ["platform", "users"],
  queryFn: async () => {
    const [profiles, roles, perms] = await Promise.all([
      supabase.from("profiles").select("*").order("username"),
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
