import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentData {
  fullName: string;
  email: string;
  phone?: string;
  cpf?: string;
  city?: string;
  state?: string;
  birthDate?: string;
  crm?: string;
  instagram?: string;
}

// Lista de alunos do IBRAMEC
const students: StudentData[] = [
  { fullName: "José Roberto Fontes Júnior", email: "drrobertoqvida@gmail.com", phone: "79999294577", cpf: "054.199.295-38", city: "Itabaianinha", state: "SE", birthDate: "1997-05-04", crm: "8494" },
  { fullName: "Pablo Patrick Pereira", email: "dr.pablocirurgia@gmail.com", phone: "38998429552", cpf: "045.746.956-09", city: "Caetanópolis", state: "MG", birthDate: "1980-02-15", crm: "69236" },
  { fullName: "Wesley Ribeiro de Sousa", email: "wesleymed11@outlook.com", phone: "99984375619", cpf: "025.885.051-55", city: "Barra do Corda", state: "MA", birthDate: "1987-02-09", crm: "12191" },
  { fullName: "Gleicy Raquel Pires da Silva", email: "gestaorobertopinheiro@gmail.com", cpf: "616.349.302-82", city: "Ananindeua", state: "PA", birthDate: "1975-11-24", crm: "6795" },
  { fullName: "Eloisa Martinez Galvão", email: "elo7galvo@gmail.com", phone: "4989097925", cpf: "801.864.539-65", city: "Balneário Arroio do Silva", state: "SC", birthDate: "1990-07-07", crm: "14525" },
  { fullName: "Nabor Plaza Ruiz", email: "naborplaza@hotmail.com", phone: "21999184643", cpf: "976.029.907-06", city: "Niterói", state: "RJ", birthDate: "1959-10-12", crm: "52477111" },
  { fullName: "Milena Tofani Braga", email: "milena.braga@soufunorte.com.br", phone: "38986019555", cpf: "132.490.730-645", city: "Montes Claros", state: "MG", birthDate: "1999-05-04", crm: "102598" },
  { fullName: "Henrique Paiva Diogo", email: "henriquepdiogo@hotmail.com", phone: "21981240174", cpf: "146.918.327-77", city: "Eusébio", state: "CE", birthDate: "1994-04-29", crm: "26462" },
  { fullName: "Carla Patrícia Gama da Silva", email: "oncogama23@gmail.com", phone: "74911066555", cpf: "959.861.705-04", city: "Paulo Afonso", state: "BA", birthDate: "1980-11-27", crm: "29441" },
  { fullName: "Paulo Cesar Pacheco Laurindo", email: "pachecolaurindo@hotmail.com", phone: "5198403141", city: "Fortaleza", state: "CE", birthDate: "1974-05-17", crm: "27283" },
  { fullName: "Eduardo Anchieta", email: "eduardoanchieta1@hotmail.com", phone: "34979004114", cpf: "393.887.516-04", city: "Uberlândia", state: "MG", birthDate: "1975-11-04", crm: "77160" },
  { fullName: "Isabela de Miranda Bastos", email: "isabelamirbas@yahoo.com.br", phone: "75928809884", cpf: "054.721.395-62", city: "Feira de Santana", state: "BA", birthDate: "1991-12-04", crm: "36714" },
  { fullName: "Elenilton Pinheiro Rocha", email: "dr.eleniltonpinheiro@gmail.com", phone: "9884505009", cpf: "048.453.963-94", city: "Santa Inês", state: "MA", birthDate: "1991-06-30", crm: "13664", instagram: "@dr.eleniltonrocha" },
  { fullName: "João Paulo Rodrigues Dourado", email: "joaoanjoprotetor@gmail.com", phone: "42984675333", cpf: "005.571.179-09", city: "Guarapuava", state: "PR", birthDate: "1978-08-11", crm: "26487" },
  { fullName: "Vinícius Alcantund", email: "valcantud@gmail.com", phone: "44996939388", cpf: "052.811.679-79", city: "Campo Mourão", state: "PR", birthDate: "1987-01-24", crm: "56685" },
  { fullName: "Jéssica Silvério Silva", email: "jessica_s_silva@hotmail.com", phone: "67967105888", cpf: "032.387.961-60", city: "Caarapó", state: "MS", birthDate: "1991-01-19", crm: "27459" },
  { fullName: "Miziany Jadna Martins", email: "mizianyjadna@gmail.com", phone: "63921165255", cpf: "018.860.391-35", city: "Wenceslau Braz", state: "PR", birthDate: "1988-02-05", crm: "49407" },
  { fullName: "Ricardo Martins Castro", email: "ricardospfc_1@hormail.com", phone: "98922617278", cpf: "013.890.793-50", city: "São Luís", state: "MA", birthDate: "1986-09-29", crm: "8104" },
  { fullName: "Macyo Idemberg Sousa Bezerra", email: "drmacyoidemberg@gmail.com", phone: "8581527649", cpf: "976.478.103-91", city: "Independência", state: "CE", birthDate: "1983-05-19", crm: "23704" },
  { fullName: "Fernando Augusto Matavelli", email: "fematavelli@hotmail.com", phone: "11982224772", cpf: "284.251.758-01", city: "São Paulo", state: "SP", birthDate: "1980-07-03", crm: "155218" },
  { fullName: "Luiz Wilkes Moreira Pereira de Padua", email: "luizwilkes@hotmail.com", phone: "63910759599", cpf: "042.890.824-16", city: "Campos Lindos", state: "TO", birthDate: "1982-05-06", crm: "7787" },
  { fullName: "Adélia Oliveira de Almeida", email: "dradeliaalmeida@icloud.com", phone: "5181887812", cpf: "985.045.502-06", city: "Tunas", state: "RS", birthDate: "1991-08-16", crm: "55896" },
  { fullName: "Mônica Maria Burbano Cruz", email: "admon.monicacruz@gmail.com", phone: "+573107594243", city: "Bogotá", state: "CO", birthDate: "1987-10-12", crm: "1033691189" },
  { fullName: "Martha Shirley Guayanes Bustos", email: "martha.guayanes@gmail.com", phone: "+573208525393", city: "Bogotá", state: "CO", birthDate: "1985-07-26", crm: "30937997" },
  { fullName: "Tathiana Batavia Carneiro", email: "dratathianabatavia@gmail.com", phone: "21997246666", cpf: "124.311.567-02", city: "Rio de Janeiro", state: "RJ", birthDate: "1989-03-16", crm: "52980463" },
  { fullName: "Ricardo Carneiro", email: "ricomendescarneiro@hotmail.com", phone: "21999787950", city: "Rio de Janeiro", state: "RJ", birthDate: "1986-09-17", crm: "52919268" },
  { fullName: "Miquéias Napoleão Raposo", email: "napoleaoraposo10@gmail.com", phone: "95981155835", cpf: "727.864.692-87", city: "Breves", state: "PA", birthDate: "1983-08-07", crm: "1344/RR", instagram: "@dr.miqueiasnapoleao" },
  { fullName: "Diego Araújo de Magalhães", email: "dr.diegoam@gmail.com", phone: "3192800511", city: "São Paulo", state: "SP", crm: "214173" },
  { fullName: "Clayson Pujol Santos", email: "claysonpsantos@gmail.com", phone: "4599872233", cpf: "070.107.069-21", city: "Foz do Iguaçu", state: "PR", birthDate: "1978-09-15", crm: "24460" },
  { fullName: "João Henrique Siqueira Lemes", email: "drjoaohlemes@gmail.com", phone: "5596571746", city: "Caxias do Sul", state: "RS", birthDate: "1998-07-10", crm: "56626" },
  { fullName: "Ricardo Mesquita de Azevedo", email: "ricardomesquitaa17@gmail.com", phone: "54925824477", cpf: "011.244.013-42", city: "Palhoça", state: "SC", birthDate: "1985-11-19", crm: "58748 RS" },
  { fullName: "Denildo José da Silva Sobrinho", email: "denildo2005@hotmail.com", phone: "5592112028", cpf: "746.317.132-91", city: "Cruz Alta", state: "RS", birthDate: "1984-10-05", crm: "55898/RS" },
  { fullName: "Adão Rodrigues Viana", email: "adaoenzoheitormari@gmail.com", phone: "4699350163", cpf: "894.677.876-87", city: "Chopinzinho", state: "PR", birthDate: "1973-08-01", crm: "102608 MG" },
  { fullName: "Juliana Amábile Roos Martins", email: "juli_roos@yahoo.com.br", phone: "5199771421", cpf: "971.270.600-10", city: "Portão", state: "RS", birthDate: "1980-02-24", crm: "33935/RS" },
  { fullName: "Erick Baldiviezo Perez", email: "erickbaldy@gmail.com", phone: "11995391155", cpf: "022.594.836-23", city: "Santos", state: "SP", birthDate: "1986-09-27", crm: "211155", instagram: "@dr_erick_baldiviezo" },
  { fullName: "Antônio Manuel da Silva Neto", email: "manuelchicote00@hotmail.com", phone: "9999412844", cpf: "057.087.983-35", city: "Pedreiras", state: "MA", birthDate: "1992-07-16", crm: "MA 10297" },
  { fullName: "Brenda Maria Silva Lima", email: "lima.brenda06@hotmail.com", phone: "9981667621", cpf: "011.484.713-40", city: "Pedreiras", state: "MA", birthDate: "1995-06-06", crm: "10882 MA" },
  { fullName: "Elvis Benyis Baldiviezo Plaza", email: "elvisbaldiviezoplaza@gmail.com", phone: "11972056714", cpf: "019.877.626-81", city: "Santos", state: "SP", birthDate: "1988-06-09", crm: "180274", instagram: "@dr.elvisbaldiviezo" },
  { fullName: "Arthur Felipe Decker", email: "arthur.decker@hotmail.com.br", phone: "48988010161", cpf: "081.034.239-12", city: "Florianópolis", state: "SC", birthDate: "1997-02-05", crm: "250766 SP" },
  { fullName: "Patrick da Silva Penaforte", email: "patrickdasilvapenaforte@gmail.com", phone: "8598440155", cpf: "080.592.383-70", city: "Fortaleza", state: "CE", birthDate: "1999-11-09", crm: "27552" },
  { fullName: "Livia Bodart Latavanha", email: "liviablatavanha@gmail.com", phone: "11991657778", cpf: "123.812.957-98", city: "São Paulo", state: "SP", birthDate: "1995-12-13", crm: "253025-SP", instagram: "@liviabodart" },
  { fullName: "Celso Braga Gomes", email: "celsogomesc@gmail.com", phone: "92985650850", cpf: "054.196.112-87", city: "Manaus", state: "AM", birthDate: "1956-04-28", crm: "CRM 1428 AM", instagram: "@celsobragagomes9" },
  { fullName: "Henrique de Santana Castanheira", email: "henriquecs721@hotmail.com", phone: "11985414464", cpf: "428.843.628-19", city: "Arujá", state: "SP", birthDate: "1993-06-25", crm: "266635", instagram: "@henriquescastanheira" },
  { fullName: "Cláudio Henrique Diniz", email: "dinizclaudiohenrique@gmail.com", phone: "54996428783", cpf: "014.060.120-17", city: "Trindade do Sul", state: "RS", birthDate: "1998-04-05", instagram: "@dinizclaudioh" },
  { fullName: "Gleyldes Gonçalves Guimarães Leão", email: "gleleao@gmail.com", phone: "98982500777", cpf: "973.675.243-72", city: "São Luís", state: "MA", birthDate: "1984-02-28", crm: "15575", instagram: "@dragleyldes.leao" },
  { fullName: "Debora de Paula Ronzella Flandoli", email: "ronzella08@gmail.com", phone: "16988298872", cpf: "345.249.268-01", city: "São José do Rio Preto", state: "SP", birthDate: "1987-06-08", crm: "156711", instagram: "@dradebora_ronzella" },
  { fullName: "Marcial Mathias Benitez Ferreira", email: "mathiasbenitez5@gmail.com", phone: "+595972144214", cpf: "717.378.031-43", city: "Jardim", state: "MS", birthDate: "1997-04-05", crm: "13111", instagram: "@dr.mathiasbenitez" },
  { fullName: "Gledison João Tomasi Rocha", email: "glediatorocha@gmail.com", phone: "11999921515", cpf: "143.880.298-66", city: "São Paulo", state: "SP", birthDate: "1971-01-15", crm: "223909" },
  { fullName: "João Paulo Ramos", email: "iamjoaopauloramos@outlook.com", phone: "81999620484", cpf: "033.683.054-84", city: "Recife", state: "PE", birthDate: "1981-03-04", crm: "31612" },
  { fullName: "Celcilene Marques dos Santos", email: "celcilene_ms@hotmail.com", phone: "98982626793", cpf: "022.050.233-14", city: "São Luís", state: "MA", birthDate: "1991-06-27", crm: "11805", instagram: "@dra.celcilenemarques" },
  { fullName: "Max Fernandes Delilo", email: "maxdelilo@hotmail.com", phone: "75998795050", cpf: "631.841.842-34", city: "Feira de Santana", state: "BA", birthDate: "1979-03-24", crm: "19996", instagram: "@drmaxdelilo" },
  { fullName: "Maxwell e Silva Pereira", email: "drmaxwellpereira@gmail.com", phone: "9884790805", cpf: "993.414.253-87", city: "São Luís", state: "MA", birthDate: "1983-08-02", crm: "6903", instagram: "@drmaxwelloficia" },
  { fullName: "Larissa Bluma Lopes", email: "lablumalopes@gmail.com", phone: "11991890762", cpf: "404.205.208-80", city: "São Paulo", state: "SP", birthDate: "1994-04-15", crm: "273847 SP", instagram: "@dralarissablumalopes" },
  { fullName: "Eliene Vitor Jesus", email: "eliene.jesusvitor@gmail.com", phone: "61999341209", cpf: "015.052.331-94", city: "Terra Nova do Norte", state: "MT", birthDate: "1984-11-25", crm: "16623", instagram: "@dra.eliene_vitor" },
  { fullName: "Mônica Nolasco Morais", email: "monicanolasco_moraes@yahoo.com.br", phone: "21968909474", cpf: "044.072.727-83", city: "Rio de Janeiro", state: "RJ", birthDate: "1974-02-09", crm: "52764671", instagram: "@monicanolasco" },
  { fullName: "Gustavo Rodrigues Lopes", email: "gustavorodrigues_lopes@hotmail.com", phone: "69992569096", cpf: "932.449.082-68", city: "Porto Velho", state: "RO", birthDate: "1993-08-21" },
  { fullName: "Joshemar Fernandes Heringer", email: "joshemarheringer@yahoo.com.br", phone: "31999760010", cpf: "546.829.406-00", city: "Belo Horizonte", state: "MG", birthDate: "1967-03-18", crm: "26660 - MG" },
  { fullName: "Isabella Nogueira de Vasconcelos Reis", email: "reisinv@icloud.com", phone: "64984070057", cpf: "042.070.164-81", city: "Iporá", state: "GO", birthDate: "1984-01-16", crm: "33971" },
  { fullName: "Gibran Leal Vieira", email: "gibranlealvieira@gmail.com", phone: "49988288853", cpf: "041.170.259-96", city: "Lages", state: "SC", birthDate: "1982-07-20", crm: "54613" },
  { fullName: "Amanda Costa Bueno", email: "amandacb22@hotmail.com.br", phone: "4396008569", cpf: "095.837.529-16", city: "Cruz", state: "CE", birthDate: "1997-01-22", crm: "55563", instagram: "@dra.amandacostabueno" },
  { fullName: "Carlos Eduardo Rizzato", email: "carlosrissato1@hotmail.com", phone: "19996056258", cpf: "135.264.018-02", city: "Socorro", state: "SP", birthDate: "1973-05-26", crm: "89385-SP" },
  { fullName: "Natã Fraquetta Pinheiro", email: "natadepinheiro@hotmail.com", phone: "44999223759", cpf: "061.240.239-89", city: "Maringá", state: "PR", birthDate: "1990-10-14", crm: "45652" },
  { fullName: "Francisco de Assis Freitas Nascimento", email: "assisf-12@hotmail.com", phone: "8999264359", cpf: "054.943.693-66", city: "Fernandópolis", state: "SP", birthDate: "1995-07-21", crm: "272619 - SP", instagram: "@drfranciscofreitasn" },
  { fullName: "Maxmiller Ferreira Machado", email: "maxmiller_fm@hotmail.com", phone: "7499414284", cpf: "021.482.135-80", city: "Irecê", state: "BA", birthDate: "1988-02-22", crm: "30665-CREMEB", instagram: "@maxmiller_fm" },
  { fullName: "Marcela Rocha Gomes", email: "dramarcelaresidente@gmail.com", phone: "6299514288", cpf: "007.403.991-10", city: "Goiânia", state: "GO", birthDate: "1992-09-16", crm: "26692-GO", instagram: "@marcela_rg_" },
  { fullName: "Hercules da Cruz", email: "herculesdacruz@hotmail.com", phone: "7798511296", cpf: "270.266.396-68", city: "Barra da Estiva", state: "BA", birthDate: "1955-05-13", crm: "BA-7320", instagram: "@hercules9420" },
  { fullName: "Jefferson Lauriano da Cunha", email: "dr.laurianojefferson@gmail.com", phone: "97981143030", cpf: "097.145.388-82", city: "Santos", state: "SP", birthDate: "1968-06-05", crm: "205212-SP" },
  { fullName: "Rubia Stefanya Santiago Aranha", email: "rubiaaranha@hotmail.com", phone: "38998950866", cpf: "054.685.917-82", city: "Curvelo", state: "MG", birthDate: "1980-05-25", crm: "44656-MG", instagram: "@drarubiaaranhadermato" },
  { fullName: "Erika Alves Coimbra", email: "erikaalvescoimbra@gmail.com", phone: "81982288121", cpf: "030.490.427-96", city: "Caruaru", state: "PE", birthDate: "1973-09-26", crm: "20430-PE", instagram: "@erika_coimbra" },
  { fullName: "Tony Chu Lau", email: "tonychulau@gmail.com", phone: "51993118245", cpf: "004.403.670-18", city: "Ivoti", state: "RS", birthDate: "1983-12-22", crm: "4025 RS", instagram: "@drtonychulau" },
  { fullName: "Cristóvão de Sá Carvalho Filho", email: "cristovaocarvalho0512@outlook.com", phone: "8788420446", cpf: "103.088.024-70", city: "Juazeiro do Norte", state: "CE", birthDate: "1999-12-05", crm: "27594-CE", instagram: "@cristovao_carvalho_" },
  { fullName: "Frederico Fernandes Queiroga", email: "freddqueiroga@gmail.com", phone: "61996415958", cpf: "090.033.976-43", city: "Sobradinho", state: "RS", birthDate: "1988-06-06", crm: "37780-GO", instagram: "@queirogafred" },
  { fullName: "Luiz Alexandre da Silva", email: "luizalexandree123@gmail.com", phone: "96991910752", cpf: "090.770.258-98", city: "Macapá", state: "AP", birthDate: "1958-04-30", crm: "772-AP" },
  { fullName: "Franky Marleo Carvalho Barbosa", email: "dr.franky_marleo@icloud.com", cpf: "64304450387", city: "Penha", state: "SC", birthDate: "1980-02-17", crm: "37746" },
  { fullName: "Emanuele Barreto de Lima", email: "dra.emanuelebarreto@outlook.com", phone: "71999918511", cpf: "024.873.045-29", city: "Irecê", state: "BA", birthDate: "1985-09-23", crm: "42182-BA", instagram: "@dra.emanuelebarreto" },
  { fullName: "João Pedro Girardello Detoni", email: "jpdetoni@yahoo.com.br", phone: "54993646065", cpf: "995.497.510-15", city: "Erechim", state: "RS", birthDate: "1981-08-06", crm: "42912-RS", instagram: "@dr.joaodetoni" },
  { fullName: "Gledson Souza Maia", email: "gledsonmaia88@gmail.com", phone: "6296344121", cpf: "024.657.391-07", city: "Erechim", state: "RS", birthDate: "1988-02-18", crm: "51897-RS", instagram: "@gledsonmaia" },
  { fullName: "Kledson Cavalcante Correia", email: "kledsoncavalcante07@gmail.com", phone: "82996419090", cpf: "104.578.654-31", city: "Arapiraca", state: "AL", birthDate: "1991-08-20", crm: "9954 AL", instagram: "@kledsonncavante" },
  { fullName: "Suyanne Parente Alencar", email: "suyannepsi@gmail.com", phone: "85988847001", cpf: "512.075.833-91", city: "Fortaleza", state: "CE", birthDate: "1975-06-10" },
  { fullName: "Norberto de Souza Paes", email: "doutor.onco@gmail.com", phone: "14996986250", cpf: "137.161.528-46", city: "São Paulo", state: "SP", birthDate: "1970-07-19", crm: "119300-SP" },
  { fullName: "Rogério Smith Freire de Abreu", email: "dr.rogerio.smith@gmail.com", phone: "71993507801", cpf: "785.601.795-34", city: "Lauro de Freitas", state: "BA", birthDate: "1978-12-25", crm: "46149-BA" },
  { fullName: "Vanessa Ramos Zaude", email: "vzaude@gmail.com", phone: "11973213135", cpf: "420.225.408-24", city: "São Paulo", state: "SP", birthDate: "1996-08-16", crm: "222917-SP", instagram: "@vanessazaude" },
  { fullName: "Jean Carlos Romão de Sousa", email: "jeancarlosromaodesousa@gmail.com", phone: "11989057272", cpf: "975.256.261-20", city: "Guarujá", state: "SP", birthDate: "1984-02-06", crm: "223916 SP", instagram: "@jean_romao18" },
  { fullName: "Taciana Rosa Garcês Moreira", email: "tacigarces@hotmail.com", phone: "61999134086", cpf: "2256944174", city: "Brasília", state: "DF", birthDate: "1990-02-19", crm: "22549 DF", instagram: "@dra.tacianagarce" },
  { fullName: "Gabriel Adriano Parisi", email: "neuromed2021@gmail.com", phone: "11948137465", cpf: "240.940.212-72", city: "Barueri", state: "SP", birthDate: "1965-03-18", crm: "246921-SP" },
  { fullName: "Alberth Terrazas Gallardo", email: "altega20@hotmail.com", phone: "11959431774", cpf: "078.503.531-10", city: "São Paulo", state: "SP", birthDate: "1981-12-29", crm: "T-939" },
  { fullName: "Thiago Nobrega de Oliveira", email: "tnoliveira@gmail.com", phone: "81995099999", cpf: "032.303.354-73", city: "Recife", state: "PE", birthDate: "1975-05-23", crm: "19512-PE", instagram: "@_thiagonobrega" },
  { fullName: "Giovanna Maria Dantas Murinelli", email: "giovannamurinelli@gmail.com", phone: "8597185582", cpf: "067.980.653-92", city: "Fortaleza", state: "CE", birthDate: "1997-05-02", crm: "29617 CE", instagram: "@dragiovannamurinelli" },
  { fullName: "Luís Alberto Vasquez Vasquez", email: "cm8lav@gmail.com", phone: "9998169163", cpf: "066.216.611-69", city: "São Raimundo das Mangabeiras", state: "MA", birthDate: "1969-09-30", crm: "13437/MA", instagram: "@c.m.integrativa13437" },
  { fullName: "Régia Débora Cardoso da Silva Reis", email: "regiareis103100@outlook.com", phone: "8899127049", cpf: "012.754.343-04", city: "Limoeiro do Norte", state: "CE", birthDate: "1985-10-17", crm: "29884", instagram: "@dr.alefmarchezi" },
  { fullName: "Leandro Aparecido Irrazabal", email: "leandro.irrazabal@hotmail.com", phone: "51988482822", cpf: "045.806.776-84", city: "Torres", state: "RS", birthDate: "1982-02-27", crm: "51796", instagram: "@leandroirrazabal" },
  { fullName: "Emerson Marcos Ravanello", email: "emravanello@yahoo.com", phone: "51981269159", cpf: "000.847.547-45", city: "Vila Velha", state: "ES", birthDate: "1975-08-01", crm: "21984-ES", instagram: "@emerson_m_ravanello" },
  { fullName: "Camila de Souza Barbosa Paixão", email: "cpaixao123@hotmail.com", phone: "31985802755", cpf: "099.752.066-38", city: "Sete Lagoas", state: "MG", birthDate: "1991-01-30", crm: "16594295 MG" },
  { fullName: "Alef Marchezi Pereira", email: "alefmarchechezi@gmail.com", phone: "18981937944", cpf: "414.477.108-35", city: "Pacaembu", state: "SP", birthDate: "1993-12-14", crm: "257401-SP", instagram: "@dr.alefmarchezi" },
  { fullName: "Clarissa Cardoso Rego", email: "clarissareggo@live.com", phone: "38991292304", cpf: "063.548.326-25", city: "São Bento do Sul", state: "SC", birthDate: "1983-04-23", crm: "2805-SC", instagram: "@clarissarego" },
  { fullName: "Jemima Rodrigues de Souza", email: "jemima470@gmail.com", phone: "6899314935", cpf: "008.351.852-57", city: "Fortaleza", state: "CE", birthDate: "1991-03-20", crm: "23167-CE", instagram: "@jemima_rodrigues_" },
  { fullName: "Leonardo Lincoln de Melo Chaga", email: "dr.leomelo@hotmail.com", phone: "6684044999", cpf: "899.050.401-53", city: "Alto Araguaia", state: "MT", birthDate: "1981-12-18", crm: "4912-MT", instagram: "@dr.leonardolincoln" },
  { fullName: "Jorge Renato Gomez Gonzales", email: "jorge.r.gomezgonzales@hotmail.com", phone: "68992369097", cpf: "910.696.612-87", city: "Massapê", state: "CE", birthDate: "1988-08-17", crm: "30066-CE", instagram: "@jorgerenatogg" },
  { fullName: "Carlos Rodolfo Schlischka", email: "drcarlos.schlischka@gmail.com", phone: "65992517846", cpf: "248.523.846-49", city: "Cuiabá", state: "MT", birthDate: "1957-08-19", crm: "2187-MT", instagram: "@dr.carlos.schlischka_oficial" },
  { fullName: "Felipe Teles de Arruda", email: "ftarruda@hotmail.com", phone: "38992694004", cpf: "384.119.078-21", city: "Curvelo", state: "MG", birthDate: "1989-06-06", crm: "CRM MG 78977", instagram: "@defelipeteles" },
  { fullName: "Ana Flávia Pierazo Rodrigues", email: "anapierazor@gmail.com", phone: "6299520709", cpf: "408.381.848-47", city: "Goiânia", state: "GO", birthDate: "1997-07-05", crm: "32604-GO", instagram: "@dra.anapierazo" },
  { fullName: "Fabio Branaro", email: "fabiobranaro@hotmail.com", phone: "11973041553", cpf: "078.758.387-11", city: "Santo André", state: "SP", birthDate: "1978-07-06", crm: "138003-SP" },
  { fullName: "Flavio Henrique Nogueira Machado", email: "flavioau@outlook.com", phone: "31998071017", cpf: "068.888.596.90", city: "São Paulo", state: "SP", birthDate: "1984-10-17", crm: "176872", instagram: "@flavioau_" },
  { fullName: "Robister Moreno de Oliveira Mac Cornick", email: "mrobister@gmail.com", phone: "67996984849", cpf: "005069121-08", city: "Corumbá", state: "MS", birthDate: "1958-05-22", crm: "4759 MA", instagram: "@robistermdeo" },
  { fullName: "Osmel Pompa Hernandez", email: "osmelpompa@yahoo.es", phone: "63984583394", cpf: "065.593.701-35", city: "Colinas do Tocantins", state: "TO", birthDate: "1972-09-10", crm: "4759 MA" },
  { fullName: "Marcia San Juan Dertkigil", email: "mdertkigil@uol.com.br", phone: "11999008765", cpf: "166.373.238-88", city: "São Paulo", state: "SP", birthDate: "1973-04-07", crm: "91277-SP", instagram: "@dramarcia.dertkigil" },
  { fullName: "Eder Eiji Yanagitani", email: "yanagitani@hotmail.com", phone: "11967318820", cpf: "620.616.749-68", city: "São Paulo", state: "SP", birthDate: "1967-07-13", crm: "84136", instagram: "@eijieder" },
  { fullName: "Thalles Henrique Rodrigues Borges", email: "thallesh.borges@gmail.com", phone: "62991484664", cpf: "032.737.671-62", city: "Goiânia", state: "GO", birthDate: "1995-05-13", crm: "31458 -GO" },
  { fullName: "Geovanna Araújo Maciel", email: "araujoo.geovanna@gmail.com", phone: "7381570125", cpf: "018.450.481-30", city: "Itabuna", state: "BA", birthDate: "1998-09-06", crm: "49006-BA" },
  { fullName: "Diego Henrique de Oliveira", email: "8diegooliveira@gmail.com", phone: "14981836275", cpf: "391.210.738-64", city: "Jáu", state: "SP", birthDate: "1992-07-21" },
  { fullName: "Deibson Santos Lisboa", email: "deibsonlisboa1995@gmail.com", phone: "98985036157", cpf: "608.704.773-58", city: "Lauro de Freitas", state: "BA", birthDate: "1995-06-26", crm: "44812-BA", instagram: "@deibson.lisboa" },
  { fullName: "Monica Fabricia Nogueira", email: "nogueiramonicafabricia@gmail.com", phone: "21991403861", cpf: "013.925.872-80", city: "Dianópolis", state: "TO", birthDate: "1992-12-25", crm: "521322915 - RJ" },
  { fullName: "Olga Marina Barbosa de Aguiar Fernandes", email: "draolgabarbosa@hotmail.com", phone: "69993928799", cpf: "008.986.752-19", city: "Criciúma", state: "SC", birthDate: "1992-02-14", crm: "34385 SC" },
  { fullName: "Sandra Cristina Haas", email: "sicoracath23@gmail.com", phone: "55999935550", cpf: "66914663068", city: "Três de Maio", state: "RS", birthDate: "1970-11-03", crm: "128705 - SP" },
  { fullName: "Samylla de Barros Pereira", email: "samyllabarrospereira1989@hotmail.com", phone: "6696828588", cpf: "030.103.691-82", city: "Terra Nova do Norte", state: "MT", birthDate: "1989-09-29", crm: "15950-MT" },
  { fullName: "Sankler de Barros Pereira", email: "sanklerdbarros@gmail.com", phone: "66997263734", cpf: "1619709155", city: "Terra Nova do Norte", state: "MT", birthDate: "1985-10-30", crm: "13295 - MT" },
  { fullName: "Joselio Alves Sousa", email: "joselio0611@gmail.com", phone: "9898474739", cpf: "475.901.573-68", city: "São Luís", state: "MA", birthDate: "1972-07-02", crm: "6529-MA", instagram: "@dr_joselioalves" },
  { fullName: "Lucas Lima Guimarães", email: "drlucaslimaguimaraes@gmail.com", phone: "42991413108", cpf: "073.268.939-26", city: "Piraí do Sul", state: "PR", birthDate: "1991-07-17", crm: "51494-PR" },
  { fullName: "Lucas Carvalho Silva", email: "lucascarvalhomedic@gmail.com", phone: "6281397890", cpf: "047.424.281-10", city: "Goiânia", state: "GO", birthDate: "1995-05-05", crm: "25863-GO" },
  { fullName: "Theodore Chukwudi Muojeke", email: "thcm2003@aol.com", phone: "11973375404", cpf: "442.145.294-72", city: "Cotia", state: "SP", birthDate: "1965-09-15", crm: "99115-SP" },
  { fullName: "Adyr Augusto da Silva Bastos", email: "adyrbastos@hotmail.com", phone: "11982072000", cpf: "177120682-91", city: "Jundiaí", state: "SP", birthDate: "1961-07-28", crm: "48585 - SP" },
  { fullName: "Elielson Nascimento d'Oliveira", email: "elielsonend@gmail.com", phone: "91993455441", cpf: "593.502.372-53", city: "Ananindeua", state: "PA", birthDate: "1976-03-12", crm: "19689" },
  { fullName: "Mario Cezar da Motta", email: "mariocdamotta@gmail.com", phone: "51996999594", cpf: "029.875.230-17", city: "Ivoti", state: "RS", birthDate: "1993-01-25", crm: "50036 - RS", instagram: "@drmariocezarmotta" },
  { fullName: "Julio Cesar Moyses Vieira", email: "drjcmv07@gmail.com", phone: "1167318820", cpf: "103.391.806-76", city: "São Borja", state: "RS", birthDate: "1991-04-07", crm: "59272", instagram: "@juliomoyses" },
  { fullName: "Gelson Nei Vaz dos Santos", email: "drgelsonsantos@gmail.com", phone: "66999892198", cpf: "365.994.330-49", city: "Matupá", state: "MT", birthDate: "1961-03-09", crm: "9317 MT", instagram: "@gelson.nei" },
  { fullName: "Carlos de Nigris Gonzalez", email: "carlos_denigris@hotmail.com", phone: "11960767412", cpf: "36855153810", city: "Santana de Parnaíba", state: "SP", birthDate: "1988-10-20", crm: "156659" },
  { fullName: "Jeferson Fernando Abreu Inacio", email: "drjefersonabreu@gmail.com", phone: "16992406270", cpf: "063.093.811-30", city: "Ribeirão Preto", state: "SP", birthDate: "2000-08-05" },
  { fullName: "Cíntia de Andrade", email: "dracintia@outlook.com", phone: "11973383912", cpf: "297.102.638-89", city: "Guarulhos", state: "SP", birthDate: "1983-01-21", crm: "249051/SP", instagram: "@dra.cintiaandrade" },
  { fullName: "Reynier Fernandez Leon", email: "liurey89@gmail.com", phone: "93981212267", cpf: "085.906.411-55", city: "Angra dos Reis", state: "RJ", birthDate: "1989-06-01", crm: "521315552" },
  { fullName: "Bruno Leôncio Bezerra Leme de Carvalho", email: "brunodmba@gmail.com", phone: "69993193709", cpf: "059.721.885-46", city: "Vilhena", state: "RO", birthDate: "1997-05-06", crm: "8614 RO", instagram: "@brunobezerralc" },
  { fullName: "Sara Abigail Burgoa Alfaro", email: "sarita18bg@gmail.com", phone: "11988623063", cpf: "901.804.548-97", city: "Guarulhos", state: "SP", birthDate: "1993-04-25" },
  { fullName: "Vinícius Guimarães", email: "redeaudaz@gmail.com", phone: "6294830656", cpf: "150.650.858-89", city: "Goiânia", state: "GO", birthDate: "1970-02-28", crm: "36106-GO" },
  { fullName: "André Luis Chaves Valente", email: "andrevalente1974@gmail.com", phone: "82999683887", cpf: "911.719.042-72", city: "Maceió", state: "AL", birthDate: "1974-08-12", crm: "3940 - AL", instagram: "@andre__valente" },
  { fullName: "Virginia Piramides Coura Martins de Loyola", email: "vpcmartins@gmail.com", phone: "31881184866", cpf: "074.120.636-69", city: "Belo Horizonte", state: "MG", birthDate: "1998-12-30", crm: "90827 MG" },
  { fullName: "Francini Spillere Tanquella", email: "frantanquella@gmail.com", phone: "48999230757", cpf: "084.058.899-22", city: "Santa Luzia", state: "MG", birthDate: "1998-04-02", crm: "97777 - MG" },
  { fullName: "Gabriel Leorne Chumare", email: "gabrielelchuma@gmail.com", phone: "31972223321", cpf: "023.319.882-26", city: "Toledo", state: "PR", birthDate: "1995-05-14", instagram: "@gabriellchuma" },
  { fullName: "Tamires Paiva Meira", email: "dra.tamiresmeira@gmail.com", phone: "73988123364", cpf: "037.354.185-62", city: "Vereda", state: "BA", birthDate: "1993-03-26" },
  { fullName: "Francisco Cortez Soares de Alencar Neto", email: "cortezneto14@gmail.com", phone: "9284547230", cpf: "743.589.872.49", city: "Manaus", state: "AM", birthDate: "1982-08-24", crm: "RMS 1301396" },
  { fullName: "Júlio César Barbosa", email: "jcmedhomeopatia@gmail.com", phone: "27999816884", cpf: "422.356.346-72", city: "Vitória", state: "ES", birthDate: "1961-12-27", crm: "ES 8050", instagram: "@drjuliocesarbarbosa" },
  { fullName: "Ilka Betania Onofre Tavares", email: "ilkagueiros@hotmail.com", phone: "8798140990", cpf: "052.845.164-27", city: "Garanhuns", state: "PE", birthDate: "1989-04-17", crm: "27052 PE", instagram: "@drailkagueiros" },
  { fullName: "Odenir Pereira Gomes", email: "drodenir@gmail.com", phone: "19982438889", cpf: "516.147.588-91", city: "São Pedro", state: "SP", birthDate: "1952-06-03", crm: "189130 SP" },
  { fullName: "José de Paula Jorge Filho", email: "jpjdefilho@gmail.com", phone: "4598413222", cpf: "018.297.029-98", city: "Cascavel", state: "PR", birthDate: "1976-02-08", instagram: "@instituto.harmonizare" },
  { fullName: "Rodrigo Mitchell Pereira da Silva", email: "rodrigomitchell1974@gmail.com", phone: "61996465243", cpf: "035.403.997-04", city: "Brasília", state: "DF", birthDate: "1974-05-07", crm: "Cremesp 129133", instagram: "@rodrigomitchell" },
  { fullName: "Dilza Maria Cândida de Oliveira", email: "colliviebrasil@gmail.com", phone: "8396022055", cpf: "005.256.911-03", city: "Morrinhos", state: "GO", birthDate: "1983-02-01", crm: "Paraguai - 34754", instagram: "@candoli01" },
  { fullName: "Arlen Duarte Monteiro", email: "arlenmontteiro@hotmail.com", phone: "96990305566", cpf: "003.383.812-79", city: "Santana", state: "AP", birthDate: "1991-01-07", crm: "3074", instagram: "@arlenmonteiro" },
  { fullName: "Yaima Delgado Pedroso", email: "yaimad2010@yahoo.es", phone: "7781363099", cpf: "065.587.451-86", city: "Poções", state: "BA", birthDate: "1985-05-02", instagram: "@delgadoyaima" },
  { fullName: "Francisco Lopes Netto", email: "chicolopesnetto@outlook.com", phone: "62984651502", cpf: "041.558.211-33", city: "Goianésia", state: "GO", birthDate: "1998-03-25", crm: "31197 - GO", instagram: "@chicolopesn" },
  { fullName: "Camila Cristine de Moraes Soares", email: "cmilamsoares@gmail.com", phone: "98981264184", cpf: "037.618.103-69", city: "São Luís", state: "MA", birthDate: "1991-05-23", crm: "48905 BA", instagram: "@cmilamoraess" },
  { fullName: "Mariane Torres João", email: "marianetorresjoao@gmail.com", phone: "17981184992", cpf: "362.584.538-56", city: "Santa Fé do Sul", state: "SP", birthDate: "1987-06-16", crm: "275254 - SP", instagram: "@maritorresjoao" },
  { fullName: "Edmundo Roberto Navarro da Costa", email: "e.roberto.costa@uol.com.br", phone: "11992271355", cpf: "084.895.038-00", city: "São Paulo", state: "SP", birthDate: "1966-05-14", crm: "80610" },
  { fullName: "Livia Alana Silva de Souza Gomes", email: "contato@draliviaalana.com.br", phone: "33997349118", cpf: "060.757.186-13", city: "Pocrane", state: "MG", birthDate: "1984-08-25", crm: "MG - 80962", instagram: "@doutoraliviaalana" },
  { fullName: "Roberto Stoppe", email: "stproberto@gmail.com", phone: "11955776441", cpf: "714.695.338-04", city: "São Paulo", state: "SP", birthDate: "1969-06-14", crm: "CRM 78086 - SP" },
  { fullName: "Alexandre Orlandi França", email: "orlandifranca@yahoo.com.br", phone: "31995128139", cpf: "217.618.336-34", city: "Lagoa Santa", state: "MG", birthDate: "1951-06-01", crm: "9424", instagram: "@alexandreorlandifranca" },
  { fullName: "Paulo Gabriel de Oliveira Cerquinho", email: "paulocerquinho@hotmail.com", phone: "81997583512", cpf: "119.239.934-02", city: "Recife", state: "PE", birthDate: "1998-01-08", crm: "31728 PE" },
  { fullName: "Franklin Cavalcante Braga", email: "franklinbraga@yahoo.com", phone: "77981012222", cpf: "127417524", city: "Rionópolis", state: "BA", birthDate: "1882-08-05", crm: "19611-BA" },
  { fullName: "Raynrich Kevin Assis Lima", email: "raynrich_kevin@hotmail.com", phone: "85999698344", cpf: "665.404.963-20", city: "Fortaleza", state: "CE", birthDate: "1998-08-23", crm: "30237 - CE" },
  { fullName: "Patricio Carvalho de Barros", email: "patricio-cb@hotmail.com", phone: "98989221961", cpf: "255.768.013-34", city: "São Luís", state: "MA", birthDate: "1961-03-24", crm: "2104" },
  { fullName: "Caroline de Souza Cavalcanti", email: "cdesouzacavalcanti@gmail.com", phone: "83996959183", cpf: "095.832.614-24", city: "João Pessoa", state: "PB", birthDate: "1992-12-14", crm: "15990 PB" },
  { fullName: "Maykon Ribeiro", email: "maykonribeiro4703@gmail.com", phone: "49911393988", cpf: "923.691.979-00", city: "Fraiburgo", state: "SC", birthDate: "1978-10-27", crm: "40720" },
  { fullName: "Luis Marcel Hiroshiyo Kiyomura", email: "marcel_kiyomura@hotmail.com", phone: "17997071590", cpf: "360.577.698-13", city: "São José do Rio Preto", state: "SP", birthDate: "1987-07-10", crm: "280083", instagram: "@marcel_kiyomura" },
  { fullName: "Paulo Batista da Costa Neto", email: "paulob.costaneto@hotmail.com", phone: "96911415022", cpf: "022.409.972-81", city: "Macapá", state: "AP", birthDate: "1996-01-10", crm: "3370", instagram: "@paulob_" },
  { fullName: "Alessandra Marques Figueira Muoio", email: "alemuoio@gmail.com", phone: "11959317260", cpf: "170.223.848-27", city: "São Paulo", state: "SP", birthDate: "1973-12-23", crm: "101818 SP", instagram: "@draalessandra" },
  { fullName: "Nilson Paula da Silva Junior", email: "nilsonsilvajr@hotmail.com", phone: "17991137151", cpf: "386.271.668-62", city: "Palhoça", state: "SC", birthDate: "1992-08-31", instagram: "@nilsonsilvajunior" },
  { fullName: "Thiago Barreto Marques da Silva", email: "thiagobmarques@gmail.com", phone: "11995127193", cpf: "321.273.048-02", city: "São Paulo", state: "SP", birthDate: "1982-04-01", crm: "140637", instagram: "@thiagobmarques" },
  { fullName: "Viviane Mendes Gonçalves", email: "vivimendesg7@yahoo.com.br", phone: "38991657291", cpf: "060.136.316-70", city: "Ribeirão Preto", state: "SP", birthDate: "1982-10-31", crm: "276584 - SP", instagram: "@vivimendes" },
  { fullName: "Jackeline Pereira da Silva", email: "jackeline.med2010@gmail.com", phone: "62992108700", cpf: "004.390.412-28", city: "Campo Largo", state: "PR", birthDate: "1989-09-05", crm: "56417", instagram: "@jackelinepereiramed" },
  { fullName: "Eduardo Fernandes Baima", email: "eduardobaima777@gmail.com", phone: "85998050137", cpf: "056.311.193-31", city: "Fortaleza", state: "CE", birthDate: "1994-11-20", crm: "25619", instagram: "@dr.eduardobaima" }
];

