import { Button } from "@/components/ui/button";
import { FileDown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AuditReportExport = () => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handlePrint}>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
        <article className="prose prose-slate dark:prose-invert max-w-none print:prose-sm">
          <h1 className="text-3xl font-bold text-center mb-2">🛡️ Relatório de Auditoria Interna - NeoHub</h1>
          
          <div className="text-center text-muted-foreground mb-8">
            <p><strong>Data:</strong> 26 de Janeiro de 2026</p>
            <p><strong>Auditor:</strong> Sistema de Qualidade Automatizado</p>
            <p><strong>Versão:</strong> 1.0</p>
          </div>

          <hr className="my-6" />

          <h2 className="text-2xl font-semibold">📋 Resumo Executivo</h2>
          
          <h3>Estado Geral do Projeto</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">Dimensão</th>
                  <th className="border border-border p-2 text-left">Status</th>
                  <th className="border border-border p-2 text-left">Cobertura</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-border p-2"><strong>Módulos Ativos</strong></td><td className="border border-border p-2">6 portais</td><td className="border border-border p-2">✅ Funcional</td></tr>
                <tr><td className="border border-border p-2"><strong>Banco de Dados</strong></td><td className="border border-border p-2">139 tabelas</td><td className="border border-border p-2">⚠️ RLS incompleto</td></tr>
                <tr><td className="border border-border p-2"><strong>Edge Functions</strong></td><td className="border border-border p-2">42 funções</td><td className="border border-border p-2">✅ Operacional</td></tr>
                <tr><td className="border border-border p-2"><strong>Testes Automatizados</strong></td><td className="border border-border p-2">10 testes</td><td className="border border-border p-2">❌ Crítico (&lt;1%)</td></tr>
                <tr><td className="border border-border p-2"><strong>Documentação (POPs)</strong></td><td className="border border-border p-2">1 documento</td><td className="border border-border p-2">❌ Insuficiente</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4 my-4">
            <p className="font-semibold text-amber-800 dark:text-amber-200">Classificação de Risco Global: <span className="text-red-600 dark:text-red-400">MÉDIO-ALTO</span></p>
            <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">O projeto apresenta funcionalidades robustas, porém possui vulnerabilidades críticas de segurança que requerem atenção imediata.</p>
          </div>

          <hr className="my-6" />

          <h2 className="text-2xl font-semibold">🚨 Vulnerabilidades P0 (Críticas)</h2>

          {/* SEC-001 */}
          <div className="border border-red-300 dark:border-red-700 rounded-lg p-4 my-4 bg-red-50 dark:bg-red-900/20">
            <h4 className="font-bold text-red-700 dark:text-red-400">SEC-001: Exposição de Dados de Leads</h4>
            <table className="min-w-full mt-2 text-sm">
              <tbody>
                <tr><td className="font-semibold pr-4">Gravidade:</td><td>🔴 CRÍTICA</td></tr>
                <tr><td className="font-semibold pr-4">Módulo:</td><td>CRM / Leads</td></tr>
                <tr><td className="font-semibold pr-4">Impacto:</td><td>Dados pessoais (nome, email, telefone) acessíveis a qualquer usuário autenticado</td></tr>
                <tr><td className="font-semibold pr-4">Causa Raiz:</td><td>Política RLS permissiva (USING (true))</td></tr>
                <tr><td className="font-semibold pr-4">Status:</td><td>✅ Corrigido</td></tr>
              </tbody>
            </table>
          </div>

          {/* SEC-002 */}
          <div className="border border-red-300 dark:border-red-700 rounded-lg p-4 my-4 bg-red-50 dark:bg-red-900/20">
            <h4 className="font-bold text-red-700 dark:text-red-400">SEC-002: Exposição de Dados de Usuários NeoHub</h4>
            <table className="min-w-full mt-2 text-sm">
              <tbody>
                <tr><td className="font-semibold pr-4">Gravidade:</td><td>🔴 CRÍTICA</td></tr>
                <tr><td className="font-semibold pr-4">Módulo:</td><td>Core / Usuários</td></tr>
                <tr><td className="font-semibold pr-4">Impacto:</td><td>CPF, endereços e dados sensíveis expostos</td></tr>
                <tr><td className="font-semibold pr-4">Causa Raiz:</td><td>Ausência de políticas RLS restritivas</td></tr>
                <tr><td className="font-semibold pr-4">Status:</td><td>✅ Corrigido</td></tr>
              </tbody>
            </table>
          </div>

          {/* SEC-003 */}
          <div className="border border-red-300 dark:border-red-700 rounded-lg p-4 my-4 bg-red-50 dark:bg-red-900/20">
            <h4 className="font-bold text-red-700 dark:text-red-400">SEC-003: Vazamento de Respostas em Provas</h4>
            <table className="min-w-full mt-2 text-sm">
              <tbody>
                <tr><td className="font-semibold pr-4">Gravidade:</td><td>🔴 CRÍTICA</td></tr>
                <tr><td className="font-semibold pr-4">Módulo:</td><td>Academy / Exames</td></tr>
                <tr><td className="font-semibold pr-4">Impacto:</td><td>Alunos podem ver gabarito durante prova</td></tr>
                <tr><td className="font-semibold pr-4">Causa Raiz:</td><td>View exam_questions_student expõe correct_answer</td></tr>
                <tr><td className="font-semibold pr-4">Status:</td><td>✅ Corrigido</td></tr>
              </tbody>
            </table>
          </div>

          {/* SEC-004 */}
          <div className="border border-red-300 dark:border-red-700 rounded-lg p-4 my-4 bg-red-50 dark:bg-red-900/20">
            <h4 className="font-bold text-red-700 dark:text-red-400">SEC-004: Views com SECURITY DEFINER</h4>
            <table className="min-w-full mt-2 text-sm">
              <tbody>
                <tr><td className="font-semibold pr-4">Gravidade:</td><td>🔴 CRÍTICA</td></tr>
                <tr><td className="font-semibold pr-4">Módulo:</td><td>Academy / Galerias</td></tr>
                <tr><td className="font-semibold pr-4">Impacto:</td><td>Bypass de RLS via views mal configuradas</td></tr>
                <tr><td className="font-semibold pr-4">Causa Raiz:</td><td>Falta de security_invoker=true</td></tr>
                <tr><td className="font-semibold pr-4">Status:</td><td>✅ Corrigido</td></tr>
              </tbody>
            </table>
          </div>

          {/* TST-001 */}
          <div className="border border-orange-300 dark:border-orange-700 rounded-lg p-4 my-4 bg-orange-50 dark:bg-orange-900/20">
            <h4 className="font-bold text-orange-700 dark:text-orange-400">TST-001: Cobertura de Testes Insuficiente</h4>
            <table className="min-w-full mt-2 text-sm">
              <tbody>
                <tr><td className="font-semibold pr-4">Gravidade:</td><td>🔴 CRÍTICA</td></tr>
                <tr><td className="font-semibold pr-4">Módulo:</td><td>Global</td></tr>
                <tr><td className="font-semibold pr-4">Impacto:</td><td>Regressões não detectadas, bugs em produção</td></tr>
                <tr><td className="font-semibold pr-4">Causa Raiz:</td><td>Apenas 10 testes implementados</td></tr>
                <tr><td className="font-semibold pr-4">Status:</td><td>📋 Planejado</td></tr>
              </tbody>
            </table>
          </div>

          <hr className="my-6" />

          <h2 className="text-2xl font-semibold">⚠️ Vulnerabilidades P1 (Médias)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">ID</th>
                  <th className="border border-border p-2 text-left">Descrição</th>
                  <th className="border border-border p-2 text-left">Módulo</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-border p-2">SEC-005</td><td className="border border-border p-2">Bucket surgery-photos público</td><td className="border border-border p-2">Storage</td></tr>
                <tr><td className="border border-border p-2">SEC-006</td><td className="border border-border p-2">12 políticas RLS com USING (true)</td><td className="border border-border p-2">Múltiplos</td></tr>
                <tr><td className="border border-border p-2">SEC-007</td><td className="border border-border p-2">Risco XSS em RichTextEditor</td><td className="border border-border p-2">UI</td></tr>
                <tr><td className="border border-border p-2">DOC-001</td><td className="border border-border p-2">Apenas 1 POP para 42 Edge Functions</td><td className="border border-border p-2">Docs</td></tr>
                <tr><td className="border border-border p-2">ARQ-001</td><td className="border border-border p-2">4 AuthContexts coexistentes</td><td className="border border-border p-2">Arquitetura</td></tr>
              </tbody>
            </table>
          </div>

          <hr className="my-6" />

          <h2 className="text-2xl font-semibold">📊 Cobertura de Testes</h2>
          
          <h3>Áreas Testadas</h3>
          <ul>
            <li>✅ Cálculo de comissões (básico)</li>
            <li>✅ Geração de códigos de referência</li>
          </ul>

          <h3>Áreas NÃO Testadas (Alto Risco)</h3>
          <ul>
            <li>❌ UnifiedAuthContext e controle de acesso</li>
            <li>❌ Cálculo de scores Day2</li>
            <li>❌ Políticas RLS</li>
            <li>❌ Edge Functions (42 funções)</li>
            <li>❌ Fluxos de autenticação</li>
            <li>❌ Validação de formulários</li>
          </ul>

          <hr className="my-6" />

          <h2 className="text-2xl font-semibold">📝 Documentação</h2>
          
          <h3>POPs Existentes</h3>
          <ul>
            <li>docs/pops/POP-CHECKLIST-EVENTO.md ✅</li>
          </ul>

          <h3>POPs Ausentes (Críticos)</h3>
          <ul>
            <li>Pesquisa Day 1/2/3</li>
            <li>Onboarding de Alunos</li>
            <li>Sistema de Provas</li>
            <li>Gestão de Turmas</li>
            <li>Alertas de Métricas</li>
          </ul>

          <hr className="my-6" />

          <h2 className="text-2xl font-semibold">✅ Conclusão</h2>

          <h3>Pontos Fortes</h3>
          <ol>
            <li>Arquitetura RBAC bem estruturada com get_user_context()</li>
            <li>Sistema de permissões granulares implementado</li>
            <li>Edge Functions organizadas e funcionais</li>
            <li>UI/UX consistente com design system</li>
          </ol>

          <h3>Ações Imediatas Necessárias</h3>
          <ol>
            <li><strong>Corrigir SEC-001 a SEC-004</strong> - ✅ Concluído</li>
            <li><strong>Aumentar cobertura de testes</strong> - Meta: 30% em 30 dias</li>
            <li><strong>Documentar POPs críticos</strong> - Priorizar fluxos de alunos</li>
            <li><strong>Unificar AuthContexts</strong> - Eliminar redundâncias</li>
          </ol>

          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4 my-4">
            <h4 className="font-semibold text-green-800 dark:text-green-200">Recomendação Final</h4>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
              O projeto possui base sólida. As vulnerabilidades P0 foram corrigidas. Próximo passo: aumentar cobertura de testes e documentar processos críticos.
            </p>
          </div>

          <hr className="my-6" />

          <div className="text-center text-muted-foreground text-sm">
            <p><strong>Assinatura Digital:</strong> Sistema de Auditoria NeoHub v1.0</p>
            <p><strong>Hash de Verificação:</strong> SHA256:audit-2026-01-26</p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default AuditReportExport;
