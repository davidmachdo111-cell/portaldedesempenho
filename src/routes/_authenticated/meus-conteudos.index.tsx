import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Eye, FileText, FolderOpen, Users } from "lucide-react";
import { toast } from "sonner";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeusConteudos } from "@/lib/meus-conteudos/api";
import {
  baixarAnexo,
  formatarTamanho,
  rotuloMomento,
  visualizarAnexo,
  type Anexo,
} from "@/lib/personas/anexos";

export const Route = createFileRoute("/_authenticated/meus-conteudos/")({
  head: () => ({
    meta: [
      { title: "Meus Conteúdos liberados — Portal de Desempenho" },
      {
        name: "description",
        content:
          "Veja os simulados e personagens liberados para você, baixe o material do simulado e acesse os anexos de cada personagem.",
      },
      { property: "og:title", content: "Meus Conteúdos liberados — Portal de Desempenho" },
      {
        property: "og:description",
        content: "Simulados, personagens e anexos atribuídos ao seu usuário.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeusConteudosPage,
});

function ListaAnexos({ anexos }: { anexos: Anexo[] }) {
  if (anexos.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum anexo disponível.</p>;
  }
  return (
    <ul className="space-y-2">
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
                <p className="mt-1.5 text-xs text-muted-foreground">Orientações: {a.orientacoes}</p>
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
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MeusConteudosPage() {
  const { data, isLoading } = useMeusConteudos();

  return (
    <PlatformShell
      title="Meus Conteúdos"
      subtitle="Simulados, personagens e anexos liberados para você"
    >
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : !data?.colaborador ? (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Nenhum cadastro vinculado</CardTitle>
            <CardDescription>
              Seu usuário ainda não está vinculado a um cadastro de colaborador. Procure o
              administrador da plataforma.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : data.simulados.length === 0 && data.personas.length === 0 ? (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Nenhum conteúdo liberado</CardTitle>
            <CardDescription>
              Assim que um simulado ou personagem for liberado para você, ele aparece aqui.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-8">
          {data.simulados.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <FolderOpen className="size-4 text-muted-foreground" /> Simulados liberados
              </h2>
              <div className="grid gap-5 lg:grid-cols-2">
                {data.simulados.map((s) => (
                  <Card key={s.id} className="shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="text-base">{s.nome}</CardTitle>
                      <CardDescription>
                        {s.exercicio ?? "Simulado"} • {s.persona_ids.length} personagem(ns)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {s.observacoes && (
                        <p className="text-sm text-muted-foreground">{s.observacoes}</p>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link to="/meus-conteudos/simulado/$id" params={{ id: s.id }}>
                          <FileText className="size-4" /> Baixar simulado (PDF)
                        </Link>
                      </Button>
                      <div>
                        <p className="mb-2 text-sm font-medium">Anexos do simulado</p>
                        <ListaAnexos anexos={data.anexosPorSimulado[s.id] ?? []} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {data.personas.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Users className="size-4 text-muted-foreground" /> Personagens liberados
              </h2>
              <div className="grid gap-5 lg:grid-cols-2">
                {data.personas.map((p) => (
                  <Card key={p.id} className="shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="text-base">{p.nome}</CardTitle>
                      <CardDescription>
                        {[p.exercicio, p.vertente, p.complexidade].filter(Boolean).join(" • ") ||
                          "Personagem"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {p.objetivo && <p className="text-sm text-muted-foreground">{p.objetivo}</p>}
                      <div>
                        <p className="mb-2 text-sm font-medium">Material do personagem</p>
                        <ListaAnexos anexos={data.anexosPorPersona[p.id] ?? []} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PlatformShell>
  );
}
