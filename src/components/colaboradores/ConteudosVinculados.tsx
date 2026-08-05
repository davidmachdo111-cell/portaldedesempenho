import { useQuery } from "@tanstack/react-query";
import { Download, Eye, FileText, Paperclip } from "lucide-react";
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
import { listarConteudosVinculados } from "@/lib/colaboradores/api";

/**
 * Personagens e simulados vinculados ao colaborador selecionado.
 * Disponível para Administrador, Avaliador e Auxiliar — todos com o mesmo
 * botão de download, que entrega exatamente o arquivo enviado no cadastro.
 */
export function ConteudosVinculados({ colaboradorId }: { colaboradorId: string }) {
  const conteudos = useQuery({
    queryKey: ["colaboradores", colaboradorId, "conteudos"],
    queryFn: () => listarConteudosVinculados(colaboradorId),
  });

  const itens = conteudos.data ?? [];

  async function acao(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível abrir o arquivo.");
    }
  }

  if (conteudos.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando conteúdos…</p>;
  }

  if (!itens.length) {
    return (
      <p className="rounded-xl border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
        Nenhum personagem ou simulado vinculado a este colaborador.
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
              {item.tipo === "simulado" ? "Simulado" : "Personagem"}
            </Badge>
          </CardHeader>
          <CardContent>
            {item.anexos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum arquivo anexado a este conteúdo.
              </p>
            ) : (
              <ul className="divide-y">
                {item.anexos.map((anexo) => (
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
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          {anexo.orientacoes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void acao(() => visualizarAnexo(anexo.path))}
                    >
                      <Eye className="size-4" /> Visualizar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void acao(() => baixarAnexo(anexo.path, anexo.nome))}
                    >
                      <Download className="size-4" /> Baixar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
