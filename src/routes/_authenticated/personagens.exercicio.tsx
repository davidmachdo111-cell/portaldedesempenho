import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Printer, Save, Shuffle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/personas/PersonasShell";
import { AnexosManager } from "@/components/personas/AnexosManager";
import { enviarAnexosPendentes, type AnexoPendente } from "@/lib/personas/anexos";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Campo, SecaoFormulario } from "@/components/personas/FormBlocks";
import {
  useExcluirSimulacao,
  usePersonas,
  useSalvarSimulacao,
  useSimulacoes,
} from "@/lib/personas/api";
import {
  COMPLEXIDADES,
  EXERCICIOS,
  QTD_POR_EXERCICIO,
  VERTENTES,
  formatarData,
} from "@/lib/personas/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/personagens/exercicio")({
  head: () => ({
    meta: [
      { title: "Montar Simulação | Portal de Desempenho" },
      {
        name: "description",
        content:
          "Selecione personas manualmente ou por sorteio automático, salve a simulação e gere o PDF profissional em A4.",
      },
      { property: "og:title", content: "Montar Simulação" },
      {
        property: "og:description",
        content: "Monte um treinamento completo em menos de dois minutos.",
      },
    ],
  }),
  component: MontarSimulacao,
});

const TODOS = "__todos__";

