# Matriz de critérios — proposta de refinamento

## Objetivo
Tornar a matriz legível e operável com 10, 15 ou mais exercícios, sem alterar o cadastro de critérios, os vínculos salvos, a avaliação ou os cálculos de notas. Esta etapa é apenas uma análise: nenhuma implementação será feita agora.

## Diagnóstico da tela atual
- A matriz está no editor do Checklist Mestre e compartilha os mesmos vínculos e o mesmo salvamento do modo **Por exercício**.
- A primeira coluna usa largura mínima, mas não fixa; a tabela usa `min-w-max` e colunas de exercício de largura variável. O scroll existe na própria matriz, porém sem limite vertical nem cabeçalho verticalmente fixo.
- Cada critério mostra `Peso N · usado em X` e linhas sem vínculo recebem fundo amarelo suave. A seleção de critério já fica em **Todos** e nas colunas de exercícios, não na célula do peso.
- Os números atuais são calculados a partir dos critérios, pesos e vínculos em memória, não são valores aleatórios. O custo de cálculo, porém, cresce porque cada célula verifica os vínculos por varredura do array e os totais são recalculados durante a renderização.

## Estrutura visual recomendada
```text
Busca por critério
┌──────────────────────┬────────┬─────────────┬─────────────┬─────────────┐
│ Seção / critério     │ Todos  │ Exercício A │ Exercício B │ Exercício C │ →
│ (coluna fixa)        │        │ 5 · 16 pts  │ 3 · 9 pts   │ 0 · 0 pts   │
│                      │        │     □       │     □       │     □       │
├──────────────────────┼────────┼─────────────┼─────────────┼─────────────┤
│ Seção: Atendimento   │   ◩    │      ◩      │      □      │      ☑      │
│ Critério com nome    │   ☑    │      ☑      │      □      │      ☑      │
│ em até 2–3 linhas   │        │             │             │             │
│ Peso 3               │        │             │             │             │
└──────────────────────┴────────┴─────────────┴─────────────┴─────────────┘
```

## Decisões de layout e interação
1. **Primeira coluna:** largura fixa em torno de 220–240 px, ajustável ao espaço disponível; nome do critério quebra naturalmente em até três linhas. Para nomes maiores, oferecer o texto completo no foco/hover, sem aumentar a largura da tabela. `Peso 3` fica abaixo do nome, em texto secundário simples, sem chip, borda ou aparência de ação. Remover inteiramente `usado em X`.
2. **Seleção:** a primeira coluna permanece apenas descritiva. Checkboxes aparecem somente em **Todos** e nas colunas de exercícios. A célula de seção em **Todos** seleciona os critérios daquela seção em todos os exercícios; a célula de seção de cada exercício seleciona aquela seção apenas naquele exercício. Cabeçalhos de exercícios continuam selecionando a coluna inteira. Estados parcial/total/vazio derivados dos vínculos reais; grupos vazios não exibem controle ativo.
3. **Rolagem:** limitar a largura do contêiner à área disponível e deixar a tabela ter a largura de suas colunas. Rolar horizontalmente apenas dentro da matriz; manter a coluna descritiva fixa à esquerda, inclusive nas linhas de seção. Dar ao mesmo contêiner uma altura máxima razoável para rolagem vertical interna e fixar o cabeçalho dos exercícios no topo. No canto superior esquerdo, cruzar os dois posicionamentos fixos com camadas e fundos opacos adequados. O cabeçalho deve permanecer legível quando nomes quebrarem linha.
4. **Densidade:** **Todos** estreita, colunas de exercícios com largura constante e compacta suficiente para nome, total e checkbox; nomes longos quebram em 2–3 linhas sem alargar uma coluna isolada. Divisórias finas e neutras, seção com ênfase tipográfica discreta; retirar o fundo amarelo de critérios sem vínculo. Eventual indicação de vínculo ausente deve ser neutra e não competir com a seleção.
5. **Totais:** no cabeçalho de cada exercício, contar os critérios distintos efetivamente vinculados e somar seus pesos atuais; `0 critérios · 0 pts` quando vazio. Totais globais não devem variar com a busca. Ao filtrar, a seleção de seção deve agir somente nos critérios visíveis, com rótulo acessível que diga “critérios exibidos”; manter os totais por exercício calculados sobre todos os critérios, e não sobre o resultado da busca.

## Cuidados técnicos para a implementação futura
- Usar uma única tabela semântica, com células de cabeçalho e associação de linhas/colunas para leitura por tecnologias assistivas. Dar nomes acessíveis específicos a cada checkbox e indicar seleção parcial no estado indeterminado.
- Construir um índice de vínculos por exercício/critério (`Set` ou `Map`) uma vez por atualização, em vez de percorrer todos os vínculos para cada célula. Derivar contagens, pesos e estados desse índice e dos critérios existentes; deduplicar pares ao calcular totais e evitar mutações duplicadas em seleções em massa.
- Manter largura estável via colunas com medidas explícitas; testar sticky em cruzamento, rolagem com teclado e foco visível, zoom do navegador, nomes longos, seções extensas e tema claro/escuro. Para dezenas de exercícios, a largura total da tabela ainda existirá, mas ficará confinada ao contêiner; considerar navegação entre colunas se a observação real mostrar necessidade, sem esconder exercícios por padrão.
- Validar 0, 1, 10 e 15+ exercícios; nenhuma/algumas/todas as seleções; filtro ativo; mudança de peso; alternância entre **Matriz** e **Por exercício**; salvar e reabrir. Confirmar que totais e checkboxes refletem os mesmos vínculos após reabrir, sem modificar avaliações históricas.
