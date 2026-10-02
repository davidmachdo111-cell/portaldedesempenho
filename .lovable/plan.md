# Matriz de vínculos do Checklist Mestre

## Objetivo
Adicionar uma visão em matriz para vincular critérios aos exercícios com rapidez, preservando o editor atual e todas as regras de avaliação.

## Implementação
- Incluir dois modos na área de exercícios: **Matriz** e **Por exercício**.
- Na matriz, exibir critérios agrupados por seção nas linhas e exercícios nas colunas.
- Permitir marcar cada vínculo individualmente, uma seção inteira, um exercício inteiro ou um critério em todos os exercícios.
- Exibir por exercício a quantidade de critérios e a soma dos pesos vinculados.
- Manter busca de critérios e destacar exercícios ou critérios sem vínculos.
- Reutilizar o mesmo estado e salvamento existentes, sem alterar cálculos, avaliações históricas ou o fluxo do Avaliador.

## Validação
- Confirmar criação e remoção de vínculos nos dois modos.
- Confirmar que salvar e reabrir mantém a matriz.
- Executar os testes existentes e validar a tela em desktop.
