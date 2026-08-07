import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Download, Eye, FileText, Paperclip, Printer } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  baixarAnexo,
  formatarTamanho,
  rotuloMomento,
  visualizarAnexo,
} from "@/lib/personas/anexos";
import { AcoesPdfPersona } from "@/components/personas/PdfPersonaAcoes";
import { pdfDosAnexos } from "@/lib/personas/pdf";
import {
  LABEL_STATUS_ATIVIDADE,
  listarConteudosVinculados,
  registrarAndamentoAtividade,
  type AnexoVinculado,
  type ConteudoVinculado,
  type StatusAtividade,
} from "@/lib/colaboradores/api";


const CORES_STATUS: Record<StatusAtividade, "secondary" | "outline" | "default"> = {
  pendente: "outline",
  em_andamento: "secondary",
  concluida: "default",
};

function formatarData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

async function acao(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Não foi possível abrir o arquivo.");
  }
}

function ListaAnexos({ anexos }: { anexos: AnexoVinculado[] }) {
  if (!anexos.length) {
    return <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p>;
  }
  return (
    <ul className="divide-y">
      {anexos.map((anexo) => (
        <li key={anexo.id} className="flex flex-wrap items-center gap-3 py-3">
          <Paperclip className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{anexo.nome}</p>
            <p className="text-xs text-muted-foreground">
              {rotuloMomento(anexo.momento)}
              {anexo.tamanho ? ` · ${formatarTamanho(anexo.tamanho)}` : ""}
            </p>
            {anexo.descricao && (
              <p className="mt-1 text-xs text-muted-foreground">{anexo.descricao}</p>
            )}
            {anexo.orientacoes && (
              <p className="mt-1 text-xs italic text-muted-foreground">{anexo.orientacoes}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void acao(() => visualizarAnexo(anexo.path))}
          >
            <Eye className="size-4" /> Visualizar
          </Button>
          <Button size="sm" onClick={() => void acao(() => baixarAnexo(anexo.path, anexo.nome))}>
            <Download className="size-4" /> Baixar
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Personagens e exercícios vinculados ao colaborador selecionado.
 * Disponível para Administrador, Avaliador e Auxiliar — todos com o mesmo
 * botão de download (entrega exatamente o arquivo enviado no cadastro) e com o
 * controle de conclusão do treinamento.
 */
export function ConteudosVinculados({ colaboradorId }: { colaboradorId: string }) {
  const qc = useQueryClient();
  const conteudos = useQuery({
    queryKey: ["colaboradores", colaboradorId, "conteudos"],
    queryFn: () => listarConteudosVinculados(colaboradorId),
  });

  const andamento = useMutation({
    mutationFn: ({ item, status }: { item: ConteudoVinculado; status: StatusAtividade }) =>
      registrarAndamentoAtividade(
        { id: item.atividadeId, colaborador_id: colaboradorId, titulo: item.titulo },
        status,
      ),
    onSuccess: () => {
      toast.success("Status do treinamento atualizado.");
      qc.invalidateQueries({ queryKey: ["colaboradores", colaboradorId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const itens = conteudos.data ?? [];

  if (conteudos.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando conteúdos…</p>;
  }

  if (!itens.length) {
    return (
      <p className="rounded-xl border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
        Nenhum personagem ou exercício vinculado a este colaborador.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {itens.map((item) => (
        <Card key={item.atividadeId} className="shadow-[var(--shadow-card)]">
          <CardHeader className="flex flex-row flex-wrap items-center gap-3">
            <FileText className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base">{item.titulo}</CardTitle>
              <p className="truncate text-xs text-muted-foreground">{item.detalhe}</p>
            </div>
            <Badge variant="secondary">
              {item.tipo === "simulado" ? "Exercício" : "Personagem"}
            </Badge>
            <Badge variant={CORES_STATUS[item.status]}>
              {LABEL_STATUS_ATIVIDADE[item.status]}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {item.tipo === "simulado" ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/meus-conteudos/exercicio/$id" params={{ id: item.refId }}>
                    <Printer className="size-4" /> Roteiro do exercício
                  </Link>
                </Button>
              ) : (
                <AcoesPdfPersona nome={item.titulo} pdf={pdfDosAnexos(item.anexos)} />
              )}

              {item.status !== "em_andamento" && item.status !== "concluida" && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={andamento.isPending}
                  onClick={() => andamento.mutate({ item, status: "em_andamento" })}
                >
                  <Clock className="size-4" /> Iniciar treinamento
                </Button>
              )}
              {item.status !== "concluida" ? (
                <Button
                  size="sm"
                  disabled={andamento.isPending}
                  onClick={() => andamento.mutate({ item, status: "concluida" })}
                >
                  <CheckCircle2 className="size-4" /> Marcar como concluído
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={andamento.isPending}
                  onClick={() => andamento.mutate({ item, status: "pendente" })}
                >
                  Reabrir
                </Button>
              )}
            </div>

            {item.status === "concluida" && (
              <p className="text-xs text-muted-foreground">
                Concluído em {formatarData(item.concluidaEm)}
                {item.concluidoPorNome ? ` por ${item.concluidoPorNome}` : ""}.
              </p>
            )}

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Anexos do {item.tipo === "simulado" ? "exercício" : "personagem"}
              </p>
              <ListaAnexos anexos={item.anexos} />
            </div>

            {item.personas.map((p) => (
              <div key={p.id} className="rounded-xl border border-dashed p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{p.nome}</p>
                  <Badge variant="outline">{p.detalhe}</Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/meus-conteudos/persona/$id" params={{ id: p.id }}>
                      <Printer className="size-4" /> PDF da persona
                    </Link>
                  </Button>
                </div>
                <ListaAnexos anexos={p.anexos} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
