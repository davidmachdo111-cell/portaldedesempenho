# Portal de Desempenho (84)

# Refatoração Completa da Plataforma - Portal Corporativo

Quero realizar uma refatoração completa da arquitetura da aplicação. O objetivo não é reconstruir os projetos existentes, mas sim transformá-los em módulos de uma única plataforma corporativa.

Desejo reaproveitar ao máximo a estrutura e funcionalidades dos projetos já existentes, centralizando autenticação, gerenciamento de usuários, permissões e administração.

## Projetos Base

Utilizar como base os seguintes projetos:

### Projeto 1 - Checklists

GitHub:

https://github.com/davidmachdo111-cell/leafy-performance.git

Este projeto deverá passar a ser o módulo **Checklists**.

---

### Projeto 2 - Personagens e Simulados

GitHub:

https://github.com/davidmachdo111-cell/sim-persona-craft.git

Este projeto deverá passar a ser o módulo **Personagens e Simulados**.

---

# Objetivo

Criar uma única plataforma composta por:

- Tela de Login

- Portal Principal

- Administração Central

- Módulo Checklists

- Módulo Personagens e Simulados

Toda a plataforma deverá compartilhar:

- Login

- Usuários

- Permissões

- Perfis

- Sessões

- Administração

As funcionalidades específicas de cada módulo deverão permanecer independentes.

---

# IMPORTANTE

Não recriar os sistemas existentes.

Quero aproveitar o código atual dos dois projetos e reorganizar sua arquitetura.

Todo o comportamento atual deverá ser preservado.

O objetivo é apenas centralizar o acesso e transformar ambos em módulos internos da plataforma.

---

# Login Único

Remover completamente as telas de login existentes dentro dos módulos.

A autenticação deverá existir apenas uma vez.

Fluxo esperado:

Login

↓

Portal Principal

↓

Selecionar módulo

↓

Checklists

ou

Personagens e Simulados

Depois que o usuário realizar login, nunca mais deverá ser solicitado um novo login durante a navegação.

---

# Tela de Login

Quero manter exatamente o mesmo padrão visual que já existe atualmente.

Pode reutilizar praticamente a mesma interface.

Não criar outro modelo de login.

Campos:

- Usuário

- Senha

- Botão Entrar

Opcional:

- Mostrar/Ocultar senha

---

## Usuário

Continuar utilizando exatamente o padrão atual.

Exemplos:

joao.silva

maria.souza

pedro.costa

Formato:

nome.sobrenome

Não utilizar e-mail como usuário.

---

## Senha

As senhas serão simples.

Não implementar políticas avançadas de segurança neste momento.

Não exigir:

- Caracteres especiais

- Letras maiúsculas obrigatórias

- Quantidade mínima elevada

- Regras complexas

O administrador será responsável pela criação e alteração das senhas.

---

# Portal Principal

Após autenticar, o usuário deverá visualizar um Portal.

Este Portal será a página inicial da plataforma.

Seu objetivo será apenas centralizar o acesso aos módulos.

A interface deverá ser moderna, limpa e profissional.

Os módulos deverão ser apresentados em formato de Cards.

Cada Card deverá possuir:

- Ícone

- Nome

- Descrição

- Botão "Acessar"

Inicialmente existirão apenas dois módulos.

## Card 1

### Checklists

Descrição:

Sistema responsável por avaliações, checklists, dashboards, indicadores, critérios e geração de PDFs.

---

## Card 2

### Personagens e Simulados

Descrição:

Sistema responsável pela criação de personagens, roteiros, cenários e simulações para treinamentos.

---

Preparar a arquitetura para que novos Cards possam ser adicionados futuramente sem necessidade de alterar a estrutura principal.

---

# Administração Central

Criar um painel administrativo único.

Toda administração da plataforma deverá acontecer neste local.

Não quero configurações de usuários espalhadas entre os módulos.

A administração deverá possuir:

- Usuários

- Perfis

- Permissões

- Sessões

- Controle de acesso

- Administração dos módulos

- Alteração de senha

- Reset de senha

---

# Gestão de Usuários

O Administrador deverá conseguir:

- Criar usuários

- Editar usuários

- Excluir usuários

- Ativar usuários

- Inativar usuários

