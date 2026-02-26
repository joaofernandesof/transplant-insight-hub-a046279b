

## Plano: Corrigir seção "Profissional Responsável" para imobiliária

### Problema
No `StepBusinessInfo.tsx`, a seção "Profissional Responsável (Matriz)" para o subnicho `imobiliaria` mostra o campo "Nome da Imobiliária *" — que não faz sentido ali, pois o nome da empresa já é capturado na seção acima. Essa seção deveria ter apenas o nome da **pessoa** responsável.

### Solução
Atualizar o override do subnicho `imobiliaria` em `nichoConfig.ts` (linhas 310-318) para usar um label de pessoa em vez de empresa:

- `nameLabel`: de `'Nome da Imobiliária'` → `'Nome do Responsável'`
- `namePlaceholder`: de `'Ex: Imobiliária Premium'` → `'Ex: João Silva'`
- `nameHint`: de `'Nome fantasia da empresa'` → `'Nome do responsável pela imobiliária'`

### Arquivo alterado
- `src/pages/avivar/config/nichoConfig.ts` — apenas o bloco `imobiliaria` dentro de `SUBNICHO_PROFESSIONAL_OVERRIDES` (3 campos)

### Impacto
- Apenas o subnicho `imobiliaria` é afetado
- Nenhuma outra conta ou subnicho muda

