

# Adicionar Unidades: São Paulo e Terceirização

## Situação Atual

A tabela `neoteam_branches` possui apenas **Fortaleza** e **Juazeiro**. Faltam **São Paulo** e **Terceirização**.

O filtro de filial no dashboard (`ClinicDashboard.tsx`) deriva as opções dos dados existentes + `useBranches()`, que por sua vez lê da tabela `staff_profiles`. Isso significa que unidades sem staff cadastrado não aparecem no filtro.

## Mudanças

### 1. Inserir novas unidades no banco de dados

Adicionar na tabela `neoteam_branches`:

| code | name |
|------|------|
| `sao_paulo` | São Paulo |
| `terceirizacao` | Terceirização |

### 2. Atualizar o filtro de filial no Dashboard

Modificar `src/clinic/pages/ClinicDashboard.tsx` para que as opções do filtro incluam **todas as unidades da tabela `neoteam_branches`**, em vez de depender apenas dos dados de cirurgias e staff existentes. Isso garante que as 4 unidades sempre apareçam:

- Fortaleza
- Juazeiro
- São Paulo
- Terceirização

### 3. Atualizar `useBranches` hook

Modificar `src/clinic/hooks/useBranches.ts` para buscar da tabela `neoteam_branches` (que é a fonte correta de unidades configuradas) em vez de derivar de `staff_profiles`. Para não-admins, continuar restringindo às branches autorizadas.

## Arquivos a modificar

1. Inserção de dados via SQL (2 novas linhas em `neoteam_branches`)
2. `src/clinic/hooks/useBranches.ts` -- buscar de `neoteam_branches`
3. `src/clinic/pages/ClinicDashboard.tsx` -- garantir que o filtro use as branches do hook corretamente
