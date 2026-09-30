type StatusAtividade = "pendente" | "em_andamento" | "concluida";
type AtividadeMinima = { status: StatusAtividade; tipo?: string; ref_id?: string | null };

export function dadosAndamentoAtividade(
  status: StatusAtividade,
  autor: { id: string | null; nome: string | null },
  agora = new Date(),
) {
  const concluida = status === "concluida";
  return {
    status,
    concluida_em: concluida ? agora.toISOString() : null,
    concluido_por: concluida ? autor.id : null,
    concluido_por_nome: concluida ? autor.nome : null,
  };
}

export function calcularProgresso(atividades: AtividadeMinima[]) {
  const total = atividades.length;
  const concluidas = atividades.filter((atividade) => atividade.status === "concluida").length;
  return {
    total,
    concluidas,
    pendentes: total - concluidas,
    percentual: total ? Math.round((concluidas / total) * 100) : 0,
  };
}

export function deveCriarAtividadeExercicio(
  atividades: Required<Pick<AtividadeMinima, "tipo" | "ref_id">>[],
  exercicioId: string,
) {
  return !atividades.some(
    (atividade) => atividade.tipo === "simulado" && atividade.ref_id === exercicioId,
  );
}