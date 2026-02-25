
## Ajuste da Mensagem de Primeiro Contato HotLeads

### O que muda

1. **Atualizar a imagem** -- Substituir o arquivo `public/images/neofolic-licenca.jpeg` pela nova imagem enviada (logo "Licenca ByNeofolic - Transplante Capilar").

2. **Simplificar a mensagem** -- Remover as duas linhas extras que existem hoje:
   - `"Se em algum momento você preferir não receber mais mensagens, é só me avisar 😊"`
   - O link da imagem colado como texto no final

   A mensagem ficara exatamente assim:
   ```
   Olá, {NOME DO PACIENTE}, tudo bem?

   Meu nome é {NOME DO LICENCIADO} e falo da clínica {NOME DA CLÍNICA}.

   Recebemos seu contato através do seu cadastro no site da Neo Folic, onde você solicitou informações sobre transplante capilar. Somos a clínica credenciada da Neo Folic na sua região. Quero entender melhor o que você está buscando e te explicar como funciona o procedimento.

   Você prefere que eu te ligue ou continuamos por aqui?
   ```

3. **Manter o link da imagem** no final da mensagem para que o WhatsApp gere o preview automaticamente (a API do `wa.me` nao suporta anexos diretamente, apenas texto; incluir a URL e o metodo mais proximo de enviar a imagem).

### Detalhes Tecnicos

- **Arquivo de imagem**: Copiar `user-uploads://WhatsApp_Image_2026-02-25_at_18.11.00.jpeg` para `public/images/neofolic-licenca.jpeg` (substituicao).
- **Arquivo editado**: `src/hooks/useHotLeadsSettings.ts` -- linha 75, ajustar o template da mensagem removendo a frase sobre "nao receber mais mensagens" e o emoji, mantendo o link da imagem no final para preview.
