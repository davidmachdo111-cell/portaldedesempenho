<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Decisões de arquitetura

- Busca global e telemetria de navegação vivem no `PlatformShell`, garantindo comportamento único em todas as telas autenticadas.
- Resumos por perfil usam funções autenticadas no servidor e consultas agregadas, evitando carregar cadastros completos no Portal.
- Queries permanecem frescas por cinco minutos e em memória por trinta; mutações invalidam somente famílias de dados alteradas.
- Tempos de rota medem do início da navegação interna até o conteúdo pintado e são registrados sem bloquear a interface.
- Regras críticas de exercícios, vínculos, conclusão e avaliação ficam em funções puras reutilizadas pela interface, permitindo testes determinísticos sem acessar dados reais.
