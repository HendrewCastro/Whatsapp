const express = require('express')
const app = express()
app.use(express.json())
const PORT = 3001
const sessions = {}

app.post('/send/:sessionName', (req,res) =>{
    const {sessionName} = req.params // Pega o nome da sessao
    const {message} = req.body //Pega a mensagem no Json
    const msg = message.message
    console.log(message.message)
    // Se não existir essa sessão
    if (!sessions[sessionName]){
        sessions[sessionName] = { fila: [], timer: null } //cria um objeto com uma fila(lista) e um timer
    }

    const session = sessions[sessionName] // O Objeto sessão
    session.fila.push(msg) // Adiciona a mensagem na lista do atrbuto fila

    if (session.timer){ // Se ja tiver um timer nessa sessão
        clearTimeout(session.timer) // Limpa o timer
    }

    session.timer = setTimeout(() => {
        const messagesToSend = session.fila.join(' ')
        console.log(`Enviando mensagens da sessão ${sessionName}: ${messagesToSend}`)



        session.fila = []
        session.timer = null



    }, 20000)
    res.json({ status: 'Na fila', msg });

})

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));