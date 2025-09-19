const express = require('express')
const app = express()
app.use(express.json())
const PORT = 3001
const sessions = {}
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function enfileirarMensagens(sessionName,msg, API_KEY){
    // Se não existir essa sessão
    if (!sessions[sessionName]){
        sessions[sessionName] = { fila: [], timer: null } //cria um objeto com uma fila(lista) e um timer
    }

    const session = sessions[sessionName] // O Objeto sessão

    // Adiciona o objeto completo na fila

    session.fila.push(msg)

    // Limita a fila a 100 mensagens

    if (session.fila.length > 50) {

        session.fila.shift() // remove o primeiro elemento (mais antigo)
    }

    console.log(`Tamanho atual da fila: ${session.fila.length}`)

    if (session.timer){ // Se ja tiver um timer nessa sessão
        clearTimeout(session.timer) // Limpa o timer
    }
    return new Promise((resolve, reject) => {
        session.timer = setTimeout(async () => {
        // Gera um array só com as mensagens de texto para log
        const messagesToSend = session.fila.join(' ')
        console.log(`Enviando mensagens da sessão ${sessionName}: ${messagesToSend}`)
        
        

        session.fila = []
        session.timer = null
        const resposta = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization' : `Bearer ${API_KEY}`,
            'Content-Type' : 'application/json'

          },
          body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
              { role: "user", content: messagesToSend } // Content é o que vai mandar para o groq
            ],
          })
        });
        const dados = await resposta.json();
        console.log(dados) // Para testes

        const RespostaTxt = dados.choices[0].message.content // Basicamente a resposta do Groq Tem um formato de Json com listas etc, usamos isso para resgatar somente a resposta 
        
        resolve(RespostaTxt) 


    }, 20000)


    })
    



}
app.post('/send/:sessionName', async (req,res) =>{
    const {sessionName} = req.params // Pega o nome da sessao
    const Req = req.body //Pega a mensagem no Json
    const msg = Req.message
    const API_KEY = Req.API_KEY 
    console.log(msg)
    
    var resposta = await enfileirarMensagens(sessionName,msg,API_KEY)
    console.log(resposta)
    res.send(resposta)

})

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`))
