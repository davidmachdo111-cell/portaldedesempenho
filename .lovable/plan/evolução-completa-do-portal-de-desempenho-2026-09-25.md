# Evolução completa do Portal de Desempenho

## Objetivo

Implementar as oito melhorias aprovadas sem remover funcionalidades, alterar cálculos ou enfraquecer as regras de acesso. A entrega será dividida em etapas pequenas, com validação após cada etapa.

## 1. Proteção por testes automatizados

- Adicionar infraestrutura de testes para regras e componentes críticos.
- Cobrir permissões de Administrador, Avaliador e Auxiliar.
- Cobrir criação versus edição de Exercícios, vínculos N:N, cálculo da Matriz, conclusão de avaliações e navegação contextual.
- Criar testes de regressão para PDFs e anexos pertencentes exclusivamente às Personas.
- Adicionar comandos de teste ao projeto e documentação mínima de execução.

## 2. Monitoramento de erros e desempenho

- Aproveitar a captura de erros já existente e padronizar contexto por usuário, tela e ação, sem registrar conteúdo sensível.
- Medir mudanças de tela, consultas lentas e falhas de carregamento.
- Criar uma visão administrativa resumida com erros recentes e indicadores de lentidão, visível somente para Administradores.
- Definir limites de retenção e evitar armazenamento de PDFs, anexos, textos de roteiro ou dados pessoais nos registros técnicos.

## 3. Página inicial personalizada por perfil

- **Administrador:** indicadores gerais, pendências, avaliações recentes e atalhos administrativos.
- **Avaliador:** colaboradores vinculados, avaliações em andamento e próximas ações.
- **Auxiliar:** colaboradores vinculados, Exercícios, Personas e conteúdos pendentes, sem acesso a Checklists.
- Carregar cada bloco sob demanda e consultar apenas os dados permitidos ao perfil atual.

## 4. Busca global

- Adicionar busca no cabeçalho para Colaboradores, Exercícios e Personas.
- Retornar somente resultados autorizados pelas regras de acesso.
- Permitir navegação direta para a tela correta, preservando o contexto de retorno.
- Aplicar atraso curto de digitação, limite de resultados e índices adequados para não prejudicar o carregamento.

## 5. Padronização visual e acessibilidade desktop

- Padronizar carregamentos, telas vazias, falhas, confirmações, botões e mensagens.
- Corrigir idioma global para português e traduzir páginas de erro.
- Garantir foco visível, navegação por teclado, rótulos acessíveis, contraste e áreas de clique consistentes.
- Não criar ou priorizar uma nova navegação mobile.

## 6. Auditoria administrativa

- Criar uma trilha única e imutável para mudanças em permissões, vínculos, Exercícios e avaliações.
- Registrar autor, ação, entidade, horário e resumo seguro da alteração.
- Criar filtros, paginação e visualização somente para Administradores.
- Preservar os históricos já existentes e impedir edição/exclusão dos registros de auditoria.

## 7. Manutenção técnica

- Substituir consultas completas restantes por projeções explícitas onde isso não prejudicar telas de detalhe.
- Remover caminhos antigos realmente sem uso somente após confirmação por busca e testes.
- Dividir arquivos extensos por responsabilidade sem mudar a experiência atual.
- Unificar verificações de permissão para reduzir divergências entre menu, telas e banco.

## 8. Validação final

- Validar os fluxos completos nos três perfis.
- Comparar tempos e quantidade de requisições antes e depois nas telas principais.
- Confirmar Matriz, notas, conclusão, criação/edição de Exercícios, vínculos, PDFs, anexos e sequência de “Voltar”.
- Executar testes automatizados, verificação de compilação, erros em execução e inspeção visual desktop.

## Regras preservadas

- Administrador mantém acesso total.
- Avaliador mantém Colaboradores vinculados e Checklists.
- Auxiliar mantém somente Colaboradores e conteúdos vinculados, sem Checklists.
- PDFs, anexos e roteiros continuam pertencendo exclusivamente às Personas.
- Não alterar cálculos, notas, critérios, aprovação ou o fluxo de cadastro de critérios.
- Não alterar a distinção entre criar e editar Exercícios.
- Não enfraquecer políticas de segurança para melhorar desempenho.
- Não priorizar navegação mobile.

## Detalhes técnicos

- Leituras protegidas usarão funções autenticadas no servidor e continuarão sujeitas às políticas do banco.
- Novas tabelas terão permissões explícitas, segurança por linha e índices no mesmo pacote de alteração.
- A busca global usará uma função autenticada com retorno resumido e limite fixo.
- A auditoria usará gravação centralizada no servidor; operações administrativas existentes serão migradas para esse caminho quando necessário.
- Indicadores da página inicial serão consultas resumidas, paginadas ou contagens, nunca cargas completas de cadastros.
- A implementação será organizada em entregas: proteção e observabilidade; página inicial e busca; auditoria; acessibilidade e limpeza; validação final.
