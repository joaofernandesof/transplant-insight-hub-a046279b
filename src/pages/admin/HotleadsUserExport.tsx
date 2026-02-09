import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const users = [
  { nome: 'Ana Flávia Pierazo Rodrigues', email: 'anapierazor@gmail.com', senha: 'Ana@2026!' },
  { nome: 'André Luis Chaves Valente', email: 'andrevalente1974@gmail.com', senha: 'André@2026!' },
  { nome: 'Cíntia de Andrade', email: 'dracintia@outlook.com', senha: 'Cíntia@2026!' },
  { nome: 'Deibson Santos Lisboa', email: 'deibsonlisboa1995@gmail.com', senha: 'Deibson@2026!' },
  { nome: 'Eder Eiji Yanagitani', email: 'yanagitani@hotmail.com', senha: 'Eder@2026!' },
  { nome: 'Erika Alves Coimbra', email: 'erikaalvescoimbra@gmail.com', senha: 'Erika@2026!' },
  { nome: 'Fabio Branaro', email: 'fabiobranaro@hotmail.com', senha: 'Fabio@2026!' },
  { nome: 'Felipe Teles de Arruda', email: 'ftarruda@hotmail.com', senha: 'Felipe@2026!' },
  { nome: 'Flavio Henrique Nogueira Machado', email: 'flavioau@outlook.com', senha: 'Flavio@2026!' },
  { nome: 'Gleyldes Gonçalves Guimarães Leão', email: 'gleleao@gmail.com', senha: 'Gleyldes@2026!' },
  { nome: 'Jean Carlos Romão de Sousa', email: 'jeancarlosromaodesousa@gmail.com', senha: 'Jean@2026!' },
  { nome: 'Joselio Alves Sousa', email: 'joselio0611@gmail.com', senha: 'Joselio@2026!' },
  { nome: 'Livia Alana Silva de Souza Gomes', email: 'contato@draliviaalana.com.br', senha: 'Livia@2026!' },
  { nome: 'Paulo Batista da Costa Neto', email: 'paulob.costaneto@hotmail.com', senha: 'Paulo@2026!' },
  { nome: 'Régia Débora Cardoso da Silva Reis', email: 'regiareis103100@outlook.com', senha: 'Régia@2026!' },
  { nome: 'Robister Moreno de Oliveira Mac Cornick', email: 'mrobister@gmail.com', senha: 'Robister@2026!' },
];

export default function HotleadsUserExport() {
  const handleDownload = () => {
    const rows = users.map(u => ({
      Nome: u.nome,
      Email: u.email,
      Senha: u.senha,
      Portal: 'HotLeads',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 45 }, { wch: 40 }, { wch: 20 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Login HotLeads');
    XLSX.writeFile(wb, 'loginhotleads.xlsx');
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Credenciais HotLeads</h1>
        <p className="text-muted-foreground">
          Lista dos 16 usuários configurados para acesso ao portal HotLeads.
        </p>

        <Button onClick={handleDownload} size="lg">
          <Download className="h-5 w-5 mr-2" />
          Baixar Planilha XLSX
        </Button>

        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Senha</th>
                <th className="text-left p-3">Portal</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{u.nome}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 font-mono">{u.senha}</td>
                  <td className="p-3">HotLeads</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
