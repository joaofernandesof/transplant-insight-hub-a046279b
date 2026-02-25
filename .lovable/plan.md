

## Diagnóstico: Leads não aparecem para o administrador

### Causa Raiz

Seu perfil de administrador ("Administrador ByNeofolic") está com **Estado e Cidade vazios** no banco de dados. Quando você usa o simulador "Visualizando como licenciado", o sistema trata você como um licenciado comum -- e a regra de segurança exige que licenciados tenham um estado definido para ver leads. Como seu estado está vazio, o filtro retorna **zero leads**.

**Fluxo do problema:**
1. Simulador ativo com perfil "licenciado" faz `isAdmin = false`
2. Código verifica `user.state` -- que é `null` para sua conta
3. Regra de segurança: sem estado definido, nenhum lead é exibido (`return []`)

O erro "500" na parte inferior da tela é um problema separado na função de liberação de leads (webhook_url nulo), que já foi corrigido na mensagem anterior.

### Solução

Duas correções complementares:

1. **Permitir que admins simulando licenciado vejam todos os leads** -- Quando um admin está no modo simulação, ele não tem restrição de estado. Alterar a lógica para que admins reais (mesmo simulando) não sejam bloqueados por falta de estado.

2. **Preencher estado/cidade do admin** -- Atualizar o perfil do administrador com estado e cidade para que a simulação funcione de forma mais realista.

### Alterações Técnicas

**Arquivo: `src/pages/HotLeads.tsx`** (linhas 248-253)
- Mudar o filtro `filteredAvailable` para usar `realIsAdmin` em vez de `isAdmin` no check de estado. Assim, mesmo simulando licenciado, o admin real não é bloqueado:

```text
Antes:  if (isAdmin) return base;
Depois: if (realIsAdmin) return base;
```

Isso garante que o admin sempre veja todos os leads, independentemente do perfil simulado, sem comprometer a segurança para licenciados reais.

**Banco de dados:** Atualizar o registro do admin "Administrador ByNeofolic" com estado "CE" e cidade "Fortaleza" (mesmos valores do outro perfil admin).

