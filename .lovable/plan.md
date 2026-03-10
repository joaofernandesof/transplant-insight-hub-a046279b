

# Plano: Substituir "—" por "..." nos campos vazios da Agenda Cirúrgica

## Problema
Na tabela da agenda cirúrgica, campos sem informação exibem o caractere "—" (travessão). O usuário quer que exibam "..." (três pontinhos).

## Alteração

**Arquivo:** `src/clinic/components/SurgeryWeekTable.tsx`

Substituir todas as ocorrências de `'—'` por `'...'` nas células da tabela:

1. **Hora** (linha 215): `surgery.surgeryTime ? ... : '—'` → `'...'`
2. **Procedimento** (linha 243): `surgery.procedure || '—'` → `'...'`
3. **Grau** (linha 245): `surgery.grade || '—'` → `'...'`
4. **Tricotomia** (linha 252): `<span className="text-muted-foreground">—</span>` → `<span className="text-muted-foreground">...</span>`

São 4 substituições pontuais, todas no mesmo arquivo.

