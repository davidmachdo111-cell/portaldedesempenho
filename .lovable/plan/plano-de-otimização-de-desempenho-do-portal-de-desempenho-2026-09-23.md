# Plano de otimização de desempenho do Portal de Desempenho

## Resumo executivo

A lentidão atual não é causada por falta de capacidade do banco: ele está saudável, com uso moderado de memória (58%), poucas conexões (11/60), disco em 14% e apenas 13,9 MB de dados. A base também é pequena hoje (1 colaborador, 3 personas, 3 exercícios, 1 avaliação).

O principal gargalo confirmado é o excesso de viagens entre a tela e o banco, somado a consultas completas e dados carregados antes de serem necessários. Em navegações frias medidas no preview, as telas levaram aproximadamente de 2,3 a 5,1 segundos e fizeram de 6 a 14 requisições ao backend. Portanto, a prioridade é reduzir requisições, payload e bloqueios de navegação antes de considerar aumento de infraestrutura.

## Medições e evidências encontradas

| Tela | Tempo observado* | Requisições observadas | Evidência principal |
|---|---:|---:|---|
| Portal | 3,4 s | 5 | Perfil, funções, permissões e módulos carregados separadamente |
| Colaboradores | 2,8 s | 13 | Permissões/perfil repetidos, página, progresso, vínculos, nomes e visão geral |
| Personagens | 2,3 s | 8 | Todas as personas e todos os exercícios para montar indicadores no navegador |
| Checklists | 2,7 s | 14 | Categorias repetidas, listas completas de critérios e avaliações |
| Minhas avaliações | 2,4 s | 7 | Identidade/permissões mais duas listas completas |
| Acompanhamento | 5,1 s | 6 visíveis + função interna | Função busca todas as avaliações e tabelas auxiliares; filtros ficam no navegador |

\* Medições do preview autenticado, em navegação fria, úteis como linha de base relativa. Serão repetidas de forma controlada antes e depois de cada etapa.

Evidências adicionais:

- O banco está saudável; não há indicação de saturação de CPU, memória, disco ou conexões.
- Há 23 usos de consultas React Query e diversos `select("*")` em caminhos críticos.
- A consulta de perfis completos é a maior consumidora acumulada registrada: 471 chamadas, média de 13,69 ms e máximo de 76,54 ms no banco.
- Consultas de permissões e perfil aparecem repetidamente na navegação. A identidade atual exige até quatro consultas: perfil, funções, permissões diretas e permissões da função.
- O cache global já usa `staleTime` de 60 segundos, `gcTime` de 10 minutos e desativa atualização ao focar a janela. A base de cache existe; o problema está principalmente no desenho das consultas e nas invalidações amplas.
- Já existe paginação real em Colaboradores (20 itens, filtro e total no banco), mas consultas auxiliares e a visão geral administrativa ainda ampliam o carregamento.
- Já existem índices importantes nas tabelas de vínculos. Também foram encontrados índices duplicados em `colaborador_atividades`, que devem ser revisados antes de qualquer nova criação.

## Gargalos por área

### 1. Colaboradores

**Impacto: alto | Esforço: médio | Risco: baixo**

- A listagem principal já é paginada, porém dispara consultas separadas para progresso, vínculos, nomes dos responsáveis e, para o administrador, todos os vínculos da plataforma.
- A lista completa de usuários e suas permissões é carregada mesmo sem abrir o diálogo de vínculos.
- A visão geral de vínculos é carregada imediatamente, embora fique abaixo da listagem principal.
- No detalhe do colaborador, dados cadastrais, atividades, histórico e avaliações são carregados simultaneamente, mesmo que o usuário abra apenas uma aba.
- Conteúdos vinculados já são buscados somente na aba correspondente, mas a consulta retorna exercício, personas e todos os anexos juntos.
- Invalidações com a chave ampla `['colaboradores']` atualizam listas e detalhes que não necessariamente mudaram.

**Ganho esperado:** reduzir a listagem inicial para 3–5 requisições e carregar histórico, avaliações, catálogo, conteúdos e gestão de vínculos somente quando abertos.

### 2. Personagens e Exercícios

**Impacto: alto | Esforço: médio | Risco: médio**

- O painel consulta todas as colunas de todas as personas e todos os exercícios para calcular totais e gráficos no navegador.
- A Biblioteca baixa todas as personas, realiza busca e filtros no navegador e consulta PDFs para toda a lista filtrada.
- A Biblioteca renderiza todos os cards ou linhas de uma vez, sem paginação.
- A biblioteca de gráficos é importada diretamente no painel e aumenta o código necessário para abrir o módulo.
- Exercícios e personas usam `select("*")` em listagens onde apenas dados resumidos são exibidos.
- A sincronização da ordem das personas de um exercício executa uma atualização por persona.

