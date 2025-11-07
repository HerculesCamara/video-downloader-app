'use client'; // Necessário se estiver usando App Router

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; // Ou 'next/router' se usar Pages Router

function DownloadClipContent() {
  // --- NOVOS ESTADOS PARA O MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState('loading'); // 'loading', 'success', 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  // --- FIM DOS NOVOS ESTADOS ---

  // Estados antigos
  const [status, setStatus] = useState('loading'); // loading, ready, error
  const [errorMessage, setErrorMessage] = useState('');
  const [videoId, setVideoId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [quality, setQuality] = useState('1080p');

  const searchParams = useSearchParams();

  useEffect(() => {
    // Pega os parâmetros da URL
    const vParam = searchParams.get('v');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    if (vParam && startParam && endParam) {
      setVideoId(vParam);
      setStartTime(startParam);
      setEndTime(endParam);
      setStatus('ready'); // Indica que a página está pronta
    } else {
      setErrorMessage('Parâmetros inválidos ou ausentes na URL.');
      setStatus('error');
    }
  }, [searchParams]);

  // --- FUNÇÃO DE DOWNLOAD ATUALIZADA (AGORA USA 'FETCH' E ABRE O MODAL) ---
  const handleDownload = async () => {
    if (status === 'downloading') return; // Previne cliques duplos

    setStatus('downloading'); // Desabilita o botão principal
    setShowModal(true);       // Abre o modal
    setModalState('loading'); // Coloca o modal em modo "loading"
    setResult(null);
    setError('');

    try {
      // O backend espera 'Form Data', então vamos construir
      const formData = new FormData();
      formData.append('videoId', videoId);
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
      formData.append('quality', quality);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const downloadUrl = `${apiUrl}/api/download-segment`;

      // Fazer a requisição 'fetch'
      const response = await fetch(downloadUrl, {
        method: 'POST',
        body: formData, // Envia como Form Data
        // Não defina 'Content-Type', o navegador faz isso automaticamente para FormData
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Erro ao processar o clipe');
        } catch {
          throw new Error('Erro ao processar o clipe');
        }
      }

      // Pegar nome do arquivo do header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'clipe.mp4';
      if (contentDisposition) {
        const matches = /filename="?(.+)"?/i.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Converter response para blob
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Atualizar resultado e mudar o modal para "success"
      setResult({
        success: true,
        title: filename.replace('.mp4', ''),
        downloadUrl: blobUrl,
        fileName: filename,
      });
      setModalState('success');

    } catch (err) {
      setError(err.message);
      setModalState('error');
    }

    // Re-abilita o botão principal da página
    setStatus('ready');
  };

  // --- FUNÇÕES DO MODAL ---
  const closeModal = () => {
    setShowModal(false);
    setModalState('loading');
    setResult(null);
    setError('');
  };

  const handleDownloadClickFromModal = () => {
    // Apenas fecha o modal, o link <a> faz o download
    setTimeout(() => {
      closeModal();
    }, 500);
  };

  // --- RENDERIZAÇÃO DA PÁGINA ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Preparando seu Clipe</h1>

        {/* --- ESTADO DE CARREGAMENTO (da página) --- */}
        {status === 'loading' && (
          <>
            <p style={styles.subtitle}>Lendo informações do clipe...</p>
            <div style={styles.spinnerContainer}>
              <div style={styles.spinner}></div>
            </div>
          </>
        )}

        {/* --- ESTADO DE ERRO (da página) --- */}
        {status === 'error' && (
          <>
            <p style={styles.subtitle}>Ocorreu um Erro</p>
            <div style={styles.errorBox}>
              <p>❌ {errorMessage || 'Não foi possível preparar seu clipe.'}</p>
              <p>Verifique o link ou tente novamente.</p>
            </div>
          </>
        )}

        {/* --- ESTADO PRONTO PARA DOWNLOAD --- */}
        {status === 'ready' || status === 'downloading' ? (
          <>
            <p style={styles.subtitle}>Seu clipe está pronto para ser baixado!</p>
            <div style={styles.clipInfo}>
              <p><strong>Vídeo ID:</strong> {videoId}</p>
              <p><strong>Início:</strong> {startTime}</p>
              <p><strong>Fim:</strong> {endTime}</p>
            </div>

            <div style={styles.qualitySelector}>
              <label htmlFor="qualitySelect" style={styles.selectLabel}>
                Selecione a Qualidade:
              </label>
              <select
                id="qualitySelect"
                style={styles.select}
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                disabled={status === 'downloading'}
              >
                <option value="best">Melhor Disponível (Pode ser 4K+)</option>
                <option value="1080p">1080p (Full HD - Padrão)</option>
                <option value="720p">720p (HD)</option>
                <option value="360p">360p (Baixa Qualidade)</option>
              </select>
            </div>
            
            {/* ANÚNCIO 1 (PRINCIPAL) */}
            <div style={styles.adPlaceholder}>
              <p>(Espaço reservado para Anúncios do AdSense 1)</p>
            </div>

            <button
              onClick={handleDownload}
              style={{...styles.button, ...(status === 'downloading' ? styles.buttonDisabled : {})}}
              disabled={status === 'downloading'}
            >
              {status === 'downloading' ? 'Preparando...' : '📥 Iniciar Download do Clipe'}
            </button>
            {/* O formulário invisível não é mais necessário aqui */}
          </>
        ) : null}
      </div>

      {/* --- MODAL DE DOWNLOAD --- */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={closeModal}>✕</button>

            {/* Estado: Loading (Enquanto o backend "Salva e Serve") */}
            {modalState === 'loading' && (
              <>
                <div style={styles.modalIcon}>
                  <div style={styles.spinner}></div>
                </div>
                <h2 style={styles.modalTitle}>Preparando seu Clipe...</h2>
                <p style={styles.modalText}>
                  Nosso servidor está baixando e cortando seu vídeo.
                </p>
                {/* O TEXTO QUE VOCÊ QUERIA! */}
                <p style={styles.modalTextSmall}>
                  <strong>Isso pode levar de 30 segundos a 2 minutos, por favor, aguarde.</strong>
                </p>
                
                {/* ANÚNCIO 2 (DENTRO DO MODAL) */}
                <div style={styles.adPlaceholderModal}>
                  <p>(Espaço reservado para AdSense 2)</p>
                </div>

                <button style={styles.downloadButtonDisabled} disabled>
                  Aguarde...
                </button>
              </>
            )}

            {/* Estado: Success */}
            {modalState === 'success' && result && (
              <>
                <div style={styles.modalIcon}>
                  <div style={styles.successIcon}>✓</div>
                </div>
                <h2 style={styles.modalTitle}>Clipe Pronto!</h2>
                <p style={styles.modalVideoTitle}>🎬 {result.title}</p>
                
                {/* ANÚNCIO 2 (TAMBÉM PODE IR AQUI) */}
                {/* <div style={styles.adPlaceholderModal}><p>(AdSense 2)</p></div> */}

                <a
                  href={result.downloadUrl}
                  download={result.fileName}
                  style={styles.downloadButtonEnabled}
                  onClick={handleDownloadClickFromModal}
                >
                  📥 Baixar Agora
                </a>
              </>
            )}

            {/* Estado: Error */}
            {modalState === 'error' && (
              <>
                <div style={styles.modalIcon}>
                  <div style={styles.errorIcon}>✕</div>
                </div>
                <h2 style={styles.modalTitle}>Erro no Processamento</h2>
                <p style={styles.modalErrorText}>❌ {error}</p>
                <button style={styles.closeButtonModal} onClick={closeModal}>
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- ESTILOS ---
// Adicionei os estilos do Modal que estavam na sua Home.js
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
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
  qualitySelector: {
    textAlign: 'left',
    marginBottom: '25px',
  },
  selectLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
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
    backgroundColor: '#28a745',
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
  },

  // --- Estilos do Modal (Copiados da sua Home.js) ---
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.3s',
  },
  modalIcon: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  successIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#28a745',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
  },
  errorIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#dc3545',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
  },
  modalTitle: {
    margin: '0 0 15px 0',
    fontSize: '24px',
    color: '#333',
  },
  modalText: {
    margin: '10px 0',
    fontSize: '14px',
    color: '#666',
  },
  modalTextSmall: { // Para o aviso de tempo
    margin: '10px 0 20px 0',
    fontSize: '12px',
    color: '#888',
  },
  modalVideoTitle: {
    margin: '10px 0 20px 0',
    fontSize: '16px',
    color: '#333',
    fontWeight: 'bold',
  },
  modalErrorText: {
    margin: '10px 0 20px 0',
    fontSize: '14px',
    color: '#dc3545',
    padding: '15px',
    backgroundColor: '#f8d7da',
    borderRadius: '8px',
  },
  adPlaceholderModal: { // Placeholder para o Ad no Modal
    border: '2px dashed #ccc',
    padding: '30px',
    margin: '25px 0',
    textAlign: 'center',
    color: '#999',
    fontSize: '12px',
    backgroundColor: '#fafafa',
  },
  downloadButtonDisabled: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#999',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed',
    marginTop: '10px',
  },
  downloadButtonEnabled: {
    display: 'block',
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    transition: 'background-color 0.3s',
    marginTop: '10px',
  },
  closeButtonModal: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s',
  },
};

// Adiciona as animações CSS globalmente
const keyframesStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
if (typeof window !== 'undefined' && document.styleSheets.length > 0) {
  const styleSheet = document.styleSheets[0];
  const rules = Array.from(styleSheet.cssRules).map(rule => rule.name);
  if (!rules.includes('spin')) {
    styleSheet.insertRule(keyframesStyle, styleSheet.cssRules.length);
  }
}

export default function DownloadClipPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Preparando seu Clipe</h1>
          <p style={styles.subtitle}>Carregando...</p>
          <div style={styles.spinnerContainer}>
            <div style={styles.spinner}></div>
          </div>
        </div>
      </div>
    }>
      <DownloadClipContent />
    </Suspense>
  );
}