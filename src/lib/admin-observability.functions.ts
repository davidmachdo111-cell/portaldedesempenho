import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }; userId: string }) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (data !== true) throw new Error("Acesso restrito a administradores.");
}

export const getAuditEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ page: z.number().int().min(1).default(1), type: z.string().max(60).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const start = (data.page - 1) * 25;
    let query = context.supabase
      .from("audit_events")
      .select("id, actor_id, actor_name, entity_type, entity_id, action, summary, source, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, start + 24);
    if (data.type) query = query.eq("entity_type", data.type);
    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return { items: rows ?? [], total: count ?? 0 };
  });

export const getTelemetrySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await context.supabase
      .from("app_telemetry")
      .select("event_type, route, metric, duration_ms, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(250);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const durations = rows.map((row) => row.duration_ms).filter((value): value is number => value != null);
    return {
      total: rows.length,
      errors: rows.filter((row) => row.event_type === "error").length,
      averageMs: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0,
      recent: rows.slice(0, 20),
    };
  });