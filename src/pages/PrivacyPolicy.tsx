import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8">Última atualização: 26 de Janeiro de 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introdução</h2>
            <p className="text-muted-foreground mb-4">
              A NeoHub ("nós", "nosso" ou "Empresa") está comprometida em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos 
              suas informações quando você usa nosso aplicativo móvel e serviços relacionados.
            </p>
            <p className="text-muted-foreground">
              Ao usar nossos serviços, você concorda com a coleta e uso de informações de acordo 
              com esta política. Se você não concordar com os termos, por favor não use nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Informações que Coletamos</h2>
            
            <h3 className="text-lg font-medium mb-3">2.1. Informações Pessoais</h3>
            <p className="text-muted-foreground mb-4">Podemos coletar as seguintes informações pessoais:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone</li>
              <li>CPF (para fins de identificação)</li>
              <li>Endereço completo</li>
              <li>Data de nascimento</li>
              <li>Foto de perfil (opcional)</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">2.2. Informações de Saúde</h3>
            <p className="text-muted-foreground mb-4">
              Para prestação de serviços médicos, podemos coletar:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
              <li>Histórico médico</li>
              <li>Informações sobre procedimentos</li>
              <li>Documentos médicos</li>
              <li>Fotos relacionadas a tratamentos</li>
            </ul>

            <h3 className="text-lg font-medium mb-3">2.3. Informações Técnicas</h3>
            <p className="text-muted-foreground mb-4">Coletamos automaticamente:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Tipo de dispositivo e sistema operacional</li>
              <li>Endereço IP</li>
              <li>Dados de uso do aplicativo</li>
              <li>Logs de acesso</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Como Usamos Suas Informações</h2>
            <p className="text-muted-foreground mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Fornecer e manter nossos serviços</li>
              <li>Processar agendamentos e consultas</li>
              <li>Enviar notificações importantes sobre seus tratamentos</li>
              <li>Melhorar a experiência do usuário</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Prevenir fraudes e garantir a segurança</li>
              <li>Enviar comunicações de marketing (com seu consentimento)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Compartilhamento de Informações</h2>
            <p className="text-muted-foreground mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar dados com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Profissionais de saúde:</strong> Para prestação de serviços médicos</li>
              <li><strong>Prestadores de serviço:</strong> Empresas que nos auxiliam na operação</li>
              <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
              <li><strong>Parceiros comerciais:</strong> Com seu consentimento expresso</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Segurança dos Dados</h2>
            <p className="text-muted-foreground mb-4">
              Implementamos medidas técnicas e organizacionais para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso baseados em função (RBAC)</li>
              <li>Políticas de segurança de nível de linha (RLS)</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Auditorias regulares de segurança</li>
              <li>Backups automáticos e recuperação de desastres</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Acesso:</strong> Solicitar cópia de seus dados pessoais</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
              <li><strong>Exclusão:</strong> Solicitar a eliminação de seus dados</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
              <li><strong>Informação:</strong> Saber com quem seus dados são compartilhados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Retenção de Dados</h2>
            <p className="text-muted-foreground">
              Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas 
              nesta política, ou conforme exigido por lei. Dados médicos são mantidos pelo 
              período mínimo de 20 anos, conforme legislação sanitária brasileira.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Cookies e Tecnologias de Rastreamento</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies e tecnologias similares para melhorar a experiência do usuário, 
              analisar o uso do serviço e personalizar conteúdo. Você pode gerenciar suas 
              preferências de cookies nas configurações do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Menores de Idade</h2>
            <p className="text-muted-foreground">
              Nossos serviços não são destinados a menores de 18 anos. Não coletamos 
              intencionalmente informações de menores. Se você é pai ou responsável e 
              acredita que seu filho nos forneceu informações, entre em contato conosco.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
              sobre mudanças significativas através do aplicativo ou por e-mail. O uso 
              continuado após alterações constitui aceitação da nova política.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Contato</h2>
            <p className="text-muted-foreground mb-4">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">Encarregado de Proteção de Dados (DPO)</p>
              <p className="text-muted-foreground">E-mail: privacidade@neofolic.com.br</p>
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
