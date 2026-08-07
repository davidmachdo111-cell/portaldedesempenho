import { useEffect, useState } from "react";
import { ArrowLeft, Download, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { baixarAnexo, urlAnexo } from "@/lib/personas/anexos";
import type { PdfPersona } from "@/lib/personas/pdf";

/**
 * Visualizador de PDF integrado à aplicação.
 * Abre em sobreposição na própria tela — o botão "← Voltar" fecha o
 * visualizador e devolve o usuário exatamente ao contexto anterior
 * (colaborador > exercício > persona), sem recarregar a navegação.
 */
export function VisualizadorPdf({
  titulo,
  pdf,
  onVoltar,
}: {
  titulo: string;
  pdf: PdfPersona;
  onVoltar: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    setUrl(null);
    setErro(false);
    urlAnexo(pdf.path)
      .then((u) => ativo && setUrl(u))
      .catch(() => ativo && setErro(true));
    return () => {
      ativo = false;
    };
  }, [pdf.path]);

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
          <p className="truncate text-xs text-muted-foreground">{pdf.nome}</p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            baixarAnexo(pdf.path, pdf.nome).catch(() =>
              toast.error("Não foi possível baixar o PDF."),
            )
          }
        >
          <Download className="size-4" /> Baixar PDF
        </Button>
      </header>

      <div className="flex-1 overflow-hidden bg-muted/40">
        {erro ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Não foi possível abrir o PDF deste personagem.
          </p>
        ) : !url ? (
          <p className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando documento…
          </p>
        ) : (
          <iframe
            title={`PDF de ${titulo}`}
            src={`${url}#view=FitH&navpanes=1`}
            className="h-full w-full border-0"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Par de ações padrão do PDF da persona: visualizar sem baixar e baixar o
 * arquivo original. Disponível para todos os perfis que já enxergam a persona.
 */
export function AcoesPdfPersona({
  nome,
  pdf,
  size = "sm",
  compacto = false,
}: {
  nome: string;
  pdf?: PdfPersona | null | undefined;
  size?: "sm" | "default";
  compacto?: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  if (!pdf) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="size-3.5" /> Sem PDF cadastrado
      </span>
    );
  }

  return (
    <>
      <Button variant="outline" size={size} onClick={() => setAberto(true)}>
        <Eye className="size-4" /> {compacto ? "PDF" : "Visualizar PDF"}
      </Button>
      <Button
        variant="secondary"
        size={size}
        onClick={() =>
          baixarAnexo(pdf.path, pdf.nome).catch(() => toast.error("Não foi possível baixar o PDF."))
        }
      >
        <Download className="size-4" /> {compacto ? "Baixar" : "Baixar PDF"}
      </Button>
      {aberto && <VisualizadorPdf titulo={nome} pdf={pdf} onVoltar={() => setAberto(false)} />}
    </>
  );
}
