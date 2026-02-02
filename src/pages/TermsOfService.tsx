import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
          <p className="text-muted-foreground mb-8">Última atualização: 26 de Janeiro de 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground mb-4">
              Ao acessar ou usar o aplicativo NeoHub ("Aplicativo"), você concorda em estar 
              vinculado a estes Termos de Uso ("Termos"). Se você não concordar com qualquer 
              parte destes termos, não poderá acessar o Aplicativo.
            </p>
            <p className="text-muted-foreground">
              Estes Termos constituem um acordo legal entre você ("Usuário") e a NeoHub 
              Tecnologia em Saúde Ltda. ("Empresa", "nós" ou "nosso").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground mb-4">
              O NeoHub é uma plataforma digital que oferece:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Gestão de agendamentos e consultas médicas</li>
              <li>Portal do paciente para acompanhamento de tratamentos</li>
              <li>Plataforma educacional para profissionais de saúde</li>
              <li>Ferramentas de gestão para clínicas e consultórios</li>
              <li>Sistema de comunicação entre pacientes e profissionais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Cadastro e Conta</h2>
            
            <h3 className="text-lg font-medium mb-3">3.1. Elegibilidade</h3>
            <p className="text-muted-foreground mb-4">
              Para usar o Aplicativo, você deve ter pelo menos 18 anos de idade e capacidade 
              legal para celebrar contratos. Menores de 18 anos só podem usar mediante 
              autorização de responsável legal.
            </p>

            <h3 className="text-lg font-medium mb-3">3.2. Responsabilidade da Conta</h3>
            <p className="text-muted-foreground mb-4">
              Você é responsável por:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Manter a confidencialidade de sua senha</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Notificar imediatamente qualquer uso não autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Uso Aceitável</h2>
            
            <h3 className="text-lg font-medium mb-3">4.1. Você concorda em NÃO:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Violar leis ou regulamentos aplicáveis</li>
              <li>Infringir direitos de propriedade intelectual</li>
              <li>Transmitir vírus, malware ou código malicioso</li>
              <li>Tentar acessar áreas restritas sem autorização</li>
              <li>Usar o serviço para spam ou comunicações não solicitadas</li>
              <li>Realizar engenharia reversa ou descompilar o software</li>
              <li>Coletar informações de outros usuários sem consentimento</li>
              <li>Usar o serviço para fins ilegais ou prejudiciais</li>
            </ul>

            <h3 className="text-lg font-medium mb-3 mt-4">4.2. Conteúdo do Usuário</h3>
            <p className="text-muted-foreground">
              Você mantém a propriedade do conteúdo que envia, mas nos concede uma licença 
              não exclusiva para usar, armazenar e processar esse conteúdo conforme necessário 
              para a prestação dos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Serviços de Saúde</h2>
            
            <h3 className="text-lg font-medium mb-3">5.1. Não Substituição de Atendimento Médico</h3>
            <p className="text-muted-foreground mb-4">
              O Aplicativo é uma ferramenta de apoio e NÃO substitui consulta, diagnóstico 
              ou tratamento médico presencial. Em caso de emergência, procure atendimento 
              médico imediato.
            </p>

            <h3 className="text-lg font-medium mb-3">5.2. Informações Médicas</h3>
            <p className="text-muted-foreground">
              As informações disponibilizadas têm caráter informativo e educacional. 
              Decisões sobre tratamentos devem ser tomadas em conjunto com profissionais 
              de saúde qualificados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground mb-4">
              Todo o conteúdo do Aplicativo, incluindo mas não limitado a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Textos, gráficos, logos e ícones</li>
              <li>Software e código-fonte</li>
              <li>Design e layout</li>
              <li>Marcas registradas</li>
            </ul>
            <p className="text-muted-foreground">
              São de propriedade exclusiva da NeoHub ou de seus licenciadores e estão 
              protegidos por leis de propriedade intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Pagamentos e Assinaturas</h2>
            
            <h3 className="text-lg font-medium mb-3">7.1. Planos Pagos</h3>
            <p className="text-muted-foreground mb-4">
              Alguns recursos podem requerer assinatura paga. Os preços e condições serão 
              apresentados antes da contratação. Pagamentos são processados de forma segura 
              através de parceiros certificados.
            </p>

            <h3 className="text-lg font-medium mb-3">7.2. Renovação e Cancelamento</h3>
            <p className="text-muted-foreground">
              Assinaturas são renovadas automaticamente, salvo cancelamento prévio. 
              Cancelamentos devem ser realizados com antecedência mínima de 7 dias 
              antes da renovação.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground mb-4">
              Na máxima extensão permitida por lei:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>O serviço é fornecido "como está" e "conforme disponível"</li>
              <li>Não garantimos disponibilidade ininterrupta ou livre de erros</li>
              <li>Não nos responsabilizamos por danos indiretos ou consequenciais</li>
              <li>Nossa responsabilidade total não excederá o valor pago nos últimos 12 meses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Indenização</h2>
            <p className="text-muted-foreground">
              Você concorda em indenizar e isentar a NeoHub, seus diretores, funcionários 
              e parceiros de quaisquer reclamações, perdas ou danos decorrentes do seu 
              uso do Aplicativo ou violação destes Termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Modificações</h2>
            
            <h3 className="text-lg font-medium mb-3">10.1. Alteração dos Termos</h3>
            <p className="text-muted-foreground mb-4">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. 
              Alterações significativas serão notificadas com 30 dias de antecedência.
            </p>

            <h3 className="text-lg font-medium mb-3">10.2. Alteração do Serviço</h3>
            <p className="text-muted-foreground">
              Podemos modificar, suspender ou descontinuar recursos do Aplicativo 
              a qualquer momento, com aviso prévio quando possível.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Rescisão</h2>
            <p className="text-muted-foreground mb-4">
              Podemos suspender ou encerrar sua conta imediatamente se você:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Violar estes Termos</li>
              <li>Fornecer informações falsas</li>
              <li>Usar o serviço de forma fraudulenta</li>
              <li>Comprometer a segurança do sistema</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Disposições Gerais</h2>
            
            <h3 className="text-lg font-medium mb-3">12.1. Lei Aplicável</h3>
            <p className="text-muted-foreground mb-4">
              Estes Termos são regidos pelas leis da República Federativa do Brasil.
            </p>

            <h3 className="text-lg font-medium mb-3">12.2. Foro</h3>
            <p className="text-muted-foreground mb-4">
              Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer 
              controvérsias decorrentes destes Termos.
            </p>

            <h3 className="text-lg font-medium mb-3">12.3. Integralidade</h3>
            <p className="text-muted-foreground">
              Estes Termos, juntamente com a Política de Privacidade, constituem 
              o acordo integral entre as partes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Contato</h2>
            <p className="text-muted-foreground mb-4">
              Para dúvidas sobre estes Termos:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">NeoFolic Tecnologia em Saúde Ltda.</p>
              <p className="text-muted-foreground">E-mail: contato@neofolic.com.br</p>
              <p className="text-muted-foreground">Telefone: (11) 4858-9060</p>
            </div>
          </section>

          <section className="border-t pt-8 mt-8">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} NeoHub. Todos os direitos reservados.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
