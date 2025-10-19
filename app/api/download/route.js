import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Diretório temporário para downloads
const DOWNLOAD_DIR = path.join(process.cwd(), 'public', 'downloads');

// Garantir que o diretório existe
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    // Validação da URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    // Validar se é uma URL válida
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Formato de URL inválido' },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const outputTemplate = path.join(DOWNLOAD_DIR, `video_${timestamp}.%(ext)s`);

    // Comando yt-dlp para baixar o vídeo
    // -f best: melhor qualidade disponível
    // --no-playlist: baixar apenas o vídeo, não a playlist
    // -o: template do nome do arquivo de saída
    // --print: imprimir informações do vídeo
    const command = `yt-dlp -f "best[ext=mp4]/best" --no-playlist -o "${outputTemplate}" --print "%(title)s|||%(ext)s" "${url}"`;

    console.log('Executando comando:', command);

    // Executar yt-dlp
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // timeout de 2 minutos
    });

    if (stderr && !stderr.includes('Deleting original file')) {
      console.error('Stderr:', stderr);
    }

    // Parsear a saída para obter título e extensão
    const output = stdout.trim();
    const [title, ext] = output.split('|||');

    if (!title || !ext) {
      throw new Error('Não foi possível obter informações do vídeo');
    }

    // Nome do arquivo baixado
    const fileName = `video_${timestamp}.${ext}`;
    const filePath = path.join(DOWNLOAD_DIR, fileName);

    // Verificar se o arquivo foi criado
    if (!fs.existsSync(filePath)) {
      throw new Error('Arquivo de vídeo não foi criado');
    }

    // URL pública do arquivo
    const downloadUrl = `/downloads/${fileName}`;

    // Limpar arquivos antigos (mais de 1 hora)
    cleanOldFiles();

    return NextResponse.json({
      success: true,
      title: title.trim(),
      downloadUrl,
      fileName,
    });

  } catch (error) {
    console.error('Erro no download:', error);

    // Mensagens de erro mais amigáveis
    let errorMessage = 'Erro ao processar o vídeo';

    if (error.message.includes('not found') || error.message.includes('yt-dlp')) {
      errorMessage = 'yt-dlp não está instalado no servidor';
    } else if (error.message.includes('Unsupported URL')) {
      errorMessage = 'URL não suportada. Verifique se o link está correto.';
    } else if (error.message.includes('Video unavailable')) {
      errorMessage = 'Vídeo indisponível ou privado';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Tempo limite excedido. Tente um vídeo menor.';
    } else if (error.stderr) {
      errorMessage = error.stderr;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Função para limpar arquivos antigos
function cleanOldFiles() {
  try {
    const files = fs.readdirSync(DOWNLOAD_DIR);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(DOWNLOAD_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      // Remover arquivos com mais de 1 hora
      if (fileAge > oneHour) {
        fs.unlinkSync(filePath);
        console.log(`Arquivo removido: ${file}`);
      }
    });
  } catch (error) {
    console.error('Erro ao limpar arquivos antigos:', error);
  }
}
