# 🧪 Checklist de QA Automatizado

> Guia padrão para validação de funcionalidades antes da conclusão de tarefas.

---

## 📋 Checklist Pré-Entrega

### 1. Validação de Código
- [ ] Código compila sem erros
- [ ] Não há warnings críticos no console
- [ ] Imports não utilizados removidos
- [ ] TypeScript sem erros de tipo

### 2. Testes Automatizados
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Cobertura mínima de 70%

### 3. Validação Funcional
- [ ] Funcionalidade atende à especificação
- [ ] Edge cases tratados
- [ ] Mensagens de erro amigáveis
- [ ] Loading states implementados

### 4. Segurança
- [ ] RLS policies verificadas
- [ ] Dados sensíveis protegidos
- [ ] Autenticação requerida onde necessário

### 5. Performance
- [ ] Sem queries N+1
- [ ] Paginação implementada para listas grandes
- [ ] Assets otimizados

### 6. UX/UI
- [ ] Responsivo em mobile
- [ ] Acessibilidade básica (aria-labels)
- [ ] Feedback visual para ações

---

## 🔄 Fluxo de QA

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Tarefa    │───▶│  Implementar │───▶│   Testes    │
│  Recebida   │    │   Código     │    │ Automatizados│
└─────────────┘    └──────────────┘    └──────┬──────┘
                                              │
                   ┌──────────────┐    ┌──────▼──────┐
                   │   Aprovar    │◀───│  Validação  │
                   │   Tarefa     │    │   Manual    │
                   └──────┬───────┘    └─────────────┘
                          │
               ┌──────────▼──────────┐
               │  Atualizar Roadmap  │
               │  + Gerar POP        │
               └─────────────────────┘
```

---

## 📝 Template de Relatório

```markdown
# Relatório de QA - [Nome da Funcionalidade]

**Data:** YYYY-MM-DD
**Tarefa:** [ID] - [Título]
**Status:** ✅ Aprovado / ⚠️ Aprovado com Ressalvas / ❌ Reprovado

## Testes Executados
| Teste | Resultado | Observação |
|-------|-----------|------------|
| ... | ✅/❌ | ... |

## Observações
- ...

## Métricas
| Métrica | Valor |
|---------|-------|
| Testes Passados | X/Y |
```

---

## 🚨 Critérios de Bloqueio

A tarefa NÃO pode ser concluída se:

1. ❌ Erros de compilação
2. ❌ Testes automatizados falhando
3. ❌ Funcionalidade não atende especificação
4. ❌ Vulnerabilidades de segurança identificadas
5. ❌ Performance abaixo do aceitável
