import { supabase } from "@/integrations/supabase/client";

type TelemetryType = "navigation" | "performance" | "error";

let navigationStartedAt: number | null = null;
let listenersInstalled = false;
let lastRecordedRoute = "";
let lastRecordedAt = 0;

export async function recordTelemetry(input: {
  eventType: TelemetryType;
  route: string;
  metric?: string;
  durationMs?: number;
  details?: Record<string, string | number | boolean>;
}) {
  try {
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
  } catch {
    // Telemetria nunca deve interromper a navegação principal.
  }
}

export function installNavigationTiming() {
  if (listenersInstalled) return () => undefined;
  listenersInstalled = true;
  const markStart = () => { navigationStartedAt = performance.now(); };
  const captureLink = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin === window.location.origin && url.pathname !== window.location.pathname) markStart();
  };
  window.addEventListener("click", captureLink, true);
  window.addEventListener("popstate", markStart);
  return () => {
    window.removeEventListener("click", captureLink, true);
    window.removeEventListener("popstate", markStart);
    listenersInstalled = false;
  };
}

export function observeNavigation(route: string) {
  const frame = window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const now = performance.now();
      if (lastRecordedRoute === route && now - lastRecordedAt < 2_000) return;
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const startedAt = navigationStartedAt ?? navigation?.startTime ?? 0;
      lastRecordedRoute = route;
      lastRecordedAt = now;
      navigationStartedAt = null;
      void recordTelemetry({
        eventType: "navigation",
        route,
        metric: "route_content_ready",
        durationMs: now - startedAt,
        details: { navigation: startedAt === 0 ? "initial" : "internal" },
      });
    });
  });
  return () => window.cancelAnimationFrame(frame);
}