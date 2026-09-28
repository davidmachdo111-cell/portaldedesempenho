import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Dumbbell, Search, UserRound, Users } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchPortal } from "@/lib/portal.functions";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useServerFn(searchPortal);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [term]);

  const results = useQuery({
    queryKey: ["portal-search", debounced],
    queryFn: () => search({ data: { term: debounced } }),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  const select = (type: "colaborador" | "persona" | "exercicio", id: string) => {
    setOpen(false);
    if (type === "colaborador") {
      void navigate({ to: "/colaboradores/$id", params: { id } });
    } else if (type === "persona") {
      void navigate({ to: "/personagens/personas/$id", params: { id }, search: { from: pathname } });
    } else {
      void navigate({ to: "/personagens/exercicio", search: { id } });
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Abrir busca global">
        <Search className="size-4" />
        <span className="hidden lg:inline">Buscar</span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground xl:inline">Ctrl K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput value={term} onValueChange={setTerm} placeholder="Buscar colaboradores, personas e exercícios…" />
        <CommandList>
          {debounced.length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Digite pelo menos dois caracteres.</div>
          ) : results.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Buscando…</div>
          ) : (
            <>
              <CommandEmpty>Nenhum resultado autorizado encontrado.</CommandEmpty>
              <CommandGroup heading="Resultados">
                {(results.data ?? []).map((item) => {
                  const Icon = item.type === "colaborador" ? UserRound : item.type === "persona" ? Users : Dumbbell;
                  return (
                    <CommandItem key={`${item.type}-${item.id}`} value={`${item.title} ${item.subtitle}`} onSelect={() => select(item.type, item.id)}>
                      <Icon className="size-4" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}