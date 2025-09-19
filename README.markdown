# Integração WhatsApp-Groq

Este projeto integra o Groq com o WhatsApp para permitir respostas automáticas a mensagens de contatos permitidos. Siga os passos abaixo para configurar e usar a aplicação.

## Pré-requisitos
- Docker instalado
- Conta no Groq com chave de API
- Ambiente Node.js (se executar sem Docker)
- Conta no WhatsApp para escanear o QR code

## Instruções de Configuração

1. **Obtenha a Chave de API do Groq**:
   - Acesse [Groq](https://groq.com) e crie uma conta para gerar uma chave de API.

2. **Crie o Arquivo `.env`**:
   - Na raiz do projeto, crie um arquivo `.env`.
   - Adicione a seguinte linha, substituindo `SuaChave` pela sua chave de API do Groq (sem espaços ou ponto e vírgula):
     ```
     GROQ_API_KEY=SuaChave
     ```

3. **Execute a Aplicação**:
   - Execute o seguinte comando para construir e iniciar os contêineres Docker:
     ```bash
     docker compose up --build
     ```

4. **Acesse a Documentação da API**:
   - Abra o navegador e acesse [http://localhost:3000/api-docs](http://localhost:3000/api-docs) para visualizar a documentação da API.

5. **Inicie uma Sessão**:
   - Use o endpoint `/start/:sessionName` para iniciar uma nova sessão, substituindo `:sessionName` por um nome de sessão único.

6. **Gere o QR Code**:
   - Acesse [http://localhost:3000/qr/:sessionName](http://localhost:3000/qr/:sessionName) no navegador, substituindo `:sessionName` pelo nome da sessão usado no passo 5.
   - Observação: Pode levar algum tempo para o QR code ser gerado.
   - Escaneie o QR code com o aplicativo móvel do WhatsApp para conectar a sessão.

7. **Permita Contatos**:
   - Volte para [http://localhost:3000/api-docs](http://localhost:3000/api-docs).
   - Use o endpoint `/allowContacts/:sessionName` para adicionar contatos à lista de permitidos.
   - Adicione os nomes dos contatos desejados à lista.
   - Ele vai considerar o nome que você colocou no contato da pessoa.

8. **Respostas Automáticas**:
   - Quando um contato da lista de permitidos enviar uma mensagem, o Groq responderá automaticamente.
   - **Importante**: Não abra ou interaja com a conversa no WhatsApp enquanto a automação estiver ativa, pois isso pode interferir no funcionamento do bot.

## Rotas Disponíveis da API

- **`/status/:sessionName`**:
  - Retorna o status da sessão (conectado/desconectado) e a lista de contatos permitidos.
  - Observação: A sessão deve estar conectada (QR code escaneado) para funcionar.

- **`/delete/:sessionName`**:
  - Deleta a sessão especificada, se estiver conectada.

## Observações Adicionais
- Certifique-se de ter uma conexão estável com a internet para escanear o QR code e processar mensagens.
- Leia o código-fonte para um entendimento mais profundo dos detalhes da implementação.
- Em caso de problemas, verifique a configuração do arquivo `.env` e assegure-se de que os contêineres Docker estão funcionando corretamente.