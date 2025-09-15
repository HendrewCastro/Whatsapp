// index.js

// Importa o framework Express para criar um servidor web
const express = require('express');

// Importa o WhatsApp Web.js e o LocalAuth para gerenciar sessões do WhatsApp
const { Client, LocalAuth } = require('whatsapp-web.js');

// Importa o pacote qrcode para gerar QR codes em imagens
const qrcode = require('qrcode');

// Importa módulos nativos do Node.js para manipulação de arquivos e caminhos
const fs = require('fs');
const path = require('path');

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

// ------------------------- ROTA PARA INICIAR UMA SESSÃO -------------------------
app.get('/start/:sessionName', (req, res) => {
  // Pega o nome da sessão da URL, ex: /start/hendrew → sessionName = "hendrew"
  const { sessionName } = req.params;

  // Verifica se já existe um client em memória com esse nome
  if (sessions[sessionName]) {
    return res.send(`Sessão "${sessionName}" já existe.`);
  }

  // Cria um novo client do WhatsApp usando LocalAuth
  // LocalAuth salva a sessão no disco, assim não precisa escanear QR toda hora
  const client = new Client({
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

  // Inicializa o client (começa a conexão com o WhatsApp)
  client.initialize();

  // Salva o client no objeto sessions, assim podemos acessar depois pelo nome
  sessions[sessionName] = client;

  // Responde no navegador que a sessão foi iniciada
  res.send(`Sessão "${sessionName}" iniciada! Use /qr/${sessionName} para pegar o QR.`);
});

// ------------------------- ROTA PARA PEGAR O QR CODE -------------------------
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

// ------------------------- ROTA PARA VERIFICAR STATUS -------------------------
app.get('/status/:sessionName', (req, res) => {
  const client = sessions[req.params.sessionName];

  // Se não existir client com esse nome, retorna que a sessão não existe
  if (!client) return res.send(`Sessão "${req.params.sessionName}" não existe.`);

  // Verifica se o client está pronto (client.info existe depois do 'ready')
  // Se estiver, retorna "conectado", se não, "desconectado"
  res.send(`Sessão "${req.params.sessionName}" status: ${client.info ? 'conectado' : 'desconectado'}`);
});

// ------------------------- ROTA PARA APAGAR UMA SESSÃO -------------------------
app.get('/delete/:sessionName', async (req, res) => {
  const { sessionName } = req.params;
  const client = sessions[sessionName];

  // Se não existir client com esse nome, retorna erro
  if (!client) return res.send(`Sessão "${sessionName}" não existe.`);

  // Encerra o client do WhatsApp e desconecta a sessão
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
});

// ------------------------- INICIA O SERVIDOR -------------------------
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
