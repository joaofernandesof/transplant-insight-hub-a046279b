

## Diagnóstico: Por que os portais estão bloqueados

A conta **Lucas Araujo** (`lucasaraujo.neofolic@gmail.com`) está com dois problemas:

1. **`allowed_portals` incompleto** — Possui apenas: `avivar, cpg, ibramec, colaborador, paciente, vision, neopay, ipromed`. Faltam: `hotleads, neoteam, neocare, academy, neolicense, neohair, neorh, admin`.

2. **Nenhuma entrada em `user_portal_roles`** — A tabela que define qual função (role) o usuário tem em cada portal está completamente vazia para este usuário. Sem isso, o sistema não encontra permissões de módulo (`*:read`) e bloqueia o acesso mesmo que o portal esteja no `allowed_portals`.

## Plano de Correção

Executar duas operações no banco de dados:

### 1. Atualizar `allowed_portals` com todos os slugs
Atualizar o array `allowed_portals` na tabela `neohub_users` para incluir todos os 12 portais ativos do ecossistema.

### 2. Inserir `user_portal_roles` para todos os portais
Criar uma entrada em `user_portal_roles` para cada portal, atribuindo a role **Administrador** (`cc8396d4-7e3f-468b-b38a-9e7cc8657e43`, hierarchy_level 1), garantindo acesso completo a todos os módulos.

Os IDs envolvidos:
- **User ID (neohub):** `50944b90-6e62-4a92-91c0-f48a8da9b2aa`
- **Role Administrador:** `cc8396d4-7e3f-468b-b38a-9e7cc8657e43`
- **12 portais** com seus respectivos UUIDs

Nenhuma alteração de código será necessária — apenas dados no banco.

