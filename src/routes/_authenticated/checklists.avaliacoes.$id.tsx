import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Eye, FileDown, Pencil, Save, Sheet as SheetIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/checklists/ChecklistsShell";
import { CabecalhoAvaliacao } from "@/components/checklists/avaliacao/CabecalhoAvaliacao";
import { MatrizPreenchimento } from "@/components/checklists/avaliacao/MatrizPreenchimento";
import { PainelObservacoes } from "@/components/checklists/avaliacao/PainelObservacoes";
import { PainelResultados } from "@/components/checklists/avaliacao/PainelResultados";
import {
  mediaGeral,
  totalMarcaveis,
  type Avaliacao,
  type Observacao,
} from "@/lib/checklists/avaliacao";
import { listarSetoresAtivos } from "@/lib/checklists/setores";
import { useAuth } from "@/hooks/useAuth";
import {
  carregarAvaliacao,
  observacaoVazia,
  paraAvaliacao,
  salvarAvaliacao,
  type RegistroAvaliacao,
} from "@/lib/checklists/avaliacoes";

export const Route = createFileRoute("/_authenticated/checklists/avaliacoes/$id")({
  component: PaginaPreenchimento,
});

function PaginaPreenchimento() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user, isAdmin, nome } = useAuth();
  const [registro, setRegistro] = useState<RegistroAvaliacao | null>(null);
  const [exAberto, setExAberto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [modoEdicaoAdmin, setModoEdicaoAdmin] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dados = useQuery({
    queryKey: ["avaliacao", id],
    queryFn: () => carregarAvaliacao(id),
  });
  const setores = useQuery({ queryKey: ["setores-ativos"], queryFn: listarSetoresAtivos });

  useEffect(() => {
    if (dados.data && !registro) setRegistro(dados.data.registro);
  }, [dados.data, registro]);

  const estrutura = dados.data?.estrutura;
  const checklist = estrutura?.checklist;

  const avaliacao: Avaliacao | null = useMemo(
    () => (registro && estrutura ? paraAvaliacao(registro, estrutura) : null),
    [registro, estrutura],
  );

  const persistir = useCallback(
    async (r: RegistroAvaliacao, est = estrutura) => {
      if (!est) return;
      setSalvando(true);
      try {
        await salvarAvaliacao({ ...r, media: mediaGeral(paraAvaliacao(r, est)) });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
      } finally {
        setSalvando(false);
      }
    },
    [estrutura],
  );

  const atualizar = (patch: Partial<RegistroAvaliacao>) => {
    setRegistro((atual) => {
      if (!atual) return atual;
      const novo = { ...atual, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void persistir(novo), 800);
      return novo;
    });
  };

  const proprio = !!registro && registro.avaliador_id === user?.id;
  const acompanhando = isAdmin && !proprio && !modoEdicaoAdmin;
  const bloqueado = registro?.status === "concluida" || acompanhando;

  // Preenche automaticamente o nome do avaliador responsável.
  useEffect(() => {
    if (registro && proprio && !registro.tutor && nome) atualizar({ tutor: nome });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registro?.id, proprio, nome]);

  if (dados.isLoading || !registro || !avaliacao) {
    return (
      <AdminShell titulo="Preenchimento" descricao="Carregando avaliação…">
        <div className="surface p-8 text-center text-sm text-muted-foreground">Carregando…</div>
      </AdminShell>
    );
  }

  const mostrarFortes = (checklist?.pontos_fortes_modo ?? "opcional") !== "oculto";
  const mostrarDesenv = (checklist?.pontos_desenvolvimento_modo ?? "opcional") !== "oculto";

  const totalItens = totalMarcaveis(avaliacao);
  const feitos = Object.values(registro.marcados).filter(Boolean).length;
  const percentual = totalItens ? (feitos / totalItens) * 100 : 0;
  const avaliadorNome = registro.tutor || (proprio ? nome : "");

  const ctxRelatorio = {
    checklistNome: checklist?.nome ?? "Checklist",
    avaliadorNome,
    status: registro.status,
    percentual,
    notaMinima: checklist?.nota_minima ?? 70,
    mostrarFortes,
    mostrarDesenvolvimento: mostrarDesenv,
  };

  const alternarMarcacao = (exId: string, critId: string) => {
    if (bloqueado) return;
    const chave = `${exId}:${critId}`;
    const marcados = { ...registro.marcados };
    if (marcados[chave]) delete marcados[chave];
    else marcados[chave] = true;
    atualizar({ marcados });
  };

  const definirObservacao = (exId: string, obs: Observacao) =>
    atualizar({ observacoes: { ...registro.observacoes, [exId]: obs } });

  const concluir = async () => {
    if (!registro.colaborador_nome.trim()) {
      toast.error("Informe o nome do colaborador avaliado.");
      return;
    }
    if (!registro.setor.trim()) {
      toast.error("Selecione o setor.");
      return;
    }
    const novo = { ...registro, status: "concluida" as const };
    setRegistro(novo);
    await persistir(novo);
    toast.success("Avaliação concluída.");
  };

  const reabrir = async () => {
    const novo = { ...registro, status: "rascunho" as const };
    setRegistro(novo);
    setModoEdicaoAdmin(true);
    await persistir(novo);
  };

  const podeEditar = proprio || isAdmin;

  const exportar = async (tipo: "excel" | "pdf") => {
    const modulo = await import("@/lib/checklists/exportar");
    if (tipo === "excel") modulo.exportarExcel(avaliacao, ctxRelatorio);
    else modulo.exportarPDF(avaliacao, ctxRelatorio);
  };

  return (
    <AdminShell
      titulo={
        acompanhando
          ? "Acompanhamento da avaliação"
          : registro.status === "concluida"
            ? "Avaliação concluída"
            : "Preenchimento da avaliação"
      }
      descricao={`${checklist?.nome ?? ""} · ${percentual.toFixed(0)}% concluído · média ${mediaGeral(avaliacao).toFixed(1)}%`}
      acoes={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void exportar("excel")}
          >
            <SheetIcon className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportar("pdf")}>
            <FileDown className="h-4 w-4" /> PDF
          </Button>
          {acompanhando && (
            <Button size="sm" variant="secondary" onClick={() => setModoEdicaoAdmin(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}
          {!acompanhando && registro.status === "concluida" && podeEditar && (
            <Button size="sm" variant="secondary" onClick={reabrir}>
              Reabrir
            </Button>
          )}
          {!bloqueado && (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={salvando}
                onClick={() => persistir(registro)}
              >
                <Save className="h-4 w-4" /> {salvando ? "Salvando…" : "Salvar"}
              </Button>
              <Button size="sm" onClick={concluir}>
                <CheckCircle2 className="h-4 w-4" /> Concluir
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              router.navigate({
                to: isAdmin && !proprio ? "/checklists/acompanhamento" : "/checklists/avaliacoes",
              })
            }
          >
            Voltar
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {acompanhando && (
          <div className="surface flex items-center gap-2 border-l-4 border-primary p-4 text-sm text-muted-foreground">
            <Eye className="h-4 w-4 shrink-0 text-primary" />
            Modo somente acompanhamento — clique em “Editar” para intervir no preenchimento.
          </div>
        )}

        <CabecalhoAvaliacao
          avaliacao={avaliacao}
          setores={setores.data ?? []}
          avaliadorNome={avaliadorNome}
          bloqueado={bloqueado}
          onChange={(patch) =>
            atualizar({
              ...(patch.colaborador !== undefined ? { colaborador_nome: patch.colaborador } : {}),
              ...(patch.setor !== undefined ? { setor: patch.setor } : {}),
              ...(patch.dataInicio !== undefined ? { data_inicio: patch.dataInicio } : {}),
              ...(patch.dataAvaliacao !== undefined ? { data_avaliacao: patch.dataAvaliacao } : {}),
            })
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <MatrizPreenchimento
            avaliacao={avaliacao}
            bloqueado={bloqueado}
            onToggle={alternarMarcacao}
            onAbrirObservacoes={setExAberto}
          />
          <PainelResultados
            avaliacao={avaliacao}
            onAbrirPainel={setExAberto}
            mostrarFortes={mostrarFortes}
            mostrarDesenvolvimento={mostrarDesenv}
          />
        </div>
      </div>

      <PainelObservacoes
        open={!!exAberto}
        onOpenChange={(v) => setExAberto(v ? exAberto : null)}
        titulo="Observações do exercício"
        subtitulo={avaliacao.exercicios.find((e) => e.id === exAberto)?.nome}
        valor={(exAberto && registro.observacoes[exAberto]) || observacaoVazia}
        onChange={(obs) =>
          exAberto &&
          definirObservacao(exAberto, {
            ...observacaoVazia,
            ...registro.observacoes[exAberto],
            ...obs,
          })
        }
      />
    </AdminShell>
  );
}
