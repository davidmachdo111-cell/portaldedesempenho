import { useState } from "react";
import { Download, Eye, Paperclip, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MOMENTOS,
  baixarAnexo,
  formatarTamanho,
  rotuloMomento,
  useAnexos,
  useAtualizarAnexo,
  useEnviarAnexo,
  useRemoverAnexo,
  visualizarAnexo,
  type MetaAnexo,
  type MomentoAnexo,
  type VinculoAnexo,
} from "@/lib/personas/anexos";

const META_INICIAL: MetaAnexo = {
  descricao: "",
  momento: "durante_atendimento",
  orientacoes: "",
};

/**
 * Gerencia os anexos de um personagem ou simulado.
 * Os anexos ficam sempre vinculados ao conteúdo informado em `vinculo`.
 */
export function AnexosManager({
  vinculo,
  somenteLeitura = false,
  aviso,
}: {
  vinculo?: VinculoAnexo | null;
  somenteLeitura?: boolean;
  aviso?: string;
}) {
  const habilitado = Boolean(vinculo?.id) && vinculo?.id !== "nova";
  const { data: anexos = [], isLoading } = useAnexos(vinculo);
  const enviar = useEnviarAnexo(vinculo);
  const atualizar = useAtualizarAnexo(vinculo);
  const remover = useRemoverAnexo(vinculo);

  const [meta, setMeta] = useState<MetaAnexo>(META_INICIAL);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<MetaAnexo>(META_INICIAL);

  if (!habilitado) {
    return (
      <p className="text-sm text-muted-foreground">
        {aviso ?? "Salve o cadastro para habilitar os anexos."}
      </p>
    );
  }

  function enviarArquivo() {
    if (!arquivo) {
      toast.error("Selecione um arquivo.");
      return;
    }
    enviar.mutate(
      { file: arquivo, meta },
      {
        onSuccess: () => {
          toast.success("Anexo adicionado.");
          setArquivo(null);
          setMeta(META_INICIAL);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-4">
      {!somenteLeitura && (
        <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand">
            <Paperclip className="size-4" />
            {arquivo ? arquivo.name : "Selecionar arquivo"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
          </label>
          <Input
            placeholder="Descrição do anexo"
            value={meta.descricao}
            onChange={(e) => setMeta((m) => ({ ...m, descricao: e.target.value }))}
          />
          <Select
            value={meta.momento}
            onValueChange={(v) => setMeta((m) => ({ ...m, momento: v as MomentoAnexo }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Quando utilizar" />
            </SelectTrigger>
            <SelectContent>
              {MOMENTOS.map((m) => (
                <SelectItem key={m.valor} value={m.valor}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            rows={2}
            placeholder="Orientações de uso (ex.: entregar ao avaliado após a abertura do atendimento)"
            value={meta.orientacoes}
            onChange={(e) => setMeta((m) => ({ ...m, orientacoes: e.target.value }))}
          />
          <Button size="sm" onClick={enviarArquivo} disabled={enviar.isPending}>
            {enviar.isPending ? "Enviando…" : "Adicionar anexo"}
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {isLoading && <li className="text-sm text-muted-foreground">Carregando anexos…</li>}
        {!isLoading && anexos.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum anexo cadastrado.</li>
        )}
        {anexos.map((a) => (
          <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.nome}</p>
                {a.descricao && <p className="text-muted-foreground">{a.descricao}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{rotuloMomento(a.momento)}</Badge>
                  {a.tamanho ? (
                    <span className="text-xs text-muted-foreground">
                      {formatarTamanho(a.tamanho)}
                    </span>
                  ) : null}
                </div>
                {a.orientacoes && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Orientações: {a.orientacoes}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Visualizar"
                  onClick={() => void visualizarAnexo(a.path).catch((e) => toast.error(e.message))}
                >
                  <Eye className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Baixar"
                  onClick={() =>
                    void baixarAnexo(a.path, a.nome).catch((e) => toast.error(e.message))
                  }
                >
                  <Download className="size-4" />
                </Button>
                {!somenteLeitura && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar informações"
                      onClick={() => {
                        setEditando(editando === a.id ? null : a.id);
                        setEdicao({
                          descricao: a.descricao,
                          momento: a.momento as MomentoAnexo,
                          orientacoes: a.orientacoes,
                        });
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remover"
                      onClick={() =>
                        remover.mutate(a, {
                          onSuccess: () => toast.success("Anexo removido."),
                          onError: (err) => toast.error(err.message),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {editando === a.id && !somenteLeitura && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <Input
                  placeholder="Descrição do anexo"
                  value={edicao.descricao}
                  onChange={(e) => setEdicao((m) => ({ ...m, descricao: e.target.value }))}
                />
                <Select
                  value={edicao.momento}
                  onValueChange={(v) => setEdicao((m) => ({ ...m, momento: v as MomentoAnexo }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOMENTOS.map((m) => (
                      <SelectItem key={m.valor} value={m.valor}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  rows={2}
                  placeholder="Orientações de uso"
                  value={edicao.orientacoes}
                  onChange={(e) => setEdicao((m) => ({ ...m, orientacoes: e.target.value }))}
                />
                <Button
                  size="sm"
                  disabled={atualizar.isPending}
                  onClick={() =>
                    atualizar.mutate(
                      { id: a.id, meta: edicao },
                      {
                        onSuccess: () => {
                          toast.success("Anexo atualizado.");
                          setEditando(null);
                        },
                        onError: (err) => toast.error(err.message),
                      },
                    )
                  }
                >
                  Salvar alterações
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