**Ganho esperado:** payload proporcional a uma página, filtros rápidos mesmo com crescimento da base e carregamento dos gráficos/PDFs apenas quando necessários.

### 3. Checklists e Matriz de Avaliação

**Impacto: alto | Esforço: médio/alto | Risco: médio**

- A página inicial de Checklists carrega listas completas de checklists, avaliadores, categorias e avaliações apenas para exibir totais e poucos itens recentes.
- `listarChecklists` faz três consultas, sendo categorias consultadas novamente pela própria página; o total de critérios é calculado no navegador percorrendo a lista inteira.
- Avaliações são carregadas com `select("*")`, incluindo os objetos completos de marcações e observações, mesmo em listagens que exibem apenas nome, data, status e média.
- O acompanhamento busca todas as avaliações, todos os critérios e todos os exercícios; depois calcula e filtra tudo em memória.
- A estrutura de uma avaliação é carregada em cinco consultas sequenciais. As quatro partes dependentes apenas do ID do checklist podem ser paralelizadas ou consolidadas.
- O salvamento automático da matriz ocorre 800 ms após mudanças; mudanças contínuas podem gerar muitas gravações e há risco de gravações concorrentes fora de ordem.
- A matriz recalcula conversões, totais e médias durante renderizações; precisa de medição com uma matriz maior antes de decidir por memoização ou virtualização.

**Ganho esperado:** painel com consultas resumidas, acompanhamento paginado/filtrado no banco, avaliação abrindo com menos esperas e salvamento mais previsível.

### 4. Página inicial e permissões

**Impacto: alto | Esforço: médio | Risco: médio**

- A consulta do usuário atual realiza três buscas paralelas e uma quarta dependente para montar o acesso.
- Cada entrada em módulos protegidos ainda executa verificações adicionais de sessão e permissão.
- O histórico do banco confirma repetição elevada de consultas a perfis, funções e permissões.
- A página inicial busca módulos separadamente da identidade e permissões.

**Ganho esperado:** reduzir o custo fixo presente em praticamente toda navegação e evitar que o mesmo acesso seja validado várias vezes no cliente, mantendo a validação obrigatória no banco.

## Alterações recomendadas

### Etapa 0 — Baseline reproduzível

**Impacto: alto | Esforço: baixo | Risco: baixo**

1. Criar um roteiro de medição autenticada para Administrador, Avaliador e Auxiliar.
2. Medir navegação fria e navegação de retorno em cada tela prioritária.
3. Registrar tempo até o conteúdo útil, tempo total, requisições, bytes transferidos e linhas retornadas.
4. Criar dados de teste em volume representativo, sem alterar dados históricos: pelo menos 100 colaboradores, 100 personas, 30 exercícios e 500 avaliações em ambiente apropriado de teste.
5. Capturar planos de execução apenas das consultas que continuarem lentas após reduzir payload e quantidade de chamadas.

**Validação:** relatório “antes” versionado e repetível nas mesmas condições.

### Etapa 1 — Identidade, permissões e navegação

**Impacto: alto | Esforço: médio | Risco: médio**

1. Consolidar o carregamento do usuário atual em uma única função segura que retorne somente perfil, funções e permissões necessárias.
2. Reutilizar esse resultado nos menus, páginas e guardas, sem remover a proteção do backend.
3. Evitar validações duplicadas na mesma transição e preservar chaves de cache separadas por usuário/sessão.
4. Selecionar colunas explícitas de perfil e módulos.
5. Limpar todo o cache no logout, mantendo o comportamento atual.

**Arquivos/módulos envolvidos:** consultas da plataforma, autenticação, casca principal e guardas dos módulos.

**Validação:** Portal com no máximo 2 requisições de dados após a sessão estar disponível; troca entre módulos sem repetir o conjunto completo de permissões enquanto o cache estiver válido; testes com os três perfis.

### Etapa 2 — Colaboradores

**Impacto: alto | Esforço: médio | Risco: baixo**

1. Manter a paginação no banco e consolidar, em uma consulta resumida por página, progresso e nomes dos vínculos quando isso reduzir chamadas sem ampliar permissões.
2. Carregar usuários vinculáveis apenas ao abrir o diálogo administrativo.
3. Carregar a visão geral de vínculos sob demanda ou em bloco não crítico, sem bloquear a tabela.
4. Fazer cada aba do detalhe buscar seus dados somente quando selecionada: atividades como conteúdo inicial; histórico, avaliações e conteúdos sob demanda.
5. Separar conteúdo resumido de conteúdo completo: lista de exercícios primeiro; personas, roteiro e anexos apenas ao abrir o exercício/persona.
6. Substituir invalidações gerais por atualização otimista ou invalidação exata da página, resumo ou detalhe afetado.
7. Manter resultados anteriores durante paginação e prebuscar a página seguinte quando houver.

