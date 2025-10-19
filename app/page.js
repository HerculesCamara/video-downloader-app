'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState('loading'); // 'loading', 'success', 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Função para processar o download
  const handleDownload = async (e) => {
    e.preventDefault();

    // Validação do checkbox
    if (!agreed) {
      setFormError('Você precisa confirmar que possui os direitos autorais do vídeo.');
      return;
    }

    // Validação da URL
    if (!url.trim()) {
      setFormError('Por favor, insira uma URL válida.');
      return;
    }

    // Abrir modal e iniciar processamento
    setFormError('');
    setShowModal(true);
    setModalState('loading');
    setResult(null);
    setError('');

    try {
      // Chamar API do backend - agora retorna streaming direto
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const downloadUrl = `${apiUrl}/api/download`;

      // Criar form data para enviar
      const requestBody = JSON.stringify({ url });

      // Fazer requisição
      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        // Tentar ler erro como JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Erro ao processar o vídeo');
        } catch {
          throw new Error('Erro ao processar o vídeo');
        }
      }

      // Pegar nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'video.mp4';
      if (contentDisposition) {
        const matches = /filename="?(.+)"?/i.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Converter response para blob
      const blob = await response.blob();

      // Criar URL temporária do blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Atualizar resultado
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
  };

  // Fechar modal
  const closeModal = () => {
    setShowModal(false);
    setModalState('loading');
    setResult(null);
    setError('');
  };

  // Baixar e fechar modal
  const handleDownloadClick = () => {
    // O download acontece automaticamente pelo link
    // Fechar modal após um pequeno delay
    setTimeout(() => {
      closeModal();
    }, 500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Download de Vídeos</h1>
        <p style={styles.subtitle}>YouTube • TikTok • Instagram</p>

        {/* Disclaimer Legal */}
        <div style={styles.disclaimer}>
          <strong>⚠️ AVISO LEGAL:</strong>
          <p>
            Este serviço é fornecido apenas para fins educacionais e pessoais.
            Você é responsável por garantir que possui os direitos autorais
            ou permissão para baixar o conteúdo. O uso indevido pode violar
            as leis de direitos autorais.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleDownload} style={styles.form}>
          <input
            type="text"
            placeholder="Cole a URL do vídeo aqui..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={styles.input}
            disabled={showModal}
          />

          {/* Checkbox obrigatório */}
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={showModal}
            />
            <span style={styles.checkboxText}>
              Confirmo que possuo os direitos autorais ou permissão para baixar este vídeo
            </span>
          </label>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(!agreed ? styles.buttonDisabled : {})
            }}
            disabled={!agreed}
          >
            Baixar Vídeo
          </button>
        </form>

        {/* Mensagem de erro do formulário */}
        {formError && (
          <div style={styles.error}>
            ❌ {formError}
          </div>
        )}

        {/* Footer com informações */}
        <div style={styles.footer}>
          <p>Suporta vídeos de YouTube, TikTok, Instagram e outras plataformas.</p>
          <p style={styles.footerSmall}>
            Use responsavelmente. Respeite os direitos autorais.
          </p>
        </div>
      </div>

      {/* Modal de Download */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Botão fechar */}
            <button style={styles.closeButton} onClick={closeModal}>
              ✕
            </button>

            {/* Estado: Loading */}
            {modalState === 'loading' && (
              <>
                <div style={styles.modalIcon}>
                  <div style={styles.spinner}></div>
                </div>
                <h2 style={styles.modalTitle}>Processando Vídeo...</h2>
                <p style={styles.modalText}>
                  Estamos extraindo as informações do vídeo. Aguarde um momento.
                </p>

                {/* Progress bar indeterminada */}
                <div style={styles.progressBarContainer}>
                  <div style={styles.progressBar}></div>
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
                <h2 style={styles.modalTitle}>Vídeo Pronto!</h2>
                <p style={styles.modalVideoTitle}>🎬 {result.title}</p>
                {result.fileSize && (
                  <p style={styles.modalText}>📦 Tamanho: {result.fileSize}</p>
                )}

                <a
                  href={result.downloadUrl}
                  download
                  style={styles.downloadButtonEnabled}
                  onClick={handleDownloadClick}
                >
                  📥 Baixar Vídeo
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

// Estilos CSS inline
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '32px',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 30px 0',
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
  },
  disclaimer: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '30px',
    fontSize: '14px',
    color: '#856404',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '15px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  checkboxText: {
    color: '#333',
    lineHeight: '1.5',
  },
  button: {
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  error: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    color: '#721c24',
  },
  result: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '8px',
  },
  resultTitle: {
    margin: '0 0 10px 0',
    color: '#155724',
  },
  videoTitle: {
    margin: '0 0 15px 0',
    color: '#155724',
    fontWeight: 'bold',
  },
  downloadButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
  },
  footerSmall: {
    fontSize: '12px',
    marginTop: '5px',
  },

  // Estilos do Modal
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
  spinner: {
    width: '60px',
    height: '60px',
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
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
  progressBarContainer: {
    width: '100%',
    height: '6px',
    backgroundColor: '#f0f0f0',
    borderRadius: '3px',
    overflow: 'hidden',
    margin: '20px 0',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    animation: 'progressIndeterminate 1.5s ease-in-out infinite',
    width: '40%',
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
