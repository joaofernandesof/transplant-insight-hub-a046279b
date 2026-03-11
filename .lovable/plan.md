

## Plan: Redesenhar botões de navegação do Call Intelligence

### Mudança

Substituir o `TabsList` padrão (que usa um fundo cinza compacto com abas grudadas) por botões individuais estilizados como cards/pills com borda, ícone colorido e espaçamento entre eles.

### Design

```text
[ 📊 Dashboard ]   [ 📞 Calls  1 ]   [ ➕ Registrar ]   [ ⚙️ Fireflies ]
```

Cada botão será um `TabsTrigger` com:
- Borda visível (`border`)
- Padding generoso (`px-6 py-3`)
- Ícone com cor de destaque
- Fundo branco, com estado ativo usando `bg-primary text-white`
- Gap entre botões (`gap-3`)
- `TabsList` com fundo transparente em vez do `bg-muted`

### Arquivo

- `src/pages/neoteam/comercial/CallIntelligencePage.tsx` — alterar classes do `TabsList` e `TabsTrigger`