**Arquivos/módulos envolvidos:** listagem e detalhe de Colaboradores, API de colaboradores, vínculos e conteúdos vinculados.

**Validação:** primeira página em até 3–5 requisições de dados; nenhuma consulta de catálogo, histórico, avaliações ou anexos antes de abrir a respectiva área; retorno à lista sem nova busca se o cache estiver fresco.

### Etapa 3 — Personagens e Exercícios

**Impacto: alto | Esforço: médio | Risco: médio**

1. Criar consulta paginada de personas com busca, filtros, ordenação e total no banco.
2. Usar uma projeção resumida na Biblioteca; buscar roteiro e campos completos apenas na visualização/edição.
3. Buscar metadados de PDF somente para a página atual, mantendo arquivos pertencentes exclusivamente à Persona.
4. Substituir o painel calculado sobre todas as personas por agregações no banco: totais por status, exercício, vertente e complexidade, mais cinco personas recentes.
5. Carregar gráficos de forma assíncrona após os indicadores principais.
6. Paginar exercícios e selecionar apenas colunas necessárias nas listagens.
7. Trocar as atualizações individuais da ordem das personas por uma operação única/transacional, preservando a relação N:N e a distinção entre criar e editar.

**Arquivos/módulos envolvidos:** API de personas, Dashboard, Biblioteca, PDF, montagem de exercício e nova função de agregação.

**Validação:** Biblioteca transfere somente uma página; filtros não percorrem toda a coleção no navegador; painel não baixa roteiros completos; PDFs/anexos não são consultados fora dos itens visíveis ou abertos.

### Etapa 4 — Checklists, avaliações e acompanhamento

**Impacto: alto | Esforço: médio/alto | Risco: médio**

1. Criar uma consulta resumida para a Home com contagens, média e registros recentes, sem carregar avaliações completas.
2. Remover a leitura duplicada de categorias e calcular total de critérios no banco.
3. Criar listagens paginadas de avaliações com colunas resumidas; nunca trazer `marcados` e `observacoes` antes de abrir uma avaliação.
4. Mover filtros e paginação do Acompanhamento para a função protegida, incluindo total de resultados e opções de filtro necessárias.
5. Calcular progresso de avaliações sem buscar todas as linhas de critérios e exercícios a cada abertura da tela; preservar exatamente a fórmula atual de nota e os vínculos critério × exercício.
6. Carregar a estrutura do checklist em paralelo ou em uma resposta consolidada, sem alterar seu formato funcional.
7. Tornar o salvamento automático serializado/debounced, cancelando gravações obsoletas e mantendo um salvamento explícito antes de concluir ou sair.
8. Medir a Matriz com volume alto; aplicar memoização por exercício/critério. Virtualizar apenas se a medição comprovar ganho sem prejudicar teclado, impressão ou exportação.

**Arquivos/módulos envolvidos:** Home de Checklists, APIs de checklists e avaliações, acompanhamento protegido, tela de preenchimento e Matriz.

**Validação:** Home sem payload completo de avaliações; Acompanhamento retorna apenas uma página filtrada; abertura da avaliação reduz chamadas sequenciais; cálculos, notas, aprovação, impressão e exportações permanecem idênticos em testes de regressão.

### Etapa 5 — Índices e políticas de acesso

**Impacto: médio agora, alto com crescimento | Esforço: médio | Risco: médio**

1. Executar `EXPLAIN (ANALYZE, BUFFERS)` nas consultas paginadas e filtradas após definir seu formato final.
2. Adicionar somente índices comprovadamente usados, priorizando combinações como:
   - avaliações por avaliador/status/data e colaborador/data;
   - histórico por colaborador/data;
   - personas por status/data e campos realmente usados em filtros;
   - materiais por persona/data;
   - exercícios e estruturas por checklist/ordem.
3. Avaliar índice de busca textual/trigrama para pesquisa parcial em Colaboradores e Personas somente após medir com volume representativo.
4. Remover índices realmente duplicados apenas após confirmar dependências e planos de execução.
5. Revisar as funções de permissão para que permaneçam `security definer`, com `search_path` seguro e índices nos campos de vínculo.
6. Manter as políticas atuais como limite de acesso; qualquer função agregada ou consulta consolidada deve retornar somente linhas permitidas ao usuário autenticado.

**Validação:** planos de execução antes/depois, ausência de varreduras evitáveis em volume representativo e testes negativos de acesso para usuários não vinculados.

### Etapa 6 — Experiência percebida e divisão de código

