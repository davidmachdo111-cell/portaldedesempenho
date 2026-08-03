import { Building2, CalendarDays, ShieldCheck, UserRound, CalendarCheck } from "lucide-react";
import type { Avaliacao } from "@/lib/checklists/avaliacao";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Setor } from "@/lib/checklists/setores";

const rotulo =
  "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const campo =
  "ghost-input w-full px-2.5 py-2 text-sm font-medium text-heading placeholder:font-normal placeholder:text-muted-foreground";

export function CabecalhoAvaliacao({
  avaliacao,
  setores,
  avaliadorNome,
  bloqueado = false,
  onChange,
}: {
  avaliacao: Avaliacao;
  setores: Setor[];
  avaliadorNome: string;
  bloqueado?: boolean;
  onChange: (patch: Partial<Avaliacao>) => void;
}) {
  const setorConhecido = setores.some((s) => s.nome === avaliacao.setor);

  return (
    <section className="surface p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="group flex min-w-0 flex-col gap-1.5">
          <span className={rotulo}>
            <UserRound className="h-3.5 w-3.5 shrink-0 text-primary" />
            Colaborador avaliado
          </span>
          <input
            type="text"
            placeholder="Nome do colaborador"
            disabled={bloqueado}
            value={avaliacao.colaborador}
            onChange={(e) => onChange({ colaborador: e.target.value })}
            className={campo}
          />
        </label>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={rotulo}>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Avaliador
          </span>
          <input
            type="text"
            readOnly
            disabled
            value={avaliadorNome || avaliacao.tutor || "—"}
            className={`${campo} cursor-not-allowed opacity-90`}
            title="Preenchido automaticamente com o avaliador responsável"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={rotulo}>
            <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            Setor
          </span>
          <Select
            value={avaliacao.setor || ""}
            disabled={bloqueado}
            onValueChange={(v) => onChange({ setor: v })}
          >
            <SelectTrigger className="h-[38px]">
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              {!setorConhecido && avaliacao.setor && (
                <SelectItem value={avaliacao.setor}>{avaliacao.setor}</SelectItem>
              )}
              {setores.map((s) => (
                <SelectItem key={s.id} value={s.nome}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="group flex min-w-0 flex-col gap-1.5">
          <span className={rotulo}>
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
            Data de início
          </span>
          <input
            type="date"
            disabled={bloqueado}
            value={avaliacao.dataInicio}
            onChange={(e) => onChange({ dataInicio: e.target.value })}
            className={campo}
          />
        </label>

        <label className="group flex min-w-0 flex-col gap-1.5">
          <span className={rotulo}>
            <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Data da avaliação
          </span>
          <input
            type="date"
            disabled={bloqueado}
            value={avaliacao.dataAvaliacao}
            onChange={(e) => onChange({ dataAvaliacao: e.target.value })}
            className={campo}
          />
        </label>
      </div>
    </section>
  );
}
