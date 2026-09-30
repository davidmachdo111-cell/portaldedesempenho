import type { RegistroAvaliacao, StatusAvaliacao } from "./avaliacoes";

export function validarConclusaoAvaliacao(registro: RegistroAvaliacao): string | null {
  if (!registro.colaborador_nome.trim()) return "Informe o nome do colaborador avaliado.";
  if (!registro.setor.trim()) return "Selecione o setor.";
  return null;
}

export function alternarMarcacaoAvaliacao(
  marcados: Record<string, boolean>,
  exId: string,
  critId: string,
) {
  const chave = `${exId}:${critId}`;
  const proximo = { ...marcados };
  if (proximo[chave]) delete proximo[chave];
  else proximo[chave] = true;
  return proximo;
}

export function registroComStatus(
  registro: RegistroAvaliacao,
  status: StatusAvaliacao,
): RegistroAvaliacao {
  return { ...registro, status };
}