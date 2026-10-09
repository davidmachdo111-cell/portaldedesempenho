import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validarProfileAtivo } from "./profile-access";

export const requireActiveProfile = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase.from("profiles").select("active").eq("id", context.userId).maybeSingle();
    if (error) throw new Error("Não foi possível verificar seu acesso. Tente novamente.");
    validarProfileAtivo(data);
    return next();
  });