function generatePassword(name: string): string {
  // Gerar senha padrão: Primeira letra maiúscula do nome + "Ibramec@2025"
  const firstName = name.split(" ")[0];
  return `${firstName}@2025!`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const results: { email: string; status: string; message: string }[] = [];
    const credentials: { nome: string; email: string; senha: string }[] = [];

    console.log(`Processing ${students.length} students...`);

    for (const student of students) {
      try {
        const password = generatePassword(student.fullName);
        let userId: string;
        
        // Try to create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: student.email.toLowerCase().trim(),
          password: password,
          email_confirm: true,
          user_metadata: { full_name: student.fullName }
        });

        if (authError) {
          if (authError.message.includes("already been registered")) {
            // Get existing user
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === student.email.toLowerCase().trim());
            
            if (!existingUser) {
              results.push({ email: student.email, status: "skipped", message: "User exists but not found" });
              continue;
            }
            
            userId = existingUser.id;
          } else {
            throw authError;
          }
        } else {
          userId = authData.user.id;
        }

        // Check if neohub_user exists
        const { data: existingNeoUser } = await supabaseAdmin
          .from("neohub_users")
          .select("id")
          .eq("user_id", userId)
          .single();

        let neoUserId: string;

        if (existingNeoUser) {
          neoUserId = existingNeoUser.id;
          
          // Update user info
          await supabaseAdmin
            .from("neohub_users")
            .update({
              full_name: student.fullName,
              phone: student.phone,
              cpf: student.cpf,
              address_city: student.city,
              address_state: student.state,
              birth_date: student.birthDate,
              crm: student.crm,
              instagram_personal: student.instagram,
              is_active: true
            })
            .eq("id", neoUserId);
        } else {
          // Create neohub_user
          const { data: newNeoUser, error: neoUserError } = await supabaseAdmin
            .from("neohub_users")
            .insert({
              user_id: userId,
              email: student.email.toLowerCase().trim(),
              full_name: student.fullName,
              phone: student.phone,
              cpf: student.cpf,
              address_city: student.city,
              address_state: student.state,
              birth_date: student.birthDate,
              crm: student.crm,
              instagram_personal: student.instagram,
              is_active: true
            })
            .select()
            .single();

          if (neoUserError) throw neoUserError;
          neoUserId = newNeoUser.id;
        }

        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from("neohub_user_profiles")
          .select("id")
          .eq("neohub_user_id", neoUserId)
          .eq("profile", "aluno")
          .single();

        if (!existingProfile) {
          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from("neohub_user_profiles")
            .insert({
              neohub_user_id: neoUserId,
              profile: "aluno",
              is_active: true
            });

          if (profileError) throw profileError;
        } else {
          // Ensure profile is active
          await supabaseAdmin
            .from("neohub_user_profiles")
            .update({ is_active: true })
            .eq("id", existingProfile.id);
        }

        results.push({ 
          email: student.email, 
          status: "success", 
          message: `Aluno ${student.fullName} criado` 
        });

        credentials.push({
          nome: student.fullName,
          email: student.email.toLowerCase().trim(),
          senha: password
        });

      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : "Unknown error";
        console.error(`Error processing ${student.email}:`, errorMessage);
        results.push({ email: student.email, status: "error", message: errorMessage });
      }
    }

    const successCount = results.filter(r => r.status === "success").length;
    const errorCount = results.filter(r => r.status === "error").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Importação concluída! ${successCount} alunos criados, ${skippedCount} já existiam, ${errorCount} erros.`,
        summary: {
          total: students.length,
          success: successCount,
          skipped: skippedCount,
          errors: errorCount
        },
        results,
        credentials
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
