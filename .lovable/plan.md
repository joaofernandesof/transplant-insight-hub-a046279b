

## Plan: Corrigir Simulação de Perfil de Acesso

### Problema Atual

O seletor "Simular Perfil de Acesso" muda o `activeProfile` no contexto, mas **nada no sidebar reage a essa mudança**:

1. A função `hasPermission` no `UnifiedSidebar.tsx` é um stub que sempre retorna `true` (linha 226-228)
2. O `filterMenuByPermissions` recebe `isAdmin` (o flag real do banco), nunca o perfil simulado
3. Resultado: trocar o perfil no seletor não filtra nenhum item do menu

### Correção

**Arquivo: `src/components/UnifiedSidebar.tsx`**

1. **Criar um `isSimulatedAdmin`** — quando o admin está simulando um perfil não-admin (ex: operador), tratar `isAdmin` como `false` para fins de filtragem do menu
2. **Implementar `hasPermission` real** usando o perfil simulado — consultar as permissões reais do sistema (`usePermissions`) mas filtradas pelo perfil ativo simulado
3. **Passar `isSimulatedAdmin` em vez de `isAdmin`** para todas as chamadas de `filterMenuByPermissions`

Lógica:

```text
Se activeProfile é 'administrador' ou 'super_administrador' → isSimulatedAdmin = true
Senão → isSimulatedAdmin = false (mesmo que o user real seja admin)

filterMenuByPermissions(items, hasPermission, isSimulatedAdmin)
                                                ^^^^^^^^^^^^^^^^
                                                em vez de isAdmin
```

Isso faz com que itens marcados `adminOnly: true` sumam quando o admin simula um perfil de operador, coordenador, etc., refletindo exatamente o que aquele perfil veria.

### Arquivos Modificados

- `src/components/UnifiedSidebar.tsx` — substituir stub `hasPermission`, adicionar lógica de `isSimulatedAdmin`, propagar para todos os pontos de filtragem

