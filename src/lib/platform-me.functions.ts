import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Retorna identidade e permissões em uma única viagem do navegador ao servidor. */
export const carregarMeuAcesso = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, rolesRes, permsRes] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, username, full_name, active, created_at")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase.from("user_roles").select("role_key").eq("user_id", context.userId),
      context.supabase
        .from("user_permissions")
        .select("permission_key")
        .eq("user_id", context.userId),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (permsRes.error) throw new Error(permsRes.error.message);

    const roleKeys = (rolesRes.data ?? []).map((row) => row.role_key);
    const rolePermsRes = roleKeys.length
      ? await context.supabase
          .from("role_permissions")
          .select("permission_key")
          .in("role_key", roleKeys)
      : { data: [], error: null };
    if (rolePermsRes.error) throw new Error(rolePermsRes.error.message);

    return {
      userId: context.userId,
      profile: profileRes.data,
      roleKeys,
      canonicalPermissions: Array.from(
        new Set([
          ...(permsRes.data ?? []).map((row) => row.permission_key),
          ...(rolePermsRes.data ?? []).map((row) => row.permission_key),
        ]),
      ),
    };
  });