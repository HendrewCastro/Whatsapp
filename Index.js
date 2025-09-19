const swaggerJsDoc = require('swagger-jsdoc'); //Swagger é usado para A UI da API
const swaggerUi = require('swagger-ui-express');


// Importa o framework Express para criar um servidor web
const express = require('express');

// Importa o WhatsApp Web.js e o LocalAuth para gerenciar sessões do WhatsApp
const { Client, LocalAuth } = require('whatsapp-web.js');

// Importa o pacote qrcode para gerar QR codes em imagens
const qrcode = require('qrcode');


// Importa módulos nativos do Node.js para manipulação de arquivos e caminhos
const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '.wwebjs_auth'); //apth.join junta caminhos, ex: users/teste/Whatsapp, _Dirname é a pasta em que o index.js está

if (fs.existsSync(rootPath)) { //Verifica se o caminho existe
  fs.rmSync(rootPath, { recursive: true, force: true });
  console.log('Todas as pastas de sessão foram apagadas.');
} else {
  console.log('Pasta de sessões não existe.');
}

// Cria uma instância do Express (nosso servidor)
const app = express();


// Define a porta que o servidor vai "escutar" (onde você acessa no navegador)
const PORT = 3000;

// Objeto para armazenar todos os clientes do WhatsApp em memória
// A chave será o nome da sessão e o valor será o client do whatsapp-web.js
const sessions = {};

// Objeto para armazenar o último QR code gerado por cada sessão
// Usamos isso para exibir o QR no navegador
const sessionQRs = {};

// Os contatos de cada sessao
const sessionContacts = {}


// Para mandar Json para a API
app.use(express.json())

// A URL da API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// A Chave da API que esta no .env, Se nao tiver uma Crie no Groq e Escreva GROQ_API_KEY=xxxxx
// SEM ; OU ESPAÇOS!!!

const API_KEY = process.env.GROQ_API_KEY;


const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API WhatsApp Web.js",
      version: "1.0.0",
      description: "API para gerenciar sessões WhatsApp com QR code e allowed contacts"
    },
    servers: [
      { url: "http://localhost:3000" }
    ]
  },
  apis: ["./Index.js"], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


/**
 * @swagger
 * /Groq/{message}:
 *   get:
 *     summary: Chama o Groq
 *     parameters:
 *       - in: path
 *         name: message
 *         required: true
 *         schema:
 *           type: string
 *         description: Mensagem
 *     responses:
 *       200:
 *         description: .
 */

app.get('/Groq/:message', async (req, res) => { // Essa rota serve para testar a comunicação com o GROQ Use o api-docs de preferencia
  var msg = req.params.message // Pega oq vc mandou pela rota
  console.log(`Bearer ${API_KEY}`) 
  const resposta = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization' : `Bearer ${API_KEY}`,
            'Content-Type' : 'application/json'

          },
          body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
              { role: "user", content: msg } // Content é o que vai mandar para o groq
            ],
          })
        });
        const dados = await resposta.json();
        console.log(dados) // Para testes

        const RespostaTxt = dados.choices[0].message.content // Basicamente a resposta do Groq Tem um formato de Json com listas etc, usamos isso para resgatar somente a resposta
        console.log(RespostaTxt) 

})

/**
 * @swagger
 * /Lista/{sessionName}:
 *   post:
 *     summary: Envia mensagem para a fila de uma sessão
 *     parameters:
 *       - in: path
 *         name: sessionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da sessão
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Olá, teste"
 *     
 */


