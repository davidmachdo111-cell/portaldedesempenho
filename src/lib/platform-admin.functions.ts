import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { usernameToEmail, normalizeUsername } from "@/lib/platform";

type NewUserInput = {
  username: string;
  fullName: string;
  password: string;
  active?: boolean;
  roleKeys?: string[];
  permissionKeys?: string[];
};

export const getBootstrapStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return { needsBootstrap: (count ?? 0) === 0 };
});

export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; fullName: string; password: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) throw new Error("A plataforma já possui usuários cadastrados.");
    await createPlatformUser(supabaseAdmin, {
      username: data.username,
      fullName: data.fullName,
      password: data.password,
      roleKeys: ["administrador"],
    });
    return { ok: true };
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: NewUserInput) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return createPlatformUser(supabaseAdmin, data);
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      userId: string;
      fullName?: string;
      active?: boolean;
      roleKeys?: string[];
      permissionKeys?: string[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: { full_name?: string; active?: boolean } = {};
    if (data.fullName !== undefined) patch.full_name = data.fullName;
    if (data.active !== undefined) patch.active = data.active;
    if (Object.keys(patch).length > 0) {
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.userId);
      if (error) throw new Error(error.message);
    }

    if (data.roleKeys) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      if (data.roleKeys.length > 0) {
        const { error } = await supabaseAdmin
          .from("user_roles")
          .insert(data.roleKeys.map((role_key) => ({ user_id: data.userId, role_key })));
        if (error) throw new Error(error.message);
      }
    }

    if (data.permissionKeys) {
      await supabaseAdmin.from("user_permissions").delete().eq("user_id", data.userId);
      if (data.permissionKeys.length > 0) {
        const { error } = await supabaseAdmin
          .from("user_permissions")
          .insert(
            data.permissionKeys.map((permission_key) => ({ user_id: data.userId, permission_key })),
          );
        if (error) throw new Error(error.message);
      }
    }

    return { ok: true };
  });

export const adminSetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Não é possível excluir o próprio usuário.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };
  const { data } = await supabase.rpc("is_admin", { _user_id: context.userId });
  if (data !== true) throw new Error("Acesso restrito a administradores.");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function createPlatformUser(supabaseAdmin: any, input: NewUserInput) {
  const username = normalizeUsername(input.username);
  if (!username) throw new Error("Informe um usuário válido no formato nome.sobrenome.");
  if (input.password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: usernameToEmail(username),
    password: input.password,
    email_confirm: true,
    user_metadata: { username, full_name: input.fullName },
  });
  if (createError) throw new Error(createError.message);
  const userId: string = created.user.id;

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    username,
    full_name: input.fullName || username,
    active: input.active ?? true,
  });
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  const roleKeys = input.roleKeys ?? ["usuario"];
  if (roleKeys.length > 0) {
    await supabaseAdmin
      .from("user_roles")
      .insert(roleKeys.map((role_key: string) => ({ user_id: userId, role_key })));
  }
  if (input.permissionKeys && input.permissionKeys.length > 0) {
    await supabaseAdmin
      .from("user_permissions")
      .insert(
        input.permissionKeys.map((permission_key: string) => ({
          user_id: userId,
          permission_key,
        })),
      );
  }

  return { userId, username };
}
