import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  desvincularExercicio,
  listarExerciciosDisponiveis,
  listarVinculosExercicios,
  vincularExercicio,
  type ExercicioDisponivel,
} from "@/lib/colaboradores/api";

/** Vínculos de exercícios dos colaboradores exibidos na página. */
export function useVinculosExercicios(colaboradorIds: string[], habilitado = true) {
  return useQuery({
    queryKey: ["colaboradores", "exercicios", "vinculos", colaboradorIds],
    queryFn: () => listarVinculosExercicios(colaboradorIds),
    enabled: habilitado && colaboradorIds.length > 0,
  });
}

/** Lista somente leitura dos exercícios vinculados, usada na listagem. */
export function ResumoExercicios({ nomes }: { nomes: string[] }) {
  if (!nomes.length) {
    return <span className="text-xs text-muted-foreground">Nenhum exercício</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {nomes.map((nome) => (
        <Badge key={nome} variant="outline" className="max-w-[12rem] truncate">
          {nome}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Gestão N:N entre colaborador e exercícios — exclusiva do administrador.
 * Vincular/desvincular altera apenas o vínculo: o exercício e seus personagens
 * continuam intactos e reutilizáveis.
 */
export function DialogExerciciosColaborador({
  colaborador,
  aberto,
  onFechar,
}: {
  colaborador: { id: string; nome_completo: string };
  aberto: boolean;
  onFechar: () => void;
}) {
  const qc = useQueryClient();

  const exercicios = useQuery({
    queryKey: ["exercicios", "disponiveis"],
    queryFn: listarExerciciosDisponiveis,
    enabled: aberto,
  });

  const vinculos = useQuery({
    queryKey: ["colaboradores", colaborador.id, "exercicios"],
    queryFn: () => listarVinculosExercicios([colaborador.id]),
    enabled: aberto,
  });

  const atuais = vinculos.data?.[colaborador.id] ?? [];

  const alternar = useMutation({
    mutationFn: async ({ item, ligar }: { item: ExercicioDisponivel; ligar: boolean }) => {
      if (ligar) await vincularExercicio(colaborador.id, item);
      else await desvincularExercicio(colaborador.id, item.id, item.nome);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      qc.invalidateQueries({ queryKey: ["exercicios"] });
      toast.success("Vínculos de exercícios atualizados.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lista = exercicios.data ?? [];

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exercícios de {colaborador.nome_completo}</DialogTitle>
          <DialogDescription>
            Ative os exercícios que este colaborador deve realizar. Desativar remove apenas o
            vínculo — o exercício e os personagens permanecem cadastrados.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {exercicios.isLoading && (
            <li className="text-sm text-muted-foreground">Carregando exercícios…</li>
          )}
          {!exercicios.isLoading && !lista.length && (
            <li className="text-sm text-muted-foreground">
              Nenhum exercício cadastrado no módulo Personagens e Exercícios.
            </li>
          )}
          {lista.map((item) => {
            const ligado = atuais.some((v) => v.simulacao_id === item.id);
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border p-3">
                <ClipboardList className="size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.detalhe}</p>
                </div>
                <Switch
                  checked={ligado}
                  disabled={alternar.isPending}
                  onCheckedChange={(v) => alternar.mutate({ item, ligar: v })}
                />
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
