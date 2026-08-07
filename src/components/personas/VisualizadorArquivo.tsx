import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { baixarAnexo, urlAnexo } from "@/lib/personas/anexos";

export type ArquivoVisualizavel = { id: string; nome: string; path: string };

const ehImagem = (nome: string) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(nome);

/**
 * Visualizador integrado de arquivos da persona (PDF ou imagem).
 * Sempre exibe "← Voltar" no topo, devolvendo o usuário à tela anterior
 * exata do fluxo (arquivo → persona → exercício → colaborador).
 */
export function VisualizadorArquivo({
  titulo,
  arquivo,
  onVoltar,
}: {
  titulo: string;
  arquivo: ArquivoVisualizavel;
  onVoltar: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    setUrl(null);
    setErro(false);
    urlAnexo(arquivo.path)
      .then((u) => ativo && setUrl(u))
      .catch(() => ativo && setErro(true));
    return () => {
      ativo = false;
    };
  }, [arquivo.path]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onVoltar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onVoltar]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="outline" size="sm" onClick={onVoltar}>
          <ArrowLeft className="size-4" /> Voltar
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{arquivo.nome}</p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            baixarAnexo(arquivo.path, arquivo.nome).catch(() =>
              toast.error("Não foi possível baixar o arquivo."),
            )
          }
        >
          <Download className="size-4" /> Baixar
        </Button>
      </header>

      <div className="flex-1 overflow-auto bg-muted/40">
        {erro ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Não foi possível abrir este arquivo.
          </p>
        ) : !url ? (
          <p className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando arquivo…
          </p>
        ) : ehImagem(arquivo.nome) ? (
          <div className="flex min-h-full items-start justify-center p-6">
            <img src={url} alt={arquivo.nome} className="max-w-full rounded-lg shadow-soft" />
          </div>
        ) : (
          <iframe
            title={arquivo.nome}
            src={`${url}#view=FitH&navpanes=1`}
            className="h-full w-full border-0"
          />
        )}
      </div>
    </div>
  );
}
