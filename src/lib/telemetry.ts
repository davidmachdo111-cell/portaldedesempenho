import { supabase } from "@/integrations/supabase/client";

type TelemetryType = "navigation" | "performance" | "error";

export async function recordTelemetry(input: {
  eventType: TelemetryType;
  route: string;
  metric?: string;
  durationMs?: number;
  details?: Record<string, string | number | boolean>;
}) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("app_telemetry").insert({
    user_id: data.user.id,
    event_type: input.eventType,
    route: input.route.slice(0, 240),
    metric: input.metric?.slice(0, 80) ?? null,
    duration_ms: input.durationMs == null ? null : Math.max(0, Math.round(input.durationMs)),
    details: (input.details ?? {}) as never,
  });
}

export function observeNavigation(route: string) {
  const startedAt = performance.now();
  const timer = window.setTimeout(() => {
    void recordTelemetry({
      eventType: "navigation",
      route,
      metric: "route_ready",
      durationMs: performance.now() - startedAt,
    });
  }, 0);
  return () => window.clearTimeout(timer);
}