import {
  type Avaliacao,
  chave,
  classificacao,
  indiceCriterio,
  mediaGeral,
  notaExercicio,
} from "./avaliacao";

export type ModoCampo = "obrigatorio" | "opcional" | "oculto";

export interface ContextoRelatorio {
  checklistNome: string;
  avaliadorNome: string;
  status: "rascunho" | "concluida";
  percentual: number;
  notaMinima?: number;
  mostrarFortes?: boolean;
  mostrarDesenvolvimento?: boolean;
}

function baixar(conteudo: string, nome: string, tipo: string) {
  const blob = new Blob(["\ufeff", conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const dataBR = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return d ? `${d}/${m}/${a}` : iso;
};

export function exportarExcel(a: Avaliacao, ctx?: Partial<ContextoRelatorio>) {
  const head = ["Critério", "Peso", ...a.exercicios.map((e) => e.nome)];
  const linhas = a.criterios.map((c) => [
    c.nome,
    String(c.peso),
    ...a.exercicios.map((e) => (a.marcados[chave(e.id, c.id)] ? "X" : "")),
  ]);
  const notas = ["Nota (%)", "", ...a.exercicios.map((e) => notaExercicio(a, e.id).toFixed(1))];

  const obs = a.exercicios.flatMap((e) => {
    const o = a.observacoes[e.id];
    if (!o || (!o.positivos && !o.melhorias && !o.feedback)) return [];
    return [[e.nome, o.positivos, o.melhorias, o.feedback]];
  });

  const html = `<html><head><meta charset="utf-8"></head><body>
<table border="1">
<tr><th colspan="2">${esc(ctx?.checklistNome ?? "Avaliação de Desempenho")}</th></tr>
<tr><td>Colaborador avaliado</td><td>${esc(a.colaborador)}</td></tr>
<tr><td>Avaliador</td><td>${esc(ctx?.avaliadorNome ?? a.tutor)}</td></tr>
<tr><td>Setor</td><td>${esc(a.setor)}</td></tr>
<tr><td>Início</td><td>${dataBR(a.dataInicio)}</td></tr>
<tr><td>Avaliação</td><td>${dataBR(a.dataAvaliacao)}</td></tr>
<tr><td>Status</td><td>${ctx?.status === "concluida" ? "Concluída" : "Em preenchimento"}</td></tr>
<tr><td>Conclusão</td><td>${(ctx?.percentual ?? 0).toFixed(0)}%</td></tr>
<tr><td>Média Geral</td><td>${mediaGeral(a).toFixed(1)}% - ${classificacao(mediaGeral(a))}</td></tr>
</table><br/>
<table border="1">
<tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>
${linhas.map((l) => `<tr>${l.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}
<tr>${notas.map((v) => `<th>${esc(v)}</th>`).join("")}</tr>
</table><br/>
<table border="1">
<tr><th>Exercício</th><th>Pontos positivos</th><th>Oportunidades de melhoria</th><th>Feedback</th></tr>
${obs.map((l) => `<tr>${l.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}
</table></body></html>`;

  baixar(html, `avaliacao-${a.colaborador || "colaborador"}.xls`, "application/vnd.ms-excel");
}

export function exportarPDF(a: Avaliacao, ctx?: Partial<ContextoRelatorio>) {
  const media = mediaGeral(a);
  const concluida = ctx?.status === "concluida";
  const percentual = ctx?.percentual ?? 0;
  const mostrarFortes = ctx?.mostrarFortes !== false;
  const mostrarDesenv = ctx?.mostrarDesenvolvimento !== false;

  const ordenados = [...a.criterios].sort(
    (x, y) => indiceCriterio(a, y.id) - indiceCriterio(a, x.id),
  );
  const fortes = ordenados.slice(0, 3);
  const fracos = [...ordenados].reverse().slice(0, 3);

  const totalItens = a.criterios.length * a.exercicios.length;
  const feitos = Object.values(a.marcados).filter(Boolean).length;

  const linhaMeta = (rot: string, val: string) =>
    `<div class="meta-item"><span>${rot}</span><strong>${esc(val)}</strong></div>`;

  const bloco = (titulo: string, itens: typeof fortes, tom: string) => `
<section class="bloco">
  <h2>${titulo}</h2>
  <table class="lista">
    ${
      itens.length
        ? itens
            .map(
              (c) =>
                `<tr><td>${esc(c.nome)}</td><td class="num ${tom}">${indiceCriterio(a, c.id).toFixed(0)}%</td></tr>`,
            )
            .join("")
        : `<tr><td colspan="2" class="vazio">Sem dados suficientes.</td></tr>`
    }
  </table>
</section>`;

  const observacoes = a.exercicios
    .map((e) => {
      const o = a.observacoes[e.id];
      if (!o || (!o.positivos && !o.melhorias && !o.feedback)) return "";
      return `<div class="obs"><h3>${esc(e.nome)}</h3>
      <p><b>Pontos positivos:</b> ${esc(o.positivos || "—")}</p>
      <p><b>Oportunidades de melhoria:</b> ${esc(o.melhorias || "—")}</p>
      <p><b>Feedback:</b> ${esc(o.feedback || "—")}</p></div>`;
    })
    .join("");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(ctx?.checklistNome ?? "Checklist de Conhecimento")} — ${esc(a.colaborador || "Colaborador")}</title>
<style>
 @page { size: A4; margin: 16mm 14mm 18mm; }
 * { box-sizing: border-box; }
 body { font-family: Inter, "Segoe UI", Arial, sans-serif; color:#2F3E3A; font-size:11pt; margin:0; line-height:1.45; }
 header.capa { border-bottom:3px solid #008C50; padding-bottom:12px; margin-bottom:16px; }
 header.capa .kicker { font-size:8.5pt; letter-spacing:.16em; text-transform:uppercase; color:#76777A; margin:0; }
 header.capa h1 { font-size:19pt; color:#00594E; margin:4px 0 2px; }
 header.capa .sub { font-size:10pt; color:#3C786E; margin:0; }
 .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:8px 18px; margin:14px 0 6px; }
 .meta-item span { display:block; font-size:7.5pt; text-transform:uppercase; letter-spacing:.08em; color:#76777A; }
 .meta-item strong { font-size:10.5pt; color:#22312D; font-weight:600; }
 .resumo { display:flex; gap:10px; margin:14px 0 4px; }
 .kpi { flex:1; border:1px solid #DCE7E2; border-radius:10px; padding:10px 12px; }
 .kpi.destaque { background:#008C50; border-color:#008C50; color:#fff; }
 .kpi span { display:block; font-size:8pt; text-transform:uppercase; letter-spacing:.08em; opacity:.8; }
 .kpi b { font-size:17pt; display:block; line-height:1.2; }
 .kpi small { font-size:8.5pt; }
 h2 { font-size:11.5pt; color:#00594E; margin:20px 0 6px; padding-bottom:4px; border-bottom:1px solid #DCE7E2; }
 table { width:100%; border-collapse:collapse; font-size:9.5pt; }
 th, td { text-align:left; padding:6px 8px; border-bottom:1px solid #E6EDE9; vertical-align:top; }
 thead th { background:#F2F7F4; color:#00594E; font-size:8.5pt; text-transform:uppercase; letter-spacing:.05em; }
 tbody tr:nth-child(even) { background:#FAFCFB; }
 td.centro, th.centro { text-align:center; }
 .marc { color:#008C50; font-weight:700; }
 .naomarc { color:#B9C4BF; }
 tfoot th { background:#F2F7F4; color:#00594E; }
 .lista td.num { text-align:right; font-weight:700; width:70px; }
 .num.bom { color:#008C50; } .num.atencao { color:#B26A00; }
 .vazio { color:#76777A; font-style:italic; }
 .obs { border:1px solid #DCE7E2; border-radius:8px; padding:9px 11px; margin-top:8px; font-size:9.5pt; break-inside:avoid; }
 .obs h3 { margin:0 0 4px; color:#00594E; font-size:10pt; }
 .obs p { margin:3px 0; }
 .bloco { break-inside:avoid; }
 footer { margin-top:22px; border-top:1px solid #DCE7E2; padding-top:8px; font-size:8pt; color:#76777A; display:flex; justify-content:space-between; }
 @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
<header class="capa">
  <p class="kicker">Checklist de Conhecimento</p>
  <h1>${esc(ctx?.checklistNome ?? "Relatório de Avaliação")}</h1>
  <p class="sub">Relatório de acompanhamento de desempenho em treinamento</p>
</header>

<div class="meta">
  ${linhaMeta("Colaborador avaliado", a.colaborador || "—")}
  ${linhaMeta("Avaliador", ctx?.avaliadorNome || a.tutor || "—")}
  ${linhaMeta("Setor", a.setor || "—")}
  ${linhaMeta("Data de início", dataBR(a.dataInicio))}
  ${linhaMeta(concluida ? "Data de conclusão" : "Data da avaliação", dataBR(a.dataAvaliacao))}
  ${linhaMeta("Status", concluida ? "Concluído" : "Em preenchimento")}
</div>

<div class="resumo">
  <div class="kpi destaque"><span>Nota final</span><b>${media.toFixed(1)}%</b><small>${classificacao(media)}</small></div>
  <div class="kpi"><span>Conclusão</span><b>${percentual.toFixed(0)}%</b><small>${feitos} de ${totalItens} itens marcados</small></div>
  <div class="kpi"><span>Nota mínima</span><b>${(ctx?.notaMinima ?? 70).toFixed(0)}%</b><small>${media >= (ctx?.notaMinima ?? 70) ? "Atingida" : "Não atingida"}</small></div>
</div>

<h2>Critérios avaliados</h2>
<table>
 <thead><tr><th>Critério</th><th class="centro">Peso</th>${a.exercicios
   .map((e) => `<th class="centro">${esc(e.nome)}</th>`)
   .join("")}<th class="centro">Atingido</th></tr></thead>
 <tbody>
 ${a.criterios
   .map(
     (c) =>
       `<tr><td>${esc(c.nome)}</td><td class="centro">${c.peso}</td>${a.exercicios
         .map(
           (e) =>
             `<td class="centro">${a.marcados[chave(e.id, c.id)] ? '<span class="marc">✔</span>' : '<span class="naomarc">—</span>'}</td>`,
         )
         .join("")}<td class="centro">${indiceCriterio(a, c.id).toFixed(0)}%</td></tr>`,
   )
   .join("")}
 </tbody>
 <tfoot><tr><th>Nota por exercício</th><th></th>${a.exercicios
   .map((e) => `<th class="centro">${notaExercicio(a, e.id).toFixed(0)}%</th>`)
   .join("")}<th class="centro">${media.toFixed(0)}%</th></tr></tfoot>
</table>

${mostrarFortes ? bloco("Pontos fortes", fortes, "bom") : ""}
${mostrarDesenv ? bloco("Pontos de desenvolvimento", fracos, "atencao") : ""}

${observacoes ? `<h2>Observações por exercício</h2>${observacoes}` : ""}

<footer>
  <span>${esc(a.colaborador || "Colaborador")} · ${esc(ctx?.checklistNome ?? "Checklist")}</span>
  <span>Emitido em ${new Date().toLocaleDateString("pt-BR")}</span>
</footer>
<script>window.onload=()=>{window.print()}<\/script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
