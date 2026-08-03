import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/checklists/ChecklistsShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  criarSetor,
  definirSetorAtivo,
  excluirSetor,
  listarSetores,
  renomearSetor,
} from "@/lib/checklists/setores";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/checklists/setores")({
  component: PaginaSetores,
  head: () => ({
    meta: [
      { title: "Setores | Checklist de Conhecimento" },
      {
        name: "description",
        content: "Cadastro e gestão dos setores usados no preenchimento dos checklists.",
      },
      { property: "og:title", content: "Setores | Checklist de Conhecimento" },
      {
        property: "og:description",
        content: "Cadastro e gestão dos setores usados no preenchimento dos checklists.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PaginaSetores() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [novo, setNovo] = useState("");

  const setores = useQuery({ queryKey: ["setores"], queryFn: listarSetores });
  const recarregar = () => {
    void qc.invalidateQueries({ queryKey: ["setores"] });
    void qc.invalidateQueries({ queryKey: ["setores-ativos"] });
  };

  const criar = useMutation({
    mutationFn: () => criarSetor(novo),
    onSuccess: () => {
      setNovo("");
      recarregar();
      toast.success("Setor criado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <AdminShell titulo="Setores" descricao="Acesso restrito">
        <div className="surface p-8 text-center text-sm text-muted-foreground">
          Apenas administradores podem gerenciar setores.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      titulo="Setores"
      descricao="Lista de setores disponíveis para os avaliadores no preenchimento."
    >
      <div className="space-y-6">
        <form
          className="surface flex flex-col gap-3 p-5 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (novo.trim()) criar.mutate();
          }}
        >
          <Input
            placeholder="Nome do setor"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
          />
          <Button type="submit" disabled={!novo.trim() || criar.isPending}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </form>

        <div className="surface divide-y divide-border">
          {(setores.data ?? []).map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <Input
                defaultValue={s.nome}
                className="max-w-xs"
                onBlur={async (e) => {
                  const valor = e.target.value.trim();
                  if (!valor || valor === s.nome) return;
                  await renomearSetor(s.id, valor);
                  recarregar();
                }}
              />
              <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={s.ativo}
                  onCheckedChange={async (v) => {
                    await definirSetorAtivo(s.id, v);
                    recarregar();
                  }}
                />
                {s.ativo ? "Ativo" : "Inativo"}
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await excluirSetor(s.id);
                    recarregar();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Falha ao excluir.");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!setores.isLoading && !(setores.data ?? []).length && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum setor cadastrado ainda.
            </p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