function MontarSimulacao() {
  const navigate = useNavigate();
  const { nome: usuario } = useAuth();
  const { data: personas = [] } = usePersonas();
  const { data: simulacoes = [] } = useSimulacoes();
  const salvar = useSalvarSimulacao();
  const excluir = useExcluirSimulacao();

  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [exercicio, setExercicio] = useState(TODOS);
  const [vertente, setVertente] = useState(TODOS);
  const [complexidade, setComplexidade] = useState(TODOS);
  const [status, setStatus] = useState("ativa");
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [simulacaoId, setSimulacaoId] = useState<string | undefined>();
  const [pendentes, setPendentes] = useState<AnexoPendente[]>([]);
  const [enviandoAnexos, setEnviandoAnexos] = useState(false);


  const filtradas = useMemo(
    () =>
      personas.filter((p) => {
        if (exercicio !== TODOS && p.exercicio !== exercicio) return false;
        if (vertente !== TODOS && p.vertente !== vertente) return false;
        if (complexidade !== TODOS && p.complexidade !== complexidade) return false;
        if (status !== TODOS && p.status !== status) return false;
        if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
        return true;
      }),
    [personas, exercicio, vertente, complexidade, status, busca],
  );

  const quantidadeSugerida = exercicio !== TODOS ? (QTD_POR_EXERCICIO[exercicio] ?? 1) : 1;

  function sortear() {
    const pool = [...filtradas];
    if (pool.length === 0) {
      toast.error("Nenhuma persona atende aos filtros aplicados.");
      return;
    }
    const escolhidas: string[] = [];
    const alvo = Math.min(quantidadeSugerida, pool.length);
    while (escolhidas.length < alvo) {
      const idx = Math.floor(Math.random() * pool.length);
      escolhidas.push(pool.splice(idx, 1)[0]!.id);
    }
    setSelecionadas(escolhidas);
    toast.success(`${escolhidas.length} persona(s) sorteada(s).`);
  }

  function abrirPdf() {
    if (selecionadas.length === 0) {
      toast.error("Selecione ao menos uma persona.");
      return;
    }
    navigate({
      to: "/personagens/imprimir",
      search: {
        ids: selecionadas.join(","),
        nome: nome || "Simulação",
        ...(exercicio !== TODOS ? { exercicio } : {}),
        responsavel: responsavel || usuario,
      },
    });
  }

  async function salvarSimulacao() {
    if (selecionadas.length === 0) {
      toast.error("Selecione ao menos uma persona.");
      return;
    }
    const values = {
      nome: nome || "Simulação sem título",
      exercicio: exercicio === TODOS ? null : exercicio,
      responsavel: responsavel || usuario,
      observacoes,
      persona_ids: selecionadas,
    };
    const salva = await salvar.mutateAsync(simulacaoId ? { id: simulacaoId, values } : { values });
    setSimulacaoId(salva.id);

    // Anexos escolhidos antes de salvar sobem junto, em uma única operação.
    if (pendentes.length) {
      setEnviandoAnexos(true);
      const { enviados, falhas } = await enviarAnexosPendentes(
        { tipo: "simulado", id: salva.id },
        pendentes,
      );
      setEnviandoAnexos(false);
      setPendentes([]);
      if (enviados) toast.success(`${enviados} anexo(s) enviado(s).`);
      if (falhas.length) toast.error(`Falha em ${falhas.length} anexo(s): ${falhas[0]}`);
    }

    toast.success("Simulação salva.");
  }


  function carregar(simId: string) {
    const s = simulacoes.find((x) => x.id === simId);
    if (!s) return;
    setSimulacaoId(s.id);
    setNome(s.nome);
    setResponsavel(s.responsavel ?? "");
    setObservacoes(s.observacoes ?? "");
    setExercicio(s.exercicio ?? TODOS);
    setSelecionadas(s.persona_ids ?? []);
    toast.success("Simulação carregada.");
  }

  async function duplicarSimulacao(simId: string) {
    const s = simulacoes.find((x) => x.id === simId);
    if (!s) return;
    await salvar.mutateAsync({
      values: {
        nome: `${s.nome} (cópia)`,
        exercicio: s.exercicio,
        responsavel: s.responsavel,
        observacoes: s.observacoes,
        persona_ids: s.persona_ids,
      },
    });
    toast.success("Simulação duplicada.");
  }

  return (
    <AppShell
      titulo="Montar Simulação"
      descricao="Selecione personas já cadastradas e gere o material de apoio"
      acoes={
        <>
          <Button
            variant="outline"
            onClick={salvarSimulacao}
            disabled={salvar.isPending || enviandoAnexos}
          >
            <Save className="size-4" />{" "}
            {enviandoAnexos
              ? "Enviando anexos…"
              : !simulacaoId && pendentes.length
                ? `Salvar com ${pendentes.length} anexo(s)`
                : "Salvar simulação"}
          </Button>

          <Button onClick={abrirPdf}>
            <Printer className="size-4" /> Gerar PDF
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <SecaoFormulario titulo="Dados da simulação">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nome da simulação">
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Turma 12 — Exercício 3"
                />
              </Campo>
              <Campo label="Responsável">
                <Input
                  value={responsavel}
                  placeholder={usuario}
                  onChange={(e) => setResponsavel(e.target.value)}
                />
              </Campo>
              <Campo label="Observações" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </Campo>
            </div>
          </SecaoFormulario>

          <SecaoFormulario
            titulo="Anexos do simulado"
            descricao="Arquivos de apoio vinculados exclusivamente a este simulado, com descrição, momento e orientações de uso."
          >
            <AnexosManager
              vinculo={simulacaoId ? { tipo: "simulado", id: simulacaoId } : null}
              pendentes={pendentes}
              onPendentesChange={setPendentes}
            />

          </SecaoFormulario>

          <SecaoFormulario
            titulo="Filtros e seleção"
            descricao={`A seleção aleatória respeita os filtros e escolhe ${quantidadeSugerida} persona(s) para ${exercicio === TODOS ? "o filtro atual" : exercicio}.`}
          >
            <div className="flex flex-wrap gap-3">
              <Select value={exercicio} onValueChange={setExercicio}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Exercício" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Exercício: todos</SelectItem>
                  {EXERCICIOS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={vertente} onValueChange={setVertente}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Vertente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Vertente: todas</SelectItem>
                  {VERTENTES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={complexidade} onValueChange={setComplexidade}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Complexidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Complexidade: todas</SelectItem>
                  {COMPLEXIDADES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="arquivada">Arquivadas</SelectItem>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="w-full sm:w-48"
                placeholder="Nome da persona"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <Button variant="secondary" onClick={sortear}>
                <Shuffle className="size-4" /> Seleção aleatória
              </Button>
            </div>

            <div className="mt-5 grid max-h-[520px] gap-2 overflow-y-auto pr-1">
              {filtradas.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma persona para estes filtros.</p>
              )}
              {filtradas.map((p) => {
                const ativo = selecionadas.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                      ativo ? "border-brand bg-brand/5" : "border-border hover:bg-muted/60",
                    )}
                  >
                    <Checkbox
                      checked={ativo}
                      onCheckedChange={() =>
                        setSelecionadas((s) =>
                          s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id],
                        )
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.nome}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[p.exercicio, p.vertente, p.complexidade].filter(Boolean).join(" • ")}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </SecaoFormulario>
        </div>

        <aside className="space-y-6">
          <SecaoFormulario titulo={`Selecionadas (${selecionadas.length})`}>
            <ul className="space-y-2">
              {selecionadas.length === 0 && (
                <li className="text-sm text-muted-foreground">Nenhuma persona selecionada.</li>
              )}
              {selecionadas.map((id) => {
                const p = personas.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <Link
                      to="/personagens/personas/$id"
                      params={{ id }}
                      className="min-w-0 flex-1 truncate hover:text-brand"
                    >
                      {p.nome}
                    </Link>
                    <button
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setSelecionadas((s) => s.filter((x) => x !== id))}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </SecaoFormulario>

          <SecaoFormulario titulo="Simulações salvas">
            <ul className="space-y-3">
              {simulacoes.length === 0 && (
                <li className="text-sm text-muted-foreground">Nenhuma simulação salva ainda.</li>
              )}
              {simulacoes.map((s) => (
                <li key={s.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.persona_ids.length} persona(s) • {formatarData(s.created_at)}
                      </p>
                    </div>
                    {s.exercicio && <Badge variant="secondary">{s.exercicio}</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" onClick={() => carregar(s.id)}>
                      Abrir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicarSimulacao(s.id)}>
                      <Copy className="size-4" /> Duplicar
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link
                        to="/personagens/imprimir"
                        search={{
                          ids: s.persona_ids.join(","),
                          nome: s.nome,
                          ...(s.exercicio ? { exercicio: s.exercicio } : {}),
                          ...(s.responsavel ? { responsavel: s.responsavel } : {}),
                        }}
                      >
                        <Printer className="size-4" /> PDF
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => excluir.mutate(s.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </SecaoFormulario>
        </aside>
      </div>
    </AppShell>
  );
}