- Alterar senha

- Resetar senha

- Criar Administradores

- Criar Auxiliares

- Criar Avaliadores

- Definir permissões

- Definir quais módulos cada usuário poderá acessar

---

# Perfis

Criar inicialmente os perfis:

- Administrador

- Auxiliar

- Avaliador

- Usuário

Entretanto, a arquitetura deverá permitir criar novos perfis futuramente.

As permissões deverão ser independentes dos perfis.

O perfil será apenas uma organização.

Quem realmente controla o acesso serão as permissões.

---

# Sistema de Permissões

Criar um sistema centralizado.

Cada usuário poderá possuir permissões individuais.

Exemplo:

✔ Checklists

✔ Personagens e Simulados

✔ Administração

✔ Dashboard

✔ Relatórios

✔ Módulos futuros

Caso o usuário não possua determinada permissão, o módulo não deverá aparecer no Portal.

---

# Funcionamento dos Módulos

## Checklists

O módulo deverá continuar funcionando exatamente como hoje.

Preservar:

- Checklists

- Avaliações

- Critérios

- Dashboards

- Indicadores

- PDFs

- Pesos

- Configurações

Nenhuma regra de negócio deverá ser alterada.

---

## Personagens e Simulados

Também deverá permanecer exatamente como funciona atualmente.

Preservar:

- Personagens

- Simulados

- Cenários

- Roteiros

- PDFs

- Banco de Personagens

- Configurações

Nenhuma funcionalidade deverá ser alterada.

---

# Banco de Dados

Centralizar apenas:

- Usuários

- Login

- Sessões

- Perfis

- Permissões

- Controle de acesso

Cada módulo continuará utilizando suas próprias tabelas para seus dados internos.

---

# Identidade Visual

Quero manter exatamente a identidade visual atual.

Não criar um novo design.

Toda a plataforma deverá parecer um único sistema.

Manter:

- Sidebar

- Tipografia

- Cards

- Botões

- Formulários

- Componentes

- Tabelas

- Espaçamentos

- Responsividade

---

# Paleta Oficial

Utilizar exclusivamente a seguinte identidade visual.

## Cores Principais

Verde Principal

#008C50

Verde Escuro

#004F4C

Verde Lima

#BBCF33

Laranja

#ED7203

## Cores Auxiliares

#D1A393

#F0CCCC

#EBE3D9

#FFE495

#CCE2BA

#A3D7DD

## Cores Base

Branco

#FFFFFF

Preto

#000000

Também utilizar a paleta complementar enviada como base para:

- Dashboards

- Indicadores

- Gráficos

- Alertas

- Estados

- Badges

- Etiquetas

- Componentes

Toda a interface deverá seguir esta identidade visual.

---

# Arquitetura

A aplicação deverá ser totalmente modular.

No futuro pretendo adicionar novos sistemas.

Exemplos:

- Biblioteca

- Central de Documentação

- Dashboard Corporativo

- Relatórios

- Treinamentos

- Base de Conhecimento

Adicionar um novo módulo deverá exigir apenas:

- Cadastro do módulo

- Definição das permissões

- Inclusão do Card no Portal

Sem necessidade de alterar a estrutura principal.

---

# Preservação das Funcionalidades

É extremamente importante que nenhuma funcionalidade existente seja removida ou alterada desnecessariamente.

O foco desta refatoração é exclusivamente:

- Centralizar autenticação

- Centralizar usuários

- Centralizar permissões

- Criar o Portal Principal

- Organizar a arquitetura

- Melhorar a escalabilidade

Todo o restante deverá permanecer funcionando exatamente como já funciona hoje.

---

# Objetivo Final

Quero transformar os projetos Leafy Performance e Sim Persona Craft em uma única plataforma corporativa.

Os módulos passarão a se chamar:

- Checklists

- Personagens e Simulados

Ambos compartilharão um único sistema de autenticação, usuários, permissões e administração.

A plataforma deverá manter uma identidade visual única, moderna, profissional e preparada para receber novos módulos futuramente, preservando integralmente todas as funcionalidades existentes e evitando qualquer regressão durante a refatoração.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://portaldedesempenho.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f1a93be-a4a1-4cd9-ae1a-5d2954faf3bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
