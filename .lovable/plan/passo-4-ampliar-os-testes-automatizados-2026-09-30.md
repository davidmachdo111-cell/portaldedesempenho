# Passo 4 — ampliar os testes automatizados

## Objetivo
Cobrir os fluxos críticos que hoje dependem de validação manual, mantendo intactos dados, permissões, cálculos da matriz e regras de acesso.

## Implementação

### 1. Base de testes reutilizável
- Criar uma configuração comum do Vitest para limpar mocks e DOM entre testes.
- Criar um mock encadeável do banco e do armazenamento para verificar consultas, gravações, URLs assinadas e falhas sem acessar dados reais.
- Usar relógio e identificadores controlados quando datas, conclusão ou nomes de arquivos fizerem parte da regra.

### 2. Criação versus edição de exercício
- Separar a operação de salvar exercício em uma função testável, mantendo o hook atual como integração da interface.
- Confirmar que **criar** usa inclusão sem ID e não altera exercício existente.
- Confirmar que **editar** usa atualização filtrada somente pelo ID carregado.
- Validar sincronização N:N de personas: inclusão, remoção e ordenação dos vínculos, sem apagar personas.
- Testar o formulário: após criar ou editar com sucesso, limpar ID, nome, responsável, observações, filtros e personas; continuar na mesma tela.

### 3. Vínculos entre usuários, colaboradores, exercícios e personas
- Testar criação e remoção de responsável com papel correto e registro no histórico.
- Testar vínculo de exercício ao colaborador, incluindo criação da atividade somente quando ela ainda não existir.
- Testar idempotência de vínculo duplicado e desvinculação sem excluir exercício ou persona.
- Testar montagem de conteúdos: apenas exercícios/personas associados, personas na ordem definida e arquivos agrupados no proprietário correto.

### 4. Conclusão de atividades
- Validar transições `pendente → em andamento → concluída → pendente`.
- Ao concluir, confirmar data, usuário e nome de quem concluiu; ao reabrir, confirmar a limpeza desses campos.
- Confirmar registro no histórico e recálculo correto do progresso.
- Testar mensagens e atualização da lista na interface de conteúdos vinculados.

### 5. Acesso, visualização e download de arquivos
- Testar geração de URL assinada para visualizar e baixar, incluindo nome original no download.
- Confirmar que o link temporário é criado, acionado e removido do documento.
- Validar estados de carregamento, imagem, PDF, erro e retorno por botão/Escape no visualizador integrado.
- Confirmar que arquivos permanecem associados exclusivamente à Persona e que respostas negadas pelo controle de acesso não expõem URL nem conteúdo.

### 6. Fluxos completos de avaliação
- Cobrir criação do rascunho, carregamento da estrutura, preenchimento apenas de células vinculadas, observações, cálculo, salvamento, conclusão e reabertura.
- Confirmar que células sem vínculo continuam vazias, a nota usa somente critérios vinculados e dados históricos sem vínculos preservam a compatibilidade atual.
- Testar validações obrigatórias de colaborador e setor antes da conclusão.
- Testar serialização do salvamento para evitar que uma resposta antiga sobrescreva alterações recentes.
- Validar bloqueio de edição em acompanhamento e avaliação concluída, além das ações permitidas a avaliador e administrador.

### 7. Execução e validação
- Organizar os testes por domínio, com nomes em português e cenários de sucesso, duplicidade, ausência de dados e erro de acesso.
- Executar toda a suíte, corrigir regressões encontradas e confirmar a compilação automática.
- Registrar no roadmap a quantidade final de testes e os fluxos cobertos.

## Critérios de aceite
- Criação nunca atualiza exercício existente; edição nunca cria duplicata.
- Personas e arquivos não são apagados ao remover vínculos.
- Conclusão e reabertura persistem os campos corretos.
- Downloads só usam URLs autorizadas e preservam o nome do arquivo.
- O fluxo de avaliação completo mantém os cálculos e vínculos já definidos.
- Toda a suíte passa de forma determinística, sem depender da base de produção.
