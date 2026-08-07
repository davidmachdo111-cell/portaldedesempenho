import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Paperclip,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisualizadorArquivo } from "@/components/personas/VisualizadorArquivo";
import { RoteiroPersona } from "@/components/personas/RoteiroPersona";
import { usePersona } from "@/lib/personas/api";
import { baixarAnexo, formatarTamanho, rotuloMomento } from "@/lib/personas/anexos";
import type { AnexoVinculado, ConteudoVinculado, PersonaDoConteudo } from "@/lib/colaboradores/api";


/**
 * Fluxo dedicado de visualização de exercício dentro do módulo Colaboradores.
 * Tela nativa (sem gerar PDF) com retorno em cascata:
 * arquivo → persona → exercício → listagem do colaborador.
 * Somente leitura e download — nenhuma ação de edição é oferecida.
 */
export function VisualizarExercicio({
  item,
  onVoltar,
}: {
  item: ConteudoVinculado;
  onVoltar: () => void;
}) {
  const [persona, setPersona] = useState<PersonaDoConteudo | null>(null);
  const [arquivo, setArquivo] = useState<AnexoVinculado | null>(null);

  const personas = item.personas;

  if (arquivo) {
    return (
      <VisualizadorArquivo
        titulo={persona ? `${item.titulo} · ${persona.nome}` : item.titulo}
        arquivo={{ id: arquivo.id, nome: arquivo.nome, path: arquivo.path }}
        onVoltar={() => setArquivo(null)}
      />
    );
  }

  if (persona) {
    return (
      <DetalhePersona
        contexto={item.titulo}
        persona={persona}
        onVoltar={() => setPersona(null)}
        onAbrir={setArquivo}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Cabecalho
        voltar={onVoltar}
        titulo={item.titulo}
        subtitulo={item.detalhe}
        badge="Exercício"
      />

      {item.observacoes && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.observacoes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Personagens vinculados</CardTitle>
        </CardHeader>
        <CardContent>
          {!personas.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum personagem vinculado a este exercício.
            </p>
          ) : (
            <ul className="divide-y">
              {personas.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <User className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.detalhe} · {p.anexos.length} arquivo(s)
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPersona(p)}>
                    Abrir personagem <ChevronRight className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {item.anexos.length > 0 && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Arquivos do exercício</CardTitle>
          </CardHeader>
          <CardContent>
            <ListaArquivos anexos={item.anexos} onAbrir={setArquivo} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Cabecalho({
  voltar,
  titulo,
  subtitulo,
  badge,
}: {
  voltar: () => void;
  titulo: string;
  subtitulo: string;
  badge: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <Button variant="outline" size="sm" onClick={voltar}>
        <ArrowLeft className="size-4" /> Voltar
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{titulo}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
      </div>
      <Badge variant="secondary">{badge}</Badge>
    </div>
  );
}

function DetalhePersona({
  contexto,
  persona,
  onVoltar,
  onAbrir,
}: {
  contexto: string;
  persona: PersonaDoConteudo;
  onVoltar: () => void;
  onAbrir: (a: AnexoVinculado) => void;
}) {
  const roteiro = usePersona(persona.id);

  return (
    <div className="space-y-5">
      <Cabecalho
        voltar={onVoltar}
        titulo={persona.nome}
        subtitulo={contexto}
        badge="Personagem"
      />

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <CardTitle className="text-base">Roteiro completo do personagem</CardTitle>
        </CardHeader>
        <CardContent>
          {roteiro.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando roteiro…</p>
          ) : roteiro.data ? (
            <RoteiroPersona persona={roteiro.data} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Roteiro completo indisponível. Exibindo os dados cadastrais liberados.
              </p>
              {persona.dados.length > 0 && (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {persona.dados.map((d) => (
                    <div key={d.rotulo}>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                        {d.rotulo}
                      </dt>
                      <dd className="text-sm font-medium">{d.valor}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {persona.objetivo && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Objetivo</p>
                  <p className="whitespace-pre-wrap text-sm">{persona.objetivo}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center gap-2">
          <FileText className="size-4 text-primary" />
          <CardTitle className="text-base">PDFs e anexos do personagem</CardTitle>
        </CardHeader>
        <CardContent>
          <ListaArquivos anexos={persona.anexos} onAbrir={onAbrir} />
        </CardContent>
      </Card>
    </div>
  );
}


function ListaArquivos({
  anexos,
  onAbrir,
}: {
  anexos: AnexoVinculado[];
  onAbrir: (a: AnexoVinculado) => void;
}) {
  if (!anexos.length) {
    return <p className="text-sm text-muted-foreground">Nenhum arquivo disponível.</p>;
  }
  return (
    <ul className="divide-y">
      {anexos.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
          <Paperclip className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.nome}</p>
            <p className="text-xs text-muted-foreground">
              {rotuloMomento(a.momento)}
              {a.tamanho ? ` · ${formatarTamanho(a.tamanho)}` : ""}
            </p>
            {a.descricao && <p className="mt-1 text-xs text-muted-foreground">{a.descricao}</p>}
            {a.orientacoes && (
              <p className="mt-1 text-xs italic text-muted-foreground">{a.orientacoes}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => onAbrir(a)}>
            <Eye className="size-4" /> Visualizar
          </Button>
          <Button
            size="sm"
            onClick={() =>
              baixarAnexo(a.path, a.nome).catch(() =>
                toast.error("Não foi possível baixar o arquivo."),
              )
            }
          >
            <Download className="size-4" /> Baixar
          </Button>
        </li>
      ))}
    </ul>
  );
}