**Impacto: médio | Esforço: médio | Risco: baixo**

1. Exibir skeletons estáveis para o conteúdo crítico e carregamentos locais para abas e detalhes.
2. Carregar visualizadores, impressão/exportação e gráficos apenas quando usados.
3. Evitar que o conteúdo inteiro desapareça durante filtros, paginação e atualizações em segundo plano.
4. Preservar posição, filtros, página e cadeia de “Voltar” ao navegar entre Lista → Exercício → Persona → Arquivo.
5. Revisar o pacote inicial por tela e separar dependências pesadas que não pertencem ao primeiro conteúdo útil.

**Validação:** nenhuma mudança brusca de layout; conteúdo anterior permanece visível durante paginação; visualizadores e exportadores não fazem parte do carregamento inicial das listagens.

## Estratégia de cache

- Manter o cliente de consultas criado por sessão e o controle de atualização pelo TanStack Query.
- Definir tempos por natureza do dado, em vez de um único valor global:
  - identidade e módulos: cache mais longo, invalidado em alteração de acesso;
  - catálogos estáveis: cache intermediário;
  - avaliações em edição: cache curto e atualização direcionada;
  - PDFs/anexos: metadados com cache, URL temporária criada somente ao abrir/baixar.
- Incluir usuário, página, busca, filtros e ordenação nas chaves relevantes.
- Usar `enabled` para abas, diálogos e detalhes fechados.
- Preservar dados anteriores na paginação e prebuscar apenas a próxima página provável.
- Após mutações, atualizar a linha afetada e invalidar somente totais ou listas impactados.
- Nunca compartilhar cache entre sessões; limpar no logout e testar troca de perfis.

## Riscos e cuidados obrigatórios

- **Permissões:** otimizações não podem transformar uma consulta administrativa em fonte de dados para Avaliador ou Auxiliar.
- **RLS:** funções consolidadas precisam executar com o usuário autenticado, exceto operações administrativas explicitamente verificadas no servidor.
- **Dados históricos:** nenhuma migração deverá apagar, reescrever ou recalcular avaliações existentes.
- **Cálculos:** criar testes de caracterização antes de tocar no carregamento da Matriz; resultados anteriores e posteriores devem ser idênticos.
- **PDFs/anexos:** continuarão vinculados somente à Persona; exercício apenas referencia Personas.
- **Navegação:** manter o retorno em cascata e seu contexto.
- **Criação/edição:** criação de exercício continua sem ID e usa inserção; edição mantém ID e atualiza somente o registro selecionado.
- **Tempo real:** eventos do acompanhamento devem atualizar apenas a página/linha afetada ou marcar os dados como desatualizados, evitando recarga total em rajadas.

## Critérios objetivos de sucesso

Metas para a mesma conexão, usuário e volume de teste:

- Reduzir em pelo menos 50% as requisições de dados nas telas prioritárias.
- Portal com conteúdo útil em até 1,5 s em navegação fria e até 500 ms ao retornar com cache válido.
- Colaboradores, Biblioteca, Home de Checklists e Acompanhamento com conteúdo útil em até 2 s em navegação fria.
- Filtros paginados com resposta visual em até 500 ms após debounce.
- Nenhuma listagem processando no navegador mais registros do que a página exibida, exceto pequenos catálogos comprovadamente estáveis.
- Nenhum payload de listagem contendo roteiro completo, marcações, observações ou conteúdo de arquivo quando esses campos não são exibidos.
- Zero requisições de PDF, anexo, histórico ou catálogo antes da ação que precisa deles.
- Voltar para uma tela recém-visitada sem recarregar dados ainda válidos.
- Resultados idênticos de notas, aprovação, progresso, exportação e permissões antes e depois.
- Testes dos três perfis confirmando que nenhum dado não vinculado passa a ser retornado.

## Ordem priorizada de execução

1. Baseline reproduzível e testes de regressão de acesso/cálculo.
2. Consolidar identidade e permissões, reduzindo o custo fixo de toda navegação.
3. Tornar abas, diálogos, vínculos e detalhes de Colaboradores realmente sob demanda.
4. Paginar e filtrar Personas/Exercícios no banco; substituir o Dashboard por agregações.
5. Resumir e paginar Checklists/Avaliações/Acompanhamento; retirar campos pesados das listas.
6. Paralelizar/consolidar a estrutura da avaliação e estabilizar o salvamento automático.
7. Criar ou remover índices somente após validar os planos das novas consultas.
8. Dividir gráficos, visualizadores e exportadores; aplicar skeletons e preservar contexto.
9. Repetir todas as medições e publicar comparação antes/depois por tela e perfil.

Este plano não inclui alterações na navegação mobile e não remove nenhuma funcionalidade existente.
