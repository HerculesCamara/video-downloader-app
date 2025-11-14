'use client'; // Necessário se estiver usando App Router

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; // Ou 'next/router' se usar Pages Router

// O Suspense é uma boa prática para o useSearchParams
export default function DownloadClipPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DownloadClipContent />
    </Suspense>
  );
}

// O componente de Spinner para o Suspense
function LoadingSpinner() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Preparando seu Clipe</h1>
        <p style={styles.subtitle}>Carregando...</p>
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
function DownloadClipContent() {
  // --- ESTADO DO MODAL ---
  const [showModal, setShowModal] = useState(false);
  
  // --- NOVO ESTADO PARA O AVISO ---
  const [showNotification, setShowNotification] = useState(false);
  
  // Estados da Página
  const [status, setStatus] = useState('loading'); // loading, ready, error, downloading
  const [errorMessage, setErrorMessage] = useState('');
  const [videoId, setVideoId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [quality, setQuality] = useState('1080p'); // Padrão 1080p

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

  // Função de ABRIR O MODAL (Sem mudança)
  const handleOpenModal = () => {
    if (status === 'downloading') return;
    setShowModal(true); // Apenas abre o modal
  };

  // --- MUDANÇA: Função de DOWNLOAD FINAL ---
  // O botão DENTRO do modal chama esta função
  const handleFinalDownload = () => {
    setStatus('downloading'); // Mostra "Download em andamento..." no botão principal
    setShowNotification(true); // <-- ATIVA A FAIXA DE AVISO AQUI
    
    // Encontra o formulário invisível e o submete
    const form = document.getElementById('downloadSegmentForm');
    if (form) {
      form.submit(); // Isso inicia o download direto no navegador!
    }

    // Fecha o modal
    closeModal();
  };

  // Função para fechar o modal
  const closeModal = () => {
    setShowModal(false);
    // Não reseta mais o status aqui, para o botão continuar "downloading"
    // if (status !== 'downloading') {
    //     setStatus('ready');
    // }
  };

  // --- RENDERIZAÇÃO DA PÁGINA ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* --- MUDANÇA: FAIXA DE AVISO NO TOPO --- */}
        {showNotification && (
          <div style={styles.notificationBanner}>
            <span>⏳</span> 
            O processamento no servidor foi iniciado. Seu download começará em breve (pode levar de 30s a 2min).
          </div>
        )}
        {/* --- FIM DA MUDANÇA --- */}

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

        {/* --- ESTADO PRONTO (página carregada) --- */}
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

            {/* Botão principal agora chama handleOpenModal */}
            <button
              onClick={handleOpenModal} 
              style={{...styles.button, ...(status === 'downloading' ? styles.buttonDisabled : {})}}
              disabled={status === 'downloading'}
            >
              {status === 'downloading' ? 'Download em andamento...' : '📥 Iniciar Download do Clipe'}
            </button>
            {/* O infoText não é mais necessário, já que temos o banner
            {status === 'downloading' && <p style={styles.infoText}>Confira o progresso no seu navegador.</p>}
            */}

             {/* Formulário invisível (continua o mesmo) */}
            <form
                id="downloadSegmentForm"
                method="POST"
                action={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/download-segment`}
                style={{ display: 'none' }}
            >
                <input type="hidden" name="videoId" value={videoId} />
                <input type="hidden" name="start_time" value={startTime} />
                <input type="hidden" name="end_time" value={endTime} />
                <input type="hidden" name="quality" value={quality} />
            </form>
          </>
        ) : null}
      </div>

      {/* --- O MODAL (PARA ADSENSE) --- */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={closeModal}>✕</button>

            <h2 style={styles.modalTitle}>Seu download está pronto!</h2>
            <p style={styles.modalText}>
              O clipe será baixado direto para sua máquina.
            </p>
            <p style={styles.modalTextSmall}>
              <strong>O processamento no servidor pode levar de 30 segundos a 2 minutos. O download iniciará em instantes...</strong>
            </p>
            
            {/* ANÚNCIO 2 (DENTRO DO MODAL) */}
            <div style={styles.adPlaceholderModal}>
              <p>(Espaço reservado para AdSense 2)</p>
            </div>

            {/* O botão de download final que aciona o formulário */}
            <button
              style={styles.downloadButtonEnabled}
              onClick={handleFinalDownload} 
            >
              📥 Baixar Agora
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
}

// --- ESTILOS ---
// Vou adicionar o estilo para 'notificationBanner'
const styles = {
  // --- NOVO ESTILO PARA O BANNER ---
  notificationBanner: {
    backgroundColor: '#e6f7ff',
    border: '1px solid #91d5ff',
    color: '#0056b3',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    animation: 'fadeIn 0.5s ease', // Animação
  },
  // --- FIM DO NOVO ESTILO ---

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

  // --- Estilos do Modal ---
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
  modalTitle: {
    margin: '0 0 15px 0',
    fontSize: '24px',
    color: '#333',
  },
  modalText: {
    margin: '10px 0 5px 0',
    fontSize: '14px',
    color: '#666',
  },
  modalTextSmall: { // O aviso de tempo
    margin: '0 0 20px 0',
    fontSize: '12px',
    color: '#888',
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
  downloadButtonEnabled: { // O botão de download final
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