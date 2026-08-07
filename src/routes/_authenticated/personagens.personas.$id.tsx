import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, History, Paperclip, Plus, Printer, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/personas/PersonasShell";
import { Campo, ListaPares, ListaTextos, SecaoFormulario } from "@/components/personas/FormBlocks";
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
import { AnexosManager } from "@/components/personas/AnexosManager";
import { enviarAnexosPendentes, type AnexoPendente } from "@/lib/personas/anexos";

import {
  useAcoesPersona,
  useCriarPerfil,
  useHistorico,
  usePerfisPersonalizados,
  usePersona,
  useSalvarPersona,
} from "@/lib/personas/api";

import {
  CAMPOS_TECNICOS_SUGERIDOS,
  COMPLEXIDADES,
  EXERCICIOS,
  PERFIS_PADRAO,
  VERTENTES,
  formatarData,
  personaVazia,
  type Persona,
} from "@/lib/personas/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/personagens/personas/$id")({
  head: () => ({
    meta: [
      { title: "Criar / Editar Persona | Portal de Desempenho" },
      {
        name: "description",
        content:
          "Cadastre identificação, classificação, dados técnicos, roteiro e materiais de apoio de uma persona de exercício.",
      },
      { property: "og:title", content: "Criar / Editar Persona" },
      {
        property: "og:description",
        content: "Formulário completo e totalmente editável de personas para exercícios.",
      },
    ],
  }),
  component: EditorPersona,
});

type Form = ReturnType<typeof personaVazia>;

function EditorPersona() {
  const { podeGerenciarPersonagens } = useAuth();
  const { id } = Route.useParams();
  const novo = id === "nova";
  const navigate = useNavigate();

  const { data: persona, isLoading } = usePersona(id);
  const salvar = useSalvarPersona();
  const { duplicar } = useAcoesPersona();
  const { data: perfisCustom = [] } = usePerfisPersonalizados();
  const criarPerfil = useCriarPerfil();
  const { data: historico = [] } = useHistorico(novo ? undefined : id, 20);

  const [form, setForm] = useState<Form>(personaVazia());
  const [novoPerfil, setNovoPerfil] = useState("");
  const [novaPalavra, setNovaPalavra] = useState("");
  const [pendentes, setPendentes] = useState<AnexoPendente[]>([]);
  const [enviandoAnexos, setEnviandoAnexos] = useState(false);

  useEffect(() => {
    if (persona) {
      const {
        id: _i,
        created_at: _c,
        updated_at: _u,
        created_by: _cb,
        updated_by: _ub,
        ...resto
      } = persona;
      setForm({ ...personaVazia(), ...(resto as Partial<Form>) } as Form);
    }
  }, [persona]);

  const set = <K extends keyof Form>(chave: K, valor: Form[K]) =>
    setForm((f) => ({ ...f, [chave]: valor }));

  const perfisDisponiveis = Array.from(new Set([...PERFIS_PADRAO, ...perfisCustom]));

  async function submeter() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da persona.");
      return;
    }
    try {
      const salva = await salvar.mutateAsync({
        ...(novo ? {} : { id }),
        values: form as Partial<Persona>,
      });

      // Cadastro em uma única etapa: os anexos escolhidos antes de salvar
      // são enviados imediatamente após a criação do personagem.
      if (pendentes.length) {
        setEnviandoAnexos(true);
        const { enviados, falhas } = await enviarAnexosPendentes(
          { tipo: "persona", id: salva.id },
          pendentes,
        );
        setEnviandoAnexos(false);
        setPendentes([]);
        if (enviados) toast.success(`${enviados} anexo(s) enviado(s).`);
        if (falhas.length) toast.error(`Falha em ${falhas.length} anexo(s): ${falhas[0]}`);
      }

      toast.success(novo ? "Persona criada com sucesso." : "Alterações salvas.");
      if (novo) navigate({ to: "/personagens/personas/$id", params: { id: salva.id } });
    } catch (err) {
      setEnviandoAnexos(false);
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  const salvando = salvar.isPending || enviandoAnexos;


  return (
    <AppShell
      titulo={novo ? "Criar Persona" : `Editar: ${form.nome || "persona"}`}
      descricao={
        novo
          ? "Todos os campos são editáveis a qualquer momento"
          : `Última alteração em ${formatarData(persona?.updated_at)}`
      }
      acoes={
        <>
          <Button variant="ghost" asChild>
            <Link to="/personagens/biblioteca">
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </Button>
          {!novo && persona && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  duplicar.mutate(persona, {
                    onSuccess: (nova) => {
                      toast.success("Persona duplicada.");
                      navigate({ to: "/personagens/personas/$id", params: { id: nova.id } });
                    },
                  })
                }
              >
                <Copy className="size-4" /> Duplicar
              </Button>
              <Button variant="outline" asChild>
                <Link to="/personagens/imprimir" search={{ ids: persona.id, nome: persona.nome }}>
                  <Printer className="size-4" /> PDF
                </Link>
              </Button>
            </>
          )}
          <Button onClick={submeter} disabled={salvando}>
            <Save className="size-4" />{" "}
            {salvando
              ? enviandoAnexos
                ? "Enviando anexos…"
                : "Salvando…"
              : novo && pendentes.length
                ? `Salvar com ${pendentes.length} anexo(s)`
                : "Salvar"}
          </Button>
        </>
      }
    >
      {isLoading && !novo ? (
        <p className="text-muted-foreground">Carregando persona…</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <SecaoFormulario titulo="Identificação">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Campo label="Nome da persona" className="sm:col-span-2">
                  <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
                </Campo>
                <Campo label="Idade">
                  <Input value={form.idade ?? ""} onChange={(e) => set("idade", e.target.value)} />
                </Campo>
                <Campo label="Sexo">
                  <Input value={form.sexo ?? ""} onChange={(e) => set("sexo", e.target.value)} />
                </Campo>
                <Campo label="Cidade">
                  <Input
                    value={form.cidade ?? ""}
                    onChange={(e) => set("cidade", e.target.value)}
                  />
                </Campo>
                <Campo label="Tipo de cliente">
                  <Input
                    value={form.tipo_cliente ?? ""}
                    onChange={(e) => set("tipo_cliente", e.target.value)}
                  />
                </Campo>
                <Campo label="Titular ou dependente">
                  <Select
                    value={form.titularidade ?? "Titular"}
                    onValueChange={(v) => set("titularidade", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Titular">Titular</SelectItem>
                      <SelectItem value="Dependente">Dependente</SelectItem>
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo label="Nome do dependente" className="sm:col-span-2">
                  <Input
                    value={form.nome_dependente ?? ""}
                    onChange={(e) => set("nome_dependente", e.target.value)}
                  />
                </Campo>
              </div>
            </SecaoFormulario>

            <SecaoFormulario titulo="Classificação">
              <div className="grid gap-4 sm:grid-cols-3">
                <Campo label="Exercício">
                  <Select value={form.exercicio ?? ""} onValueChange={(v) => set("exercicio", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXERCICIOS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo label="Vertente">
                  <Select value={form.vertente ?? ""} onValueChange={(v) => set("vertente", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {VERTENTES.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo label="Complexidade">
                  <Select
                    value={form.complexidade ?? ""}
                    onValueChange={(v) => set("complexidade", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLEXIDADES.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
              </div>
            </SecaoFormulario>

            <SecaoFormulario
              titulo="Objetivo e contexto"
              descricao="O contexto oculto é visível apenas para o auxiliar do exercício."
            >
              <div className="space-y-4">
                <Campo label="Objetivo da persona">
                  <Textarea
                    rows={3}
                    placeholder="Ex.: O cliente deseja realizar um agendamento antes da cirurgia."
                    value={form.objetivo ?? ""}
                    onChange={(e) => set("objetivo", e.target.value)}
                  />
                </Campo>
                <Campo label="Contexto oculto (uso exclusivo do auxiliar)">
                  <Textarea
                    rows={4}
                    value={form.contexto_oculto ?? ""}
                    onChange={(e) => set("contexto_oculto", e.target.value)}
                  />
                </Campo>
              </div>
            </SecaoFormulario>

            <SecaoFormulario
              titulo="Dados técnicos"
              descricao="Campos livres e opcionais — adicione apenas o que fizer sentido."
            >
              <ListaPares
                itens={(form.dados_tecnicos ?? []).map((d) => ({ a: d.label, b: d.valor }))}
                onChange={(v) =>
                  set(
                    "dados_tecnicos",
                    v.map((x) => ({ label: x.a, valor: x.b })),
                  )
                }
                labelA="Campo"
                labelB="Valor"
                rotuloAdicionar="Adicionar campo técnico"
                sugestoes={CAMPOS_TECNICOS_SUGERIDOS}
              />
            </SecaoFormulario>

            <SecaoFormulario
              titulo="Perfil comportamental"
              descricao="Selecione quantos perfis forem necessários ou cadastre novos."
            >
              <div className="flex flex-wrap gap-2">
                {perfisDisponiveis.map((p) => {
                  const ativo = form.perfil_comportamental.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        set(
                          "perfil_comportamental",
                          ativo
                            ? form.perfil_comportamental.filter((x) => x !== p)
                            : [...form.perfil_comportamental, p],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        ativo
                          ? "border-brand bg-brand text-primary-foreground"
                          : "border-border hover:border-brand hover:text-brand",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Novo perfil personalizado"
                  value={novoPerfil}
                  onChange={(e) => setNovoPerfil(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const nome = novoPerfil.trim();
                    if (!nome) return;
                    criarPerfil.mutate(nome);
                    set("perfil_comportamental", [...form.perfil_comportamental, nome]);
                    setNovoPerfil("");
                  }}
                >
                  <Plus className="size-4" /> Adicionar
                </Button>
              </div>
            </SecaoFormulario>

            <SecaoFormulario titulo="Roteiro do exercício">
              <div className="space-y-8">
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Fala inicial</h3>
                  <Textarea
                    rows={3}
                    value={form.fala_inicial ?? ""}
                    onChange={(e) => set("fala_inicial", e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    Informações reveladas apenas se o agente investigar
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Cadastre a pergunta esperada e a resposta da persona.
                  </p>
                  <ListaPares
                    itens={(form.informacoes_ocultas ?? []).map((i) => ({
                      a: i.pergunta,
                      b: i.resposta,
                    }))}
                    onChange={(v) =>
                      set(
                        "informacoes_ocultas",
                        v.map((x) => ({ pergunta: x.a, resposta: x.b })),
                      )
                    }
                    labelA="Pergunta esperada"
                    labelB="Resposta da persona"
                    rotuloAdicionar="Adicionar nova pergunta"
                    multilinha
                  />
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold">Falas gatilho</h3>
                  <ListaTextos
                    itens={form.falas_gatilho ?? []}
                    onChange={(v) => set("falas_gatilho", v)}
                    placeholder="Ex.: Tem certeza? Não existe outra opção?"
                    rotuloAdicionar="Adicionar fala gatilho"
                  />
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-semibold">Escalada</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Frases usadas quando o agente conduz o atendimento de forma inadequada.
                  </p>
                  <ListaTextos
                    itens={form.escalada ?? []}
                    onChange={(v) => set("escalada", v)}
                    placeholder="Ex.: Isso é um absurdo, quero falar com o supervisor."
                    rotuloAdicionar="Adicionar frase de escalada"
                  />
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold">Encerramento</h3>
                  <Textarea
                    rows={3}
                    placeholder="Como a persona finaliza o atendimento quando a situação é resolvida corretamente."
                    value={form.encerramento ?? ""}
                    onChange={(e) => set("encerramento", e.target.value)}
                  />
                </div>
              </div>
            </SecaoFormulario>
          </div>

          {/* Coluna lateral */}
          <aside className="space-y-6">
            <SecaoFormulario titulo="Palavras-chave" descricao="Usadas na pesquisa rápida.">
              <div className="mb-3 flex flex-wrap gap-2">
                {form.palavras_chave.map((p) => (
                  <Badge key={p} variant="secondary" className="gap-1">
                    {p}
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "palavras_chave",
                          form.palavras_chave.filter((x) => x !== p),
                        )
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                {form.palavras_chave.length === 0 && (
                  <span className="text-sm text-muted-foreground">Nenhuma palavra-chave.</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={novaPalavra}
                  placeholder="Nova palavra-chave"
                  onChange={(e) => setNovaPalavra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = novaPalavra.trim();
                      if (v && !form.palavras_chave.includes(v))
                        set("palavras_chave", [...form.palavras_chave, v]);
                      setNovaPalavra("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const v = novaPalavra.trim();
                    if (v && !form.palavras_chave.includes(v))
                      set("palavras_chave", [...form.palavras_chave, v]);
                    setNovaPalavra("");
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </SecaoFormulario>

            <SecaoFormulario titulo="Status">
              <div className="space-y-3">
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="arquivada">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--brand)]"
                    checked={form.favorita}
                    onChange={(e) => set("favorita", e.target.checked)}
                  />
                  Marcar como favorita
                </label>
              </div>
            </SecaoFormulario>

            <SecaoFormulario
              titulo="Anexos do personagem"
              descricao="PDFs, guias, imagens e capturas vinculados exclusivamente a este personagem, com descrição, momento e orientações de uso."
            >
              <AnexosManager
                vinculo={novo ? null : { tipo: "persona", id: id }}
                pendentes={pendentes}
                onPendentesChange={setPendentes}
              />

            </SecaoFormulario>

            {!novo && (
              <SecaoFormulario titulo="Histórico de alterações">
                <ul className="space-y-3">
                  {historico.length === 0 && (
                    <li className="text-sm text-muted-foreground">Sem alterações registradas.</li>
                  )}
                  {historico.map((h) => (
                    <li key={h.id} className="border-l-2 border-brand/40 pl-3">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        <History className="size-3.5 text-muted-foreground" /> {h.acao}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.user_nome ?? "Usuário"} • {formatarData(h.created_at)}
                      </p>
                      {Array.isArray((h.detalhes as { campos?: string[] })?.campos) &&
                        ((h.detalhes as { campos?: string[] }).campos?.length ?? 0) > 0 && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Campos: {(h.detalhes as { campos: string[] }).campos.join(", ")}
                          </p>
                        )}
                    </li>
                  ))}
                </ul>
              </SecaoFormulario>
            )}
          </aside>
        </div>
      )}
    </AppShell>
  );
}
