import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuditEvents, getTelemetrySummary } from "@/lib/admin-observability.functions";

export function AdminObservability({ mode }: { mode: "audit" | "telemetry" }) {
  const [page, setPage] = useState(1);
  const auditFn = useServerFn(getAuditEvents);
  const telemetryFn = useServerFn(getTelemetrySummary);
  const audit = useQuery({ queryKey: ["admin", "audit", page], queryFn: () => auditFn({ data: { page } }), enabled: mode === "audit" });
  const telemetry = useQuery({ queryKey: ["admin", "telemetry"], queryFn: () => telemetryFn(), enabled: mode === "telemetry" });

  if (mode === "telemetry") {
    const summary = telemetry.data;
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[{ label: "Eventos em 7 dias", value: summary?.total ?? 0, icon: Activity }, { label: "Erros capturados", value: summary?.errors ?? 0, icon: AlertTriangle }, { label: "Tempo médio", value: `${summary?.averageMs ?? 0} ms`, icon: Clock3 }].map((item) => (
            <Card key={item.label}><CardContent className="flex items-center gap-3 p-5"><item.icon className="size-5 text-primary" /><div><p className="text-2xl font-semibold">{item.value}</p><p className="text-xs text-muted-foreground">{item.label}</p></div></CardContent></Card>
          ))}
        </div>
        <Card><CardHeader><CardTitle>Eventos recentes</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Tela</TableHead><TableHead>Métrica</TableHead><TableHead>Tempo</TableHead></TableRow></TableHeader><TableBody>{(summary?.recent ?? []).map((row, index) => <TableRow key={`${row.created_at}-${index}`}><TableCell>{row.event_type}</TableCell><TableCell>{row.route}</TableCell><TableCell>{row.metric ?? "—"}</TableCell><TableCell>{row.duration_ms == null ? "—" : `${row.duration_ms} ms`}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil((audit.data?.total ?? 0) / 25));
  return (
    <Card><CardHeader><CardTitle>Trilha administrativa</CardTitle></CardHeader><CardContent className="space-y-4"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Entidade</TableHead><TableHead>Ação</TableHead><TableHead>Origem</TableHead></TableRow></TableHeader><TableBody>{(audit.data?.items ?? []).map((row) => <TableRow key={row.id}><TableCell>{new Date(row.created_at).toLocaleString("pt-BR")}</TableCell><TableCell>{row.entity_type}</TableCell><TableCell>{row.action}</TableCell><TableCell>{row.source}</TableCell></TableRow>)}</TableBody></Table><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div></div></CardContent></Card>
  );
}