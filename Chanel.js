const express = require('express') // Importa o framework Express para criar a API
const app = express() // Cria uma instância do Express
app.use(express.json()) // Permite que o Express entenda requisições com JSON no body
const PORT = 3001 // Define a porta que a API vai rodar
const sessions = {} // Objeto que vai armazenar sessões com suas filas e timers
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // URL da API do Groq

function enfileirarMensagens(sessionName,msg, API_KEY){
    // Se não existir essa sessão
    if (!sessions[sessionName]){
        sessions[sessionName] = { fila: [], timer: null } //cria um objeto com uma fila(lista) e um timer
    }

    const session = sessions[sessionName] // O Objeto sessão

    // Adiciona o objeto completo na fila
    session.fila.push(msg) // Adiciona a mensagem recebida no final da fila

    // Limita a fila a 100 mensagens
    if (session.fila.length > 50) {
        session.fila.shift() // remove o primeiro elemento (mais antigo)
    }

    console.log(`Tamanho atual da fila: ${session.fila.length}`) // Mostra no console o tamanho da fila atual

    if (session.timer){ // Se ja tiver um timer nessa sessão
        clearTimeout(session.timer) // Limpa o timer
    }

    return new Promise((resolve, reject) => {
        session.timer = setTimeout(async () => {
            // Gera um array só com as mensagens de texto para log
            const messagesToSend = session.fila.join(' ') // Junta todas as mensagens da fila em uma string
            console.log(`Enviando mensagens da sessão ${sessionName}: ${messagesToSend}`) // Mostra as mensagens que vão ser enviadas
            
            session.fila = [] // Limpa a fila após enviar
            session.timer = null // Reseta o timer da sessão

            // Faz requisição POST para a API do Groq
            const resposta = await fetch(GROQ_API_URL, {
                method: 'POST', // Método HTTP POST
                headers: {
                    'Authorization' : `Bearer ${API_KEY}`, // Token de autenticação
                    'Content-Type' : 'application/json' // Tipo do conteúdo
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-4-scout-17b-16e-instruct", // Modelo que será usado na API
                    messages: [
                        { role: "user", content: messagesToSend } // Content é o que vai mandar para o groq
                    ],
                })
            });

            const dados = await resposta.json(); // Converte a resposta da API para JSON
            console.log(dados) // Para testes, mostra toda a resposta da API

            const RespostaTxt = dados.choices[0].message.content // Basicamente a resposta do Groq, pega só o texto
            resolve(RespostaTxt) // Resolve a Promise com a resposta do Groq

        }, 20000) // Define o tempo de espera de 20 segundos antes de enviar as mensagens
    })
}

app.post('/send/:sessionName', async (req,res) =>{
    const {sessionName} = req.params // Pega o nome da sessao da URL
    const Req = req.body //Pega o corpo da requisição JSON
    const msg = Req.message // Extrai a mensagem enviada pelo usuário
    const API_KEY = Req.API_KEY // Extrai a chave da API fornecida pelo usuário
    console.log(msg) // Mostra a mensagem recebida no console
    
    var resposta = await enfileirarMensagens(sessionName,msg,API_KEY) // Chama a função de enfileirar e espera a resposta
    console.log(resposta) // Mostra a resposta do Groq no console
    res.send(resposta) // Envia a resposta de volta para o cliente
})

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`)) // Inicia a API e mostra a URL no console
