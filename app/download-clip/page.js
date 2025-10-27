'use client'; // Necessário se estiver usando App Router

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Ou 'next/router' se usar Pages Router

export default function DownloadClipPage() {
  // Estados para gerenciar o processo
  const [status, setStatus] = useState('loading'); // loading, ready, error
  const [errorMessage, setErrorMessage] = useState('');
  const [videoId, setVideoId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // --- LEITURA DOS PARÂMETROS DA URL ---
  // Se usar Pages Router, use: const router = useRouter(); const { v, start, end } = router.query;
  const searchParams = useSearchParams();

  useEffect(() => {
    // Pega os parâmetros da URL assim que o componente monta
    const vParam = searchParams.get('v');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    if (vParam && startParam && endParam) {
      setVideoId(vParam);
      setStartTime(startParam);
      setEndTime(endParam);
      setStatus('ready'); // Indica que está pronto para o download
      // Opcional: Iniciar o download automaticamente
      // handleDownload(); // Descomente se quiser iniciar o download sem clique extra
    } else {
      setErrorMessage('Parâmetros inválidos ou ausentes na URL.');
      setStatus('error');
    }
  }, [searchParams]); // Re-executa se os parâmetros mudarem

  // --- FUNÇÃO PARA ACIONAR O DOWNLOAD VIA FORMULÁRIO INVISÍVEL ---
  const handleDownload = () => {
    if (status !== 'ready') return;

    // Atualiza o status para mostrar feedback
    setStatus('downloading');

    // Encontra o formulário invisível e o submete
    const form = document.getElementById('downloadSegmentForm');
    if (form) {
      form.submit();
    } else {
        setErrorMessage('Erro ao iniciar download: Formulário não encontrado.');
        setStatus('error');
    }

    // Opcional: Você pode tentar fechar a aba depois de um tempo, mas pode ser bloqueado pelo navegador
    // setTimeout(() => { window.close(); }, 5000); // Tenta fechar após 5 segundos
  };

  // --- RENDERIZAÇÃO DA PÁGINA ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Preparando seu Clipe</h1>

        {/* --- ESTADO DE CARREGAMENTO --- */}
        {status === 'loading' && (
          <>
            <p style={styles.subtitle}>Lendo informações do clipe...</p>
            <div style={styles.spinnerContainer}>
              <div style={styles.spinner}></div>
            </div>
          </>
        )}

        {/* --- ESTADO DE ERRO --- */}
        {status === 'error' && (
          <>
            <p style={styles.subtitle}>Ocorreu um Erro</p>
            <div style={styles.errorBox}>
              <p>❌ {errorMessage || 'Não foi possível preparar seu clipe.'}</p>
              <p>Verifique o link ou tente novamente.</p>
            </div>
          </>
        )}

        {/* --- ESTADO PRONTO PARA DOWNLOAD (OU BAIXANDO) --- */}
        {status === 'ready' || status === 'downloading' ? (
          <>
            <p style={styles.subtitle}>Seu clipe está pronto para ser baixado!</p>
            <div style={styles.clipInfo}>
              <p><strong>Vídeo ID:</strong> {videoId}</p>
              <p><strong>Início:</strong> {startTime}</p>
              <p><strong>Fim:</strong> {endTime}</p>
            </div>

            {/* AQUI VOCÊ COLOCA OS ANÚNCIOS DO ADSENSE */}
            <div style={styles.adPlaceholder}>
              {/* Exemplo: <AdSenseComponent slotId="seu-slot-id" /> */}
              <p>(Espaço reservado para Anúncios do AdSense)</p>
            </div>

            <button
              onClick={handleDownload}
              style={{...styles.button, ...(status === 'downloading' ? styles.buttonDisabled : {})}}
              disabled={status === 'downloading'}
            >
              {status === 'downloading' ? 'Baixando...' : '📥 Iniciar Download do Clipe'}
            </button>
            {status === 'downloading' && <p style={styles.infoText}>O download iniciará em breve...</p>}

             {/* --- FORMULÁRIO INVISÍVEL PARA ACIONAR O BACKEND --- */}
            <form
                id="downloadSegmentForm"
                method="POST"
                // IMPORTANTE: Use a URL HTTPS do seu backend Nginx
                action={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/download-segment`}
                style={{ display: 'none' }}
                target="_blank" // Opcional: abre a resposta em nova aba (útil para debug)
            >
                <input type="hidden" name="videoId" value={videoId} />
                <input type="hidden" name="start_time" value={startTime} />
                <input type="hidden" name="end_time" value={endTime} />
            </form>
          </>
        ) : null}


      </div>
    </div>
  );
}

// --- ESTILOS (Aproveitei alguns da sua Home page) ---
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)', // Gradiente invertido
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    color: '#333',
  },
  subtitle: {
    margin: '0 0 25px 0',
    fontSize: '16px',
    color: '#666',
  },
  spinnerContainer: {
      display: 'flex',
      justifyContent: 'center',
      padding: '30px 0',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    color: '#721c24',
    textAlign: 'left',
  },
  clipInfo: {
      backgroundColor: '#f0f0f0',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '25px',
      textAlign: 'left',
      fontSize: '14px',
      border: '1px solid #ddd',
  },
  adPlaceholder: {
      border: '2px dashed #ccc',
      padding: '40px',
      margin: '25px 0',
      textAlign: 'center',
      color: '#999',
      fontSize: '14px',
      backgroundColor: '#fafafa',
  },
  button: {
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#28a745', // Botão verde para download
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    width: '100%',
    marginTop: '10px',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  infoText: {
      fontSize: '13px',
      color: '#555',
      marginTop: '10px',
  }
};

// Adiciona a animação de spin globalmente (se não estiver já no seu CSS global)
const keyframesStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (typeof window !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(keyframesStyle, styleSheet.cssRules.length);
}