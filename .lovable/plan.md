

## Plano: Unificar fluxos Express + Executivo em um único pipeline

### O que será feito
Remover a divisão entre "Fluxo Express" e "Fluxo Executivo", criando um **único pipeline unificado** com todas as etapas relevantes. O seletor de tipo de fluxo será removido — ao clicar "Nova Vaga", abre direto o formulário.

### Etapas unificadas (merge dos dois fluxos)
1. Solicitação → 2. Captação → 3. Triagem Técnica → 4. Entrevista Técnica → 5. Case Prático → 6. Entrevista Diretor → 7. Proposta → 8. Contratado → (Cancelada)

### Alterações em `NeoRHVagas.tsx`

1. **Remover** `EXECUTIVO_ETAPAS` e renomear `EXPRESS_ETAPAS` para `ETAPAS` com todas as 8 etapas unificadas (merge)
2. **Remover** `getEtapas(fluxo)` — usar `ETAPAS` diretamente
3. **Remover** estado `fluxoFilter`, `showFluxoSelector`, `startCreateWithFluxo`
4. **Simplificar `openNew()`** — abrir formulário direto sem seletor
5. **Remover** o dialog "Qual tipo de fluxo?" (linhas 827-849)
6. **Remover** filtros Express/Executivo no header e badges de tipo de fluxo
7. **Kanban**: renderizar um único board com todos os cards (sem swim lanes por fluxo)
8. **Lista**: remover coluna "Fluxo"
9. **Detalhes (Sheet)**: remover badge/ícone de tipo de fluxo
10. **Indicadores**: remover métricas express vs executivo
11. **Formulário**: remover referência a `tipo_fluxo` no título

O campo `tipo_fluxo` será mantido no banco e sempre salvo como `'express'` para não quebrar registros existentes, mas não será mais exibido na UI.

