# Reestruturação completa da Matriz de critérios

## Objetivo
Transformar a matriz existente em uma área de trabalho limpa, previsível e confortável com 2, 10, 15, 24 ou mais exercícios. A alteração ficará restrita à apresentação e ao desempenho da matriz, preservando vínculos, salvamento, permissões, cálculos, histórico e o modo **Por exercício**.

## Diagnóstico da implementação atual
- A tabela já usa os vínculos corretos e compartilha o mesmo estado com **Por exercício**, mas cada célula procura vínculos por varredura do array, multiplicando o custo com muitos critérios e exercícios.
- Apenas **Seção / critério** está fixa horizontalmente. **Todos** ainda participa do fluxo móvel, causando risco de sobreposição durante a rolagem.
- O cabeçalho não está fixo verticalmente e o contêiner não limita a altura; por isso a barra horizontal fica disponível somente no fim da tabela.
- A primeira coluna tem apenas largura mínima e pode crescer. As colunas de exercício também não têm largura estrutural rígida.
- Critérios sem vínculos recebem fundo amarelo e exibem `usado em X`, contrariando a hierarquia visual desejada.
- A linha de seção mostra quantidade na coluna **Todos**, em vez do checkbox geral com estado vazio, marcado ou indeterminado.
- Não existe título próprio da matriz nem o resumo informativo `X critérios · Y exercícios` junto da busca.

## Estrutura visual recomendada
```text
Matriz de critérios                         16 critérios · 24 exercícios
[ Buscar critério                                                      ]

┌────────────────────────┬────────┬────────────┬────────────┬────────────┐
│ Seção / critério       │ Todos  │ Exercício 1│ Exercício 2│ Exercício 3│ →
│                        │        │7 crit.·29pt│5 crit.·18pt│0 crit.·0pt │
│                        │        │     ☑      │     ◩      │     □      │
├────────────────────────┼────────┼────────────┼────────────┼────────────┤
│ ATENDIMENTO            │   ◩    │     ☑      │     ◩      │     □      │
├────────────────────────┼────────┼────────────┼────────────┼────────────┤
│ Texto do critério em   │   ☑    │     ☑      │     □      │     ☑      │
│ duas ou três linhas    │        │            │            │            │
│ Peso 4                 │        │            │            │            │
└────────────────────────┴────────┴────────────┴────────────┴────────────┘
  área fixa opaca                    área horizontalmente navegável
```

## Implementação recomendada

### 1. Cabeçalho e informações da matriz
- Adicionar o título **Matriz de critérios**, a busca e o resumo real `X critérios · Y exercícios` em uma faixa compacta acima da tabela.
- Exibir sempre todos os exercícios cadastrados; não criar seletor, limite ou paginação de colunas.
- Manter o resumo global independente do filtro de busca.

### 2. Geometria estável das colunas
- Definir a tabela com medidas explícitas por `colgroup` ou estilos semânticos equivalentes.
- Usar primeira coluna controlada, em torno de 220–240 px dentro do espaço real disponível, com quebra natural em até três linhas e texto completo acessível no foco/hover.
- Fixar **Todos** em 72–84 px e cada exercício em aproximadamente 116–124 px.
- Calcular o `left` de **Todos** pela mesma variável de largura usada na primeira coluna. Assim, largura visual e deslocamento sticky serão idênticos, sem correções artificiais por `z-index`.

### 3. Rolagem e sticky combinados
- Confinar `overflow-x` e `overflow-y` ao mesmo contêiner da matriz, com largura máxima do espaço disponível e altura máxima baseada na janela.
- Fixar o cabeçalho no topo durante a rolagem vertical.
- Fixar **Seção / critério** à esquerda e **Todos** imediatamente após ela durante a rolagem horizontal.
- Tratar os cruzamentos do cabeçalho com as duas colunas fixas como células opacas de camada superior.
- Manter uma única barra horizontal acessível no rodapé visível do contêiner. Como a matriz terá rolagem vertical interna, essa barra permanece disponível sem exigir chegar ao último critério.
- Aplicar uma divisória ou sombra lateral muito sutil após **Todos**, deixando clara a transição entre área fixa e área móvel.

