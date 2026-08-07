import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2, Users } from "lucide-react";

import { usersQueryOptions } from "@/lib/platform-queries";
import {
  desvincularResponsavel,
  listarResponsaveis,
  listarTodosVinculos,
  vincularResponsavel,
  type PapelResponsavel,
  type ResponsavelColaborador,
} from "@/lib/colaboradores/api";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LABEL_PAPEL: Record<PapelResponsavel, string> = {
  avaliador: "Avaliador",
  auxiliar: "Auxiliar",
};

function papelDoUsuario(roleKeys: string[]): PapelResponsavel | null {
  if (roleKeys.includes("avaliador")) return "avaliador";
  if (roleKeys.includes("auxiliar")) return "auxiliar";
  return null;
}

/** Usuários elegíveis a receber vínculos (avaliadores e auxiliares). */
export function useUsuariosVinculaveis() {
  const users = useQuery(usersQueryOptions);
  const itens = useMemo(
    () =>
      (users.data ?? [])
        .map((u) => ({
          id: u.id,
          nome: u.full_name || u.username,
          username: u.username,
          papel: papelDoUsuario(u.roleKeys ?? []),
          active: u.active,
        }))
        .filter((u): u is typeof u & { papel: PapelResponsavel } => u.papel !== null),
    [users.data],
  );
  return { itens, isLoading: users.isLoading };
}

/** Vínculos dos colaboradores visíveis na página atual. */
export function useVinculosDaPagina(ids: string[], habilitado: boolean) {
  return useQuery({
    queryKey: ["colaboradores", "responsaveis", ids],
    queryFn: () => listarResponsaveis(ids),
    enabled: habilitado && ids.length > 0,
  });
}

export function DialogVinculos({
  colaborador,
  vinculos,
  onOpenChange,
}: {
  colaborador: { id: string; nome_completo: string } | null;
  vinculos: ResponsavelColaborador[];
  onOpenChange: (aberto: boolean) => void;
}) {
  const qc = useQueryClient();
  const { itens, isLoading } = useUsuariosVinculaveis();

  const invalidar = () => qc.invalidateQueries({ queryKey: ["colaboradores"] });

  const vincular = useMutation({
    mutationFn: (u: { id: string; nome: string; papel: PapelResponsavel }) =>
      vincularResponsavel({
        colaborador_id: colaborador!.id,
        user_id: u.id,
        papel: u.papel,
        nome_usuario: u.nome,
      }),
    onSuccess: () => {
      toast.success("Vínculo criado.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const desvincular = useMutation({
    mutationFn: (v: { vinculo: ResponsavelColaborador; nome: string }) =>
      desvincularResponsavel(v.vinculo, v.nome),
    onSuccess: () => {
      toast.success("Vínculo removido.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const avaliadores = itens.filter((u) => u.papel === "avaliador");
  const auxiliares = itens.filter((u) => u.papel === "auxiliar");

  const linha = (u: (typeof itens)[number]) => {
    const atual = vinculos.find((v) => v.user_id === u.id && v.papel === u.papel);
    return (
      <li key={`${u.id}-${u.papel}`} className="flex items-center justify-between gap-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{u.nome}</p>
          <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
        </div>
        <Switch
          checked={Boolean(atual)}
          disabled={vincular.isPending || desvincular.isPending}
          onCheckedChange={(marcado) => {
            if (marcado) vincular.mutate({ id: u.id, nome: u.nome, papel: u.papel });
            else if (atual) desvincular.mutate({ vinculo: atual, nome: u.nome });
          }}
        />
      </li>
    );
  };

  return (
    <Dialog open={Boolean(colaborador)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vínculos de {colaborador?.nome_completo}</DialogTitle>
          <DialogDescription>
            Defina quais avaliadores e auxiliares acompanham este colaborador.
          </DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando usuários…</p>}
        <div className="space-y-5">
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avaliadores
            </h3>
            <ul className="divide-y rounded-lg border px-3">
              {avaliadores.map(linha)}
              {!avaliadores.length && (
                <li className="py-3 text-sm text-muted-foreground">Nenhum avaliador cadastrado.</li>
              )}
            </ul>
          </section>
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Auxiliares
            </h3>
            <ul className="divide-y rounded-lg border px-3">
              {auxiliares.map(linha)}
              {!auxiliares.length && (
                <li className="py-3 text-sm text-muted-foreground">Nenhum auxiliar cadastrado.</li>
              )}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Resumo dos vínculos de uma linha da listagem. */
export function ResumoVinculos({
  vinculos,
  nomes,
}: {
  vinculos: ResponsavelColaborador[];
  nomes: Record<string, string>;
}) {
  if (!vinculos.length) return <span className="text-xs text-muted-foreground">Sem vínculos</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {vinculos.map((v) => (
        <Badge key={v.id} variant="secondary" className="text-[11px]">
          {LABEL_PAPEL[v.papel]}: {nomes[v.user_id] ?? "usuário"}
        </Badge>
      ))}
    </div>
  );
}

/** Visão geral do administrador: todos os vínculos ativos. */
export function PainelVinculosGeral() {
  const { itens } = useUsuariosVinculaveis();
  const nomes = useMemo(
    () => Object.fromEntries(itens.map((u) => [u.id, u.nome])),
    [itens],
  );
  const vinculos = useQuery({
    queryKey: ["colaboradores", "vinculos", "todos"],
    queryFn: listarTodosVinculos,
  });

  const porUsuario = useMemo(() => {
    const mapa = new Map<string, { nome: string; papel: PapelResponsavel; colaboradores: string[] }>();
    for (const u of itens) mapa.set(u.id, { nome: u.nome, papel: u.papel, colaboradores: [] });
    for (const v of vinculos.data ?? []) {
      const alvo = mapa.get(v.user_id);
      if (alvo) alvo.colaboradores.push(v.colaborador_nome);
    }
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [itens, vinculos.data]);

  return (
    <div className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-5 py-3">
        <Users className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Vínculos ativos por usuário</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {vinculos.data?.length ?? 0} vínculo(s)
        </span>
      </header>
      <ul className="divide-y">
        {porUsuario.map((u) => (
          <li key={u.nome} className="grid gap-2 px-5 py-3 lg:grid-cols-[1fr_2fr] lg:items-center">
            <div className="flex items-center gap-2">
              <Link2 className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{u.nome}</span>
              <Badge variant="outline" className="text-[11px]">
                {LABEL_PAPEL[u.papel]}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {u.colaboradores.map((nome, i) => (
                <Badge key={`${nome}-${i}`} variant="secondary" className="text-[11px]">
                  {nome}
                </Badge>
              ))}
              {!u.colaboradores.length && (
                <span className="text-xs text-muted-foreground">Nenhum colaborador vinculado</span>
              )}
            </div>
          </li>
        ))}
        {!porUsuario.length && (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">
            Cadastre avaliadores ou auxiliares para criar vínculos.
          </li>
        )}
      </ul>
      {vinculos.isError && (
        <p className="px-5 py-3 text-xs text-destructive">Não foi possível carregar os vínculos.</p>
      )}
      <div className="px-5 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => vinculos.refetch()}
          disabled={vinculos.isFetching}
        >
          Atualizar
        </Button>
      </div>
    </div>
  );
}

export { LABEL_PAPEL };
