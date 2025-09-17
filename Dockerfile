FROM node:18.16.1 


# Instalar dependências do sistema necessárias para o Puppeteer
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libcups2 \
    libxss1 \
    libgtk-3-0 \
    libdrm2 \
    libxkbcommon0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Cria diretório da aplicação

WORKDIR /app 

# Copia package.json e package-lock.json 

COPY package*.json ./ 

# Instala dependências 

RUN npm install 

# Copia o restante da aplicação 

COPY . . 

# Expõe a porta que o Express vai rodar 

EXPOSE 3000 

# Define variável de ambiente (você pode sobrescrever no docker-compose) 


# Comando para iniciar o app 

CMD ["node", "Index.js"]