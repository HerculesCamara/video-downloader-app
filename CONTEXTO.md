# 🎥 Video Downloader - Documento de Contexto do Projeto

## 📋 Visão Geral

Aplicação web full-stack para download de vídeos de plataformas como YouTube, TikTok e Instagram. O projeto foi desenvolvido com foco em **performance**, **escalabilidade** e **eficiência de recursos**.

---

## 🏗️ Arquitetura do Sistema

### **Arquitetura Separada (Frontend + Backend)**

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Frontend (Next.js 15)      │
        │   Deploy: Vercel             │
        │   URL: vercel.app            │
        └──────────────┬───────────────┘
                       │ HTTPS
                       │ API Calls
                       ▼
        ┌──────────────────────────────┐
        │   Nginx Proxy Manager        │
        │   SSL/TLS + CORS             │
        │   api.video-downloader...    │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Backend (FastAPI)          │
        │   Deploy: Portainer/Docker   │
        │   Servidor Caseiro           │
        │   IP: 45.231.21.158:5001     │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   yt-dlp + FFmpeg            │
        │   Processamento de Vídeo     │
        │   Streaming via Pipes        │
        └──────────────────────────────┘
```

---

## 🎯 Tecnologias Utilizadas

### **Frontend**
- **Next.js 15** - Framework React com App Router
- **React 19** - Interface de usuário
- **CSS Inline** - Estilização sem dependências externas
- **Vercel** - Plataforma de deploy

### **Backend**
- **FastAPI** - Framework Python assíncrono
- **yt-dlp** - Extração de vídeos (sempre atualizado)
- **FFmpeg** - Processamento e merge de streams
- **uvicorn** - Servidor ASGI
- **Docker** - Containerização
- **Portainer** - Gerenciamento de containers

### **Infraestrutura**
- **Nginx Proxy Manager** - Reverse proxy + SSL
- **Let's Encrypt** - Certificados SSL
- **Docker Compose** - Orquestração
- **Overlay Network** - Rede Docker compartilhada

---

## 🚀 Estratégia de Streaming (Diferencial do Projeto)

### **Pipeline Assíncrono em Memória**

O projeto **NÃO salva vídeos em disco** no servidor. Todo o processamento é feito em memória através de **pipes assíncronos**:

```python
┌─────────────┐
│  YouTube    │ (URL do vídeo)
│  TikTok     │ (URL do áudio)
│  Instagram  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  yt-dlp (extração de URLs)          │
│  - Pega melhor vídeo disponível     │
│  - Pega melhor áudio disponível     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  FFmpeg (merge assíncrono)          │
│  - Comando: bestvideo+bestaudio     │
│  - Output: pipe:1 (stdout)          │
│  - Flags: frag_keyframe+empty_moov  │
└──────┬──────────────────────────────┘
       │
       ▼ (chunks de 64KB)
┌─────────────────────────────────────┐
│  asyncio.subprocess (não-bloqueante)│
│  - Lê stdout do FFmpeg              │
│  - Yield chunks progressivamente    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  StreamingResponse (FastAPI)        │
│  - media_type: video/mp4            │
│  - Content-Disposition: attachment  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Navegador do Usuário               │
│  - Recebe chunks progressivamente   │
│  - Acumula em blob na RAM           │
│  - Salva no disco ao completar     │
└─────────────────────────────────────┘
```

### **Vantagens desta Abordagem:**

✅ **Zero uso de disco no servidor**
✅ **Processamento paralelo** (múltiplos downloads simultâneos)
✅ **Escalabilidade** (não depende de armazenamento)
✅ **Cancelamento inteligente** (mata FFmpeg se usuário desconectar)
✅ **Melhor qualidade** (bestvideo+bestaudio com FFmpeg)

---

## 🔐 Segurança e CORS

### **Configuração de CORS**

**Backend (FastAPI):**
```python
allow_origins=[
    "http://localhost:3000",  # Desenvolvimento
    "https://video-downloader-app-theta.vercel.app",  # Produção
    "*"  # Fallback (pode ser removido)
]
```

**Nginx (Proxy):**
```nginx
# Responde OPTIONS (preflight CORS)
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    return 204;
}
```

### **SSL/TLS**
- Certificado Let's Encrypt (renovação automática)
- TLS 1.2 e 1.3
- HTTPS obrigatório (HTTP redireciona)

---

## 📊 Fluxo de Dados Completo

### **1. Usuário Inicia Download**
```
Frontend (Vercel) → POST /api/download
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

### **2. Backend Processa**
```python
1. Valida URL
2. Extrai informações com yt-dlp (download=False)
3. Obtém URLs de vídeo e áudio
4. Inicia FFmpeg assíncrono
5. Retorna StreamingResponse
```

### **3. Streaming Acontece**
```
FFmpeg → stdout (pipe) → asyncio.read(64KB) → yield chunk → FastAPI → Nginx → Navegador
```

### **4. Frontend Finaliza**
```javascript
1. Recebe todos os chunks
2. Cria blob na RAM
3. Gera URL temporária (blob URL)
4. Exibe botão de download no modal
5. Usuário clica → salva no disco
```

---

## 🐳 Deploy com Docker

### **Estrutura de Containers**

```yaml
version: "3.8"

services:
  video-downloader-api:
    image: video-downloader-api:latest
    ports:
      - "5001:5001"
    networks:
      - npm_silas  # Rede compartilhada com NPM
    restart: always
```

### **Dockerfile Otimizado**

```dockerfile
FROM python:3.11-slim

# FFmpeg para processamento
RUN apt-get update && apt-get install -y ffmpeg

# yt-dlp sempre atualizado (importante!)
RUN pip install --upgrade yt-dlp

# FastAPI e dependências
COPY requirements.txt .
RUN pip install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]
```

**Por que atualizar yt-dlp sempre?**
- YouTube muda algoritmos constantemente
- yt-dlp precisa estar na versão mais recente
- Evita erros de "Signature extraction failed"

---

## ⚡ Performance e Otimizações

### **Nginx Timeouts**
```nginx
proxy_connect_timeout 600s;
proxy_send_timeout    600s;
proxy_read_timeout    600s;
proxy_buffering off;  # Crucial para streaming
```

### **Async/Await no Backend**
```python
# ❌ ERRADO (bloqueia event loop)
process = subprocess.Popen(...)
chunk = process.stdout.read(65536)

# ✅ CORRETO (assíncrono)
process = await asyncio.create_subprocess_exec(...)
chunk = await process.stdout.read(65536)
```

### **Cleanup Automático**
```python
finally:
    if process.returncode is None:
        process.kill()  # Mata FFmpeg se necessário
        await process.wait()
```

---

## 🎨 Interface do Usuário

### **Modal com 3 Estados**

**1. Loading:**
- Spinner animado
- Progress bar indeterminada
- Botão "Aguarde..." (disabled)

**2. Success:**
- ✅ Ícone de sucesso
- Nome do vídeo
- Tamanho do arquivo
- Botão "📥 Baixar Vídeo" (enabled)

**3. Error:**
- ❌ Ícone de erro
- Mensagem de erro
- Botão "Fechar"

### **Disclaimers Legais**
- Checkbox obrigatório (direitos autorais)
- Avisos legais visíveis
- Responsabilidade do usuário

---

## 🔧 Variáveis de Ambiente

### **Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=https://api.video-downloader.herculescamara.com
```

### **Backend (docker-compose.yml)**
```yaml
environment:
  - PORT=5001
  - PYTHONUNBUFFERED=1
```

---

## 📝 Estrutura de Diretórios

```
video-downloader/
├── app/                    # Frontend Next.js
│   ├── page.js            # Página principal
│   ├── layout.js          # Layout raiz
│   └── api/               # (removido - agora é backend separado)
│
├── backend/               # Backend FastAPI (repo separado)
│   ├── main.py           # API principal
│   ├── requirements.txt  # Dependências Python
│   ├── Dockerfile        # Container config
│   ├── docker-compose.yml
│   ├── .gitignore
│   └── README.md
│
├── public/
│   └── downloads/        # (não usado - streaming direto)
│
├── .env.local           # Config dev frontend
├── .gitignore           # Ignora /backend/
├── package.json
└── README.md
```

---

## 🚨 Problemas Conhecidos e Soluções

### **1. Mixed Content Error**
**Problema:** Vercel (HTTPS) não aceita backend HTTP
**Solução:** SSL no backend via Nginx Proxy Manager

### **2. CORS Preflight Failed**
**Problema:** OPTIONS retorna 400
**Solução:** Configurar CORS no Nginx + FastAPI

### **3. Signature Extraction Failed**
**Problema:** yt-dlp desatualizado
**Solução:** `pip install --upgrade yt-dlp` no Dockerfile

### **4. Arquivo com 0 bytes**
**Problema:** Nginx buffering ativado
**Solução:** `proxy_buffering off;`

### **5. Vídeos grandes (1GB+) travam navegador**
**Problema:** Blob acumula tudo na RAM
**Solução:** Em discussão (Service Worker ou link direto)

---

## 📈 Melhorias Futuras

- [ ] Progress bar real (% de download)
- [ ] Service Worker para downloads grandes
- [ ] Suporte a playlists
- [ ] Seleção de qualidade (720p/1080p/4K)
- [ ] Download de legendas
- [ ] Histórico de downloads
- [ ] Rate limiting por IP
- [ ] Analytics de uso

---

## 📚 Referências Técnicas

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg Streaming Guide](https://trac.ffmpeg.org/wiki/StreamingGuide)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

---

## 👨‍💻 Desenvolvimento

**Desenvolvido por:** Hercules Camara
**Período:** 2025
**Status:** Em Produção

**URLs:**
- Frontend: https://video-downloader-app-theta.vercel.app
- Backend: https://api.video-downloader.herculescamara.com
- IP Servidor: 45.231.21.158:5001

---

## ⚖️ Licença e Responsabilidade

**MIT License**

⚠️ **IMPORTANTE:** Esta aplicação é fornecida apenas para fins educacionais e pessoais. O usuário é responsável por garantir que possui os direitos autorais ou permissão para baixar o conteúdo. O uso indevido pode violar as leis de direitos autorais.

---

**Última atualização:** 2025-01-21
