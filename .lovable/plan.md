

## Plano: Atualizar serviços padrão do nicho Imobiliário

### O que será feito
Atualizar os serviços pré-definidos dos 4 subnichos imobiliários em `nichoConfig.ts` para incluir tipos de imóveis mais detalhados e relevantes (terrenos, casas, galpões, apartamentos, etc.).

### Alterações em `src/pages/avivar/config/nichoConfig.ts`

**`agente_imobiliario`** — de 5 para ~8 serviços:
- Venda de Casas e Apartamentos
- Venda de Terrenos e Lotes
- Venda de Galpões e Comerciais
- Aluguel Residencial
- Aluguel Comercial
- Compra (assessoria para compradores)
- Avaliação de Imóveis
- Financiamento Imobiliário

**`imobiliaria`** — atualizar para os mesmos tipos de propriedade:
- Venda Residencial (casas, apartamentos)
- Venda de Terrenos e Lotes
- Venda Comercial (galpões, salas, lojas)
- Aluguel Residencial
- Aluguel Comercial
- Lançamentos (imóveis na planta)
- Administração de Locação

**`construtora`** — adequar:
- Casas Residenciais
- Apartamentos
- Galpões e Comerciais
- Loteamentos
- Reformas e Ampliações
- Projetos Personalizados

**`administradora`** — manter similar, ajustar descrições:
- Administração de Condomínio
- Administração de Aluguéis
- Cobrança de Inadimplentes
- Manutenção Predial

### Impacto
- Afeta TODOS os usuários do nicho imobiliário (novos agentes criados)
- Agentes já criados NÃO são afetados (serviços são copiados na criação)
- Arquivo alterado: apenas `nichoConfig.ts` (bloco `SERVICES_BY_SUBNICHO`)