app.post('/Lista/:sessionName', async (req, res) => { // Essa rota serve para testar a comunicação com o GROQ Use o api-docs de preferencia
  var msg = req.body // Pega oq vc mandou pela rota
  var sessionName = req.params.sessionName
  const resposta = await fetch(`http://chanel:3001/send/${sessionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // importante
      body: JSON.stringify({
        message: msg,
        session: sessionName
      })
    });

     const dados = await resposta.json();
     console.log(dados)

})

/**
 * @swagger
 * /start/{sessionName}:
 *   get:
 *     summary: Inicia uma sessão do WhatsApp
 *     parameters:
 *       - in: path
 *         name: sessionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da sessão
 *     responses:
 *       200:
 *         description: Sessão iniciada com sucesso
 */

app.get('/start/:sessionName', async (req, res) => { 
  // Pega o nome da sessão da URL, ex: /start/hendrew → sessionName = "hendrew"
  const { sessionName } = req.params;
  
  // Verifica se já existe um client em memória com esse nome
  if (sessions[sessionName]) {
    return res.send(`Sessão "${sessionName}" já existe.`);
  }

  // Cria um novo client do WhatsApp usando LocalAuth
  // LocalAuth salva a sessão no disco, assim não precisa escanear QR toda hora
  const client = new Client({
    puppeteer:{
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    authStrategy: new LocalAuth({ clientId: sessionName })
  });

  // Evento que dispara quando o WhatsApp precisa gerar um QR code
  client.on('qr', (qr) => {
    // Salva o QR no objeto sessionQRs para poder exibir depois
    sessionQRs[sessionName] = qr;
  });

  // Evento que dispara quando a sessão está pronta (cliente logado no WhatsApp)
  client.on('ready', () => {
    console.log(`Sessão ${sessionName} conectada!`);
  });

  client.on('error', (err) => console.error('Client error:', err)); //Manda o Erro no Console

  client.on('message',  async msg => { //Quando alguem mandar uma mensagem
    var contacts = sessionContacts[sessionName] || [] //Verifica se O User Adicionou contatos permitidos, se não ele pega uma lista vazia
    const contact = await msg.getContact(); //pegar dados do contato da pessoa que mandou a mensagem
    var chatId = msg.from //De quem veio a mensagem
    if (contacts.length === 0) return; // Se não tiver nenhum contato na lista ele volta
    if (contacts.includes(contact.name)){ // Se na Lista de contatos tiver o nome do contato ele continua
      console.log(`mensagem para ${client.info.pushname} de ${contact.name}: ${msg.body}`) // Mensagem para o cliente (User) de (Quem mandou a mensagem): (Conteudo da mensagem)
      try{
        const resposta = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization' : `Bearer ${API_KEY}`,
            'Content-Type' : 'application/json'

          },
          body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
              { role: "user", content: msg.body }
            ],
          })
        });
        const dados = await resposta.json();
        console.log(dados)

        const RespostaTxt = dados.choices[0].message.content // Primeira choice, a parte de mensagens e a parte de content
        
        client.sendMessage(chatId, RespostaTxt) // Manda uma mensagem para a pessoa que mandou com o texto do Groq


      }catch (err) {
        console.error(err);
        console.log("Erro ao chamar o Groq")
      }



    }
  });

  // Inicializa o client (começa a conexão com o WhatsApp)
  client.initialize();

  // Salva o client no objeto sessions, assim podemos acessar depois pelo nome
  sessions[sessionName] = client;

  // Responde no navegador que a sessão foi iniciada
  res.send(`Sessão "${sessionName}" iniciada! Use /qr/${sessionName} para pegar o QR.`);
});


/**
 * @swagger
 * /qr/{sessionName}:
 *   get:
 *     summary: Retorna o QR code da sessão
 *     parameters:
 *       - in: path
 *         name: sessionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da sessão
 *     responses:
 *       200:
 *         description: QR code retornado com sucesso
 *         content:
 *           text/html:
 *                
 */

app.get('/qr/:sessionName', async (req, res) => {
  const { sessionName } = req.params;

  // Pega o QR code armazenado para essa sessão
  const qr = sessionQRs[sessionName];

  // Se não existir QR, significa que o client já está logado ou não gerou QR
  if (!qr) {
    return res.send(`Nenhum QR disponível para a sessão "${sessionName}".`);
  }

  // Converte o QR code em uma imagem base64 para exibir no navegador
  const qrImage = await qrcode.toDataURL(qr);

  // Exibe o QR code dentro de uma página HTML simples
  res.send(`<h2>QR da sessão: ${sessionName}</h2><img src="${qrImage}"/>`);
});


/**
 * @swagger
 * /status/{sessionName}:
 *   get:
 *     summary: Retorna o status da sessão
 *     parameters:
 *       - in: path
 *         name: sessionName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status da sessão
 */

app.get('/status/:sessionName', (req, res) => {
  const client = sessions[req.params.sessionName];

  // Se não existir client com esse nome, retorna que a sessão não existe
  if (!client) return res.send(`Sessão "${req.params.sessionName}" não existe.`);

  // Verifica se o client está pronto (client.info existe depois do 'ready')
  // Se estiver, retorna "conectado", se não, "desconectado"
  res.send(`Sessão "${req.params.sessionName}" status: ${client.info ? 'conectado' : 'desconectado'}, Contatos Permitidos: ${sessionContacts[req.params.sessionName]}`)

});

/**
 * @swagger
 * /AllowContacts/{sessionName}:
 *   post:
 *     summary: Define contatos permitidos para a sessão
 *     parameters:
 *       - in: path
 *         name: sessionName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *     responses:
 *       200:
 *         description: Allowed contacts atualizados
 */


app.post('/AllowContacts/:sessionName/', (req, res) => {
  sessionContacts[req.params.sessionName] = req.body || []
  res.send(`Allowed contacts da sessão "${req.params.sessionName}" atualizados!`);

})

/**
 * @swagger
 * /delete/{sessionName}:
 *   get:
 *     summary: Deleta a sessão do WhatsApp
 *     parameters:
 *       - in: path
 *         name: sessionName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sessão apagada com sucesso
 */

app.get('/delete/:sessionName', async (req, res) => {
  const { sessionName } = req.params;
  const client = sessions[sessionName];

  // Se não existir client com esse nome, retorna erro
  if (!client) return res.send(`Sessão "${sessionName}" não existe.`);

  try {

    if (!client.info) {
      return res.status(400).send(`Sessão "${sessionName}" ainda não está pronta. Aguarde a conexão.`);
    }

    if (client.isConnected()) {
      await client.logout(); // Encerra a sessão do WhatsApp de forma limpa
    }
    await client.destroy(); 
    // Remove o client e o QR do objeto em memória
    delete sessions[sessionName];
    delete sessionQRs[sessionName];

    // Apaga a pasta do LocalAuth no disco para essa sessão

    const sessionPath = path.join(__dirname, 'wwebjs_auth', 'local', sessionName);
    if (fs.existsSync(sessionPath)) {
     fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    // Retorna no navegador que a sessão foi apagada
    res.send(`Sessão "${sessionName}" apagada com sucesso!`);

  } catch (err) {
    console.log('Erro ao destruir client:', err.message);
    res.send(`Erro ao apagar ${sessionName}: ${err.message}`)
  }


});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
