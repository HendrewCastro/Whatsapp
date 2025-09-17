Primeiros passos:
    Acesse o Groq e crie uma chave
    Crie um .env
    Escreva GROQ_API_KEY=SuaChave Sem espaços ou ;
    Rode "Docker compose up --build"
    Acesse http://localhost:3000/api-docs
    Use  start/:SessionName
    Acesse no Navegador http://localhost:3000/qr/NomeDaSessão
    Pode levar um tempo até o qr-code ser gerado
    Volte ao http://localhost:3000/api-docs
    Use /AllowContacts/:sessionName
    Adicione o nome do contato na lista
    Quando alguém na lista de contatos mandar mensagem o groq vai respoder
    Para isso funcionar você não pode estar dentro da conversa
Outras rotas:
    /status/:sessionName:
        Manda o status(desconectado/conectado) e os contatos permitidos
        Para estar conectado deve ter lido o qr-code
    
    '/delete/:sessionName':
        Deleta a sessão se estiver conectado

Mais detalhes:
    Leia o código

