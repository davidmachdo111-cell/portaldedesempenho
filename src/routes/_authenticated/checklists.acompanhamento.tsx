import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/checklists/ChecklistsShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarAcompanhamento } from "@/lib/checklists/acompanhamento.functions";
import { listarSetores } from "@/lib/checklists/setores";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/checklists/acompanhamento")({
  component: PaginaAcompanhamento,
  head: () => ({
    meta: [
      { title: "Acompanhamento de checklists | Checklist de Conhecimento" },
      {
        name: "description",
        content:
          "Acompanhe em tempo real o andamento, o percentual de conclusão e o histórico dos checklists preenchidos pelos avaliadores.",
      },
      { property: "og:title", content: "Acompanhamento de checklists" },
      {
        property: "og:description",
        content: "Andamento em tempo real dos checklists preenchidos pelos avaliadores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TODOS = "__todos__";

function PaginaAcompanhamento() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const buscar = useServerFn(listarAcompanhamento);

  const [busca, setBusca] = useState("");
  const [avaliador, setAvaliador] = useState(TODOS);
  const [setor, setSetor] = useState(TODOS);
  const [status, setStatus] = useState(TODOS);
  const [pagina, setPagina] = useState(1);
  const buscaAdiada = useDeferredValue(busca);

  const dados = useQuery({
    queryKey: ["acompanhamento", pagina, buscaAdiada, avaliador, setor, status],
    queryFn: () =>
      buscar({
        data: {
          pagina,
          porPagina: 25,
          busca: buscaAdiada,
          avaliador: avaliador === TODOS ? undefined : avaliador,
          setor: setor === TODOS ? undefined : setor,
          status: status === TODOS ? undefined : (status as "rascunho" | "concluida"),
        },
      }),
    enabled: isAdmin,
  });
  const setores = useQuery({ queryKey: ["setores"], queryFn: listarSetores, enabled: isAdmin });

  // Atualização em tempo real do preenchimento dos avaliadores.
  useEffect(() => {
    if (!isAdmin) return;
    const canal = supabase
      .channel("acompanhamento-avaliacoes")
      .on("postgres_changes", { event: "*", schema: "public", table: "avaliacoes" }, () => {
        void qc.invalidateQueries({ queryKey: ["acompanhamento"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [isAdmin, qc]);

  const linhas = dados.data?.itens ?? [];
  const avaliadores = dados.data?.avaliadores ?? [];
  const total = dados.data?.total ?? 0;

  useEffect(() => setPagina(1), [buscaAdiada, avaliador, setor, status]);

  if (!isAdmin) {
    return (
      <AdminShell titulo="Acompanhamento" descricao="Acesso restrito">
        <div className="surface p-8 text-center text-sm text-muted-foreground">
          Apenas administradores podem acompanhar as avaliações.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      titulo="Acompanhamento de checklists"
      descricao="Andamento em tempo real de todos os checklists, com filtros e histórico."
    >
      <div className="space-y-5">
        <div className="surface grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            placeholder="Buscar colaborador ou checklist"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Select value={avaliador} onValueChange={setAvaliador}>
            <SelectTrigger>
              <SelectValue placeholder="Avaliador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os avaliadores</SelectItem>
              {avaliadores.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={setor} onValueChange={setSetor}>
            <SelectTrigger>
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os setores</SelectItem>
              {(setores.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.nome}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os status</SelectItem>
              <SelectItem value="rascunho">Em preenchimento</SelectItem>
              <SelectItem value="concluida">Concluídos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3">Checklist</th>
                <th className="p-3">Colaborador</th>
                <th className="p-3">Avaliador</th>
                <th className="p-3">Setor</th>
                <th className="p-3">Conclusão</th>
                <th className="p-3">Nota</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
               {linhas.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3 font-medium text-heading">{l.checklist_nome}</td>
                  <td className="p-3">{l.colaborador_nome || "—"}</td>
                  <td className="p-3">{l.avaliador_nome}</td>
                  <td className="p-3">{l.setor || "—"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, l.percentual)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {l.percentual.toFixed(0)}% ({l.itens_concluidos}/{l.itens_totais})
                      </span>
                    </div>
                  </td>
                  <td className="p-3">{l.media.toFixed(1)}%</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        l.status === "concluida"
                          ? "bg-leaf text-brand-support"
                          : "bg-sand text-brand-dark"
                      }`}
                    >
                      {l.status === "concluida" ? "Concluído" : "Em preenchimento"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        router.navigate({
                          to: "/checklists/avaliacoes/$id",
                          params: { id: l.id },
                        })
                      }
                    >
                      Abrir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!dados.isLoading && !linhas.length && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma avaliação encontrada com os filtros atuais.
            </p>
          )}
          {dados.isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">Carregando…</p>
          )}
          {total > 25 && (
            <div className="flex items-center justify-center gap-3 border-t p-3">
              <Button variant="outline" size="sm" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</Button>
              <span className="text-xs text-muted-foreground">Página {pagina}</span>
              <Button variant="outline" size="sm" disabled={pagina * 25 >= total} onClick={() => setPagina((p) => p + 1)}>Próxima</Button>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
