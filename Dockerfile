# Usar imagem Node.js como base
FROM node:20-alpine

# Instalar dependências do sistema necessárias para yt-dlp
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg

# Instalar yt-dlp globalmente
RUN pip3 install --no-cache-dir yt-dlp

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências do Node.js
RUN npm ci --only=production

# Copiar o resto do código da aplicação
COPY . .

# Criar diretório para downloads
RUN mkdir -p /app/public/downloads

# Build da aplicação Next.js
RUN npm run build

# Expor a porta 3000
EXPOSE 3000

# Variável de ambiente para produção
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["npm", "start"]