### 4. Hierarquia visual
- Remover completamente `usado em X` e manter apenas `Peso X` em texto secundário, sem chip, borda ou aparência de ação.
- Retirar o fundo amarelo de critérios sem vínculo; o checkbox será o indicador principal do estado.
- Usar fundo neutro discreto e tipografia mais firme nas linhas de seção, sem aparência de card.
- Aplicar hover leve nas linhas de critérios e divisórias finas, evitando grade pesada.
- Centralizar checkboxes apenas nas células **Todos** e exercícios. A coluna descritiva nunca terá seleção.
- Organizar o cabeçalho do exercício em três níveis: nome quebrável, total real e checkbox.

### 5. Seleções de grupo
- Na linha de seção, exibir checkbox também em **Todos**.
- Para cada exercício, o checkbox da seção representa somente os critérios visíveis daquela seção: vazio, marcado ou indeterminado.
- Em **Todos**, o checkbox da seção representa os critérios visíveis daquela seção em todos os exercícios.
- Ao clicar em estado parcial, completar a seleção; ao clicar em estado completo, limpar a seleção.
- Grupos sem critérios não aparecem e não expõem controle ativo.
- Manter labels específicos, como `Vincular critérios exibidos da seção Atendimento a Exercício 2`.

### 6. Dados reais e desempenho
- Construir uma vez por atualização um índice `Map<exercicioId, Set<criterioId>>`, deduplicando pares.
- Derivar desse índice: estado de cada célula, totais por exercício, soma de pesos e estados de seção.
- Criar também índices de critérios por ID e por seção, evitando filtros repetidos durante cada renderização.
- Calcular totais sobre todos os critérios, mesmo quando a busca estiver ativa; a busca afeta somente linhas visíveis e ações de seção sobre o conteúdo exibido.
- Preservar o array de vínculos esperado pelo salvamento atual e impedir duplicações em alterações individuais ou em massa.
- Separar a matriz em componentes pequenos e memoizados somente onde a medição mostrar ganho, sem introduzir virtualização que quebre tabela semântica ou sticky.

## Cuidados técnicos
- Usar uma única tabela semântica, com cabeçalhos de linha/coluna e associações adequadas para leitura assistiva.
- Preservar o componente Checkbox existente, incluindo `aria-checked="mixed"`, foco visível e operação por teclado.
- Garantir fundos sólidos nas células fixas em tema claro e escuro.
- Não criar chamadas adicionais ao backend; toda a interação continua no estado já carregado e usa o botão **Salvar** existente.
- Não alterar o modo **Por exercício**, o modelo de dados, as regras de avaliação, permissões, histórico ou outras áreas do editor.
- Não usar apenas sombra ou camada para esconder sobreposição: a correção depende de larguras compartilhadas, `left` exato e um único contêiner de rolagem.

## Validação obrigatória
- Conferir 2, 10, 15 e 24 exercícios, além de dezenas de critérios, nomes curtos e longos.
- Testar nenhuma, algumas e todas as seleções; seleção individual, por seção, por critério em todos e por exercício completo.
- Testar busca, seção sem resultado, totais globais durante filtro e ações apenas sobre critérios exibidos.
- Combinar rolagem vertical e horizontal, verificando cabeçalho, primeira coluna, **Todos**, fundos opacos e ausência de sobreposição.
- Confirmar que existe somente uma barra horizontal, sempre acessível dentro da matriz, e nenhum scroll horizontal na página.
- Alternar entre **Matriz** e **Por exercício**, salvar, reabrir e confirmar os mesmos vínculos e totais.
- Validar teclado, foco, estado indeterminado, zoom do navegador e temas claro/escuro.
- Medir interação com 24 exercícios para confirmar ausência de travamentos ou renderizações excessivas.

## Critério de conclusão
A entrega estará concluída quando a matriz exibir todos os exercícios automaticamente, mantiver as duas primeiras colunas e o cabeçalho fixos sem sobreposição, apresentar somente dados reais, continuar sincronizada com **Por exercício** e permanecer fluida e legível nos cenários de maior volume.
