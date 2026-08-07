import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link2, Plus, Search, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";


import { PlatformShell } from "@/components/platform/PlatformShell";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  criarColaborador,
  excluirColaborador,
  formatarData,
  listarColaboradoresPagina,
  resumoAtividades,
  type ColaboradorInput,
} from "@/lib/colaboradores/api";
import { normalizeUsername } from "@/lib/platform";
import {
  DialogVinculos,
  PainelVinculosGeral,
  ResumoVinculos,
  useUsuariosVinculaveis,
  useVinculosDaPagina,
} from "@/components/colaboradores/VinculosResponsaveis";


export const Route = createFileRoute("/_authenticated/colaboradores/")({
  component: PaginaColaboradores,
});

const vazio: ColaboradorInput = {
  nome_completo: "",
  username: "",
  cargo: "",
  setor: "",
  celula: "",
  data_admissao: null,
  status: "ativo",
};

const POR_PAGINA = 20;

function PaginaColaboradores() {
  const qc = useQueryClient();
  const { podeGerenciarColaboradores, isAdmin, userId } = useAuth();
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [vinculando, setVinculando] = useState<{ id: string; nome_completo: string } | null>(null);
  const [form, setForm] = useState<ColaboradorInput>(vazio);


  // Busca com debounce: evita uma consulta por tecla digitada.
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAplicada(busca);
      setPagina(0);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  const colaboradores = useQuery({
    queryKey: ["colaboradores", "pagina", buscaAplicada, pagina],
    queryFn: () =>
      listarColaboradoresPagina({ busca: buscaAplicada, pagina, porPagina: POR_PAGINA }),
    placeholderData: (anterior) => anterior,
  });

  const lista = colaboradores.data?.itens ?? [];
  const total = colaboradores.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const ids = useMemo(() => lista.map((c) => c.id), [lista]);
  // Contagens apenas dos colaboradores visíveis nesta página.
  const resumos = useQuery({
    queryKey: ["colaboradores", "resumo", ids],
    queryFn: () => resumoAtividades(ids),
    enabled: ids.length > 0,
  });

  // Vínculos com avaliadores/auxiliares — visíveis a todos, gerenciados pelo administrador.
  const vinculos = useVinculosDaPagina(ids, true);
  const { itens: usuariosVinculaveis } = useUsuariosVinculaveis();
  const nomesUsuarios = useMemo(
    () => Object.fromEntries(usuariosVinculaveis.map((u) => [u.id, u.nome])),
    [usuariosVinculaveis],
  );



  const criar = useMutation({
    mutationFn: () =>
      criarColaborador({
        ...form,
        username: normalizeUsername(form.username || form.nome_completo),
      }),
    onSuccess: () => {
      toast.success("Colaborador cadastrado.");
      setAberto(false);
      setForm(vazio);
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => excluirColaborador(id),
    onSuccess: () => {
      toast.success("Colaborador excluído.");
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Classes completas (Tailwind não aceita interpolação parcial).
  const grade = "lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr_1.4fr_auto]";


  const metricas = (id: string) => {
    const r = resumos.data?.[id] ?? { total: 0, concluidas: 0 };
    return {
      total: r.total,
      concluidas: r.concluidas,
      percentual: r.total ? Math.round((r.concluidas / r.total) * 100) : 0,
    };
  };


  return (
    <PlatformShell
      title="Colaboradores"
      subtitle="Cadastro único de pessoas e base das liberações de treinamentos"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, usuário, cargo, setor ou célula"
              className="pl-9"
            />
          </div>
          {podeGerenciarColaboradores && (
            <Button onClick={() => setAberto(true)}>
              <Plus className="size-4" /> Novo colaborador
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className={`hidden ${grade} gap-3 border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid`}>
            <span>Colaborador</span>
            <span>Cargo</span>
            <span>Setor / Célula</span>
            <span>Admissão</span>
            <span>Progresso</span>
            <span>Vínculos</span>
            <span />
          </div>
          <ul className="divide-y">
            {lista.map((c) => {
              const m = metricas(c.id);
              const meus = vinculos.data?.[c.id] ?? [];
              return (
                <li key={c.id} className={`grid gap-3 px-5 py-4 lg:items-center ${grade}`}>
                  <div className="min-w-0">
                    <Link
                      to="/colaboradores/$id"
                      params={{ id: c.id }}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <UserRound className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{c.nome_completo}</span>
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">@{c.username}</p>
                  </div>
                  <span className="truncate text-sm">{c.cargo || "—"}</span>
                  <span className="truncate text-sm">
                    {c.setor || "—"}
                    {c.celula ? ` · ${c.celula}` : ""}
                  </span>
                  <span className="text-sm">{formatarData(c.data_admissao)}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${m.percentual}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {m.concluidas}/{m.total}
                    </span>
                  </div>
                  {isAdmin && <ResumoVinculos vinculos={meus} nomes={nomesUsuarios} />}
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "ativo" ? "default" : "secondary"}>
                      {c.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Gerenciar vínculos"
                        onClick={() => setVinculando({ id: c.id, nome_completo: c.nome_completo })}
                      >
                        <Link2 className="size-4" />
                      </Button>
                    )}
                    {podeGerenciarColaboradores && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir colaborador"
                        onClick={() => {
                          if (confirm(`Excluir ${c.nome_completo}?`)) excluir.mutate(c.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                </li>
              );
            })}
            {!colaboradores.isLoading && !lista.length && (
              <li className="px-5 py-12 text-center text-sm text-muted-foreground">
                Nenhum colaborador encontrado.
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {total} colaborador{total === 1 ? "" : "es"} · página {pagina + 1} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagina === 0 || colaboradores.isFetching}
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagina + 1 >= totalPaginas || colaboradores.isFetching}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>

        {isAdmin && <PainelVinculosGeral />}
      </div>

      <DialogVinculos
        colaborador={vinculando}
        vinculos={vinculando ? (vinculos.data?.[vinculando.id] ?? []) : []}
        onOpenChange={(aberto) => {
          if (!aberto) setVinculando(null);
        }}
      />



      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo colaborador</DialogTitle>
            <DialogDescription>
              O cadastro é único e será usado por todos os módulos da plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={form.nome_completo}
                onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                placeholder="nome.sobrenome"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="setor">Setor</Label>
              <Input
                id="setor"
                value={form.setor}
                onChange={(e) => setForm({ ...form, setor: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="celula">Célula</Label>
              <Input
                id="celula"
                value={form.celula}
                onChange={(e) => setForm({ ...form, celula: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="admissao">Data de admissão (opcional)</Label>
              <Input
                id="admissao"
                type="date"
                value={form.data_admissao ?? ""}
                onChange={(e) => setForm({ ...form, data_admissao: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as "ativo" | "inativo" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.nome_completo.trim() || criar.isPending}
              onClick={() => criar.mutate()}
            >
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlatformShell>
  );
}
