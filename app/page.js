'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Não precisamos mais de 'modalState', 'result', ou 'error'
  const [formError, setFormError] = useState('');
  const [quality, setQuality] = useState('1080p');

  // --- MUDANÇA 1: Função de submit do formulário principal ---
  // Esta função agora SÓ valida os dados e ABRE O MODAL.
  const handleOpenModal = (e) => {
    e.preventDefault(); // Impede o envio do formulário

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

    // Limpa erros e MOSTRA O MODAL
    setFormError('');
    setShowModal(true);
    
    // O 'fetch' foi REMOVIDO daqui.
  };

  // --- MUDANÇA 2: Função que o botão DENTRO do modal vai chamar ---
  // Esta função aciona o download real e fecha o modal.
  const handleFinalDownload = () => {
    // Encontra o formulário invisível e o submete
    const form = document.getElementById('downloadForm');
    if (form) {
      form.submit(); // Isso inicia o download direto no navegador!
    }

    // Fecha o modal
    closeModal();
  };

  // Fechar modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Download de Vídeos</h1>
        <p style={styles.subtitle}>YouTube • TikTok • Instagram</p>

        {/* Disclaimer Legal */}
        <div style={styles.disclaimer}>
          {/* ... (seu disclaimer continua igual) ... */}
          <strong>⚠️ AVISO LEGAL:</strong>
          <p>
            Este serviço é fornecido apenas para fins educacionais e pessoais.
            Você é responsável por garantir que possui os direitos autorais
            ou permissão para baixar o conteúdo. O uso indevido pode violar
            as leis de direitos autorais.
          </p>
        </div>

        {/* MUDANÇA 3: O formulário principal agora chama handleOpenModal */}
        <form onSubmit={handleOpenModal} style={styles.form}>
          <input
            type="text"
            placeholder="Cole a URL do vídeo aqui..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={styles.input}
            disabled={showModal}
          />

          <div style={styles.qualitySelector}>
            <label htmlFor="qualitySelect" style={styles.selectLabel}>
              Selecione a Qualidade:
            </label>
            <select
              id="qualitySelect"
              style={styles.select}
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={showModal}
            >
              <option value="best">Melhor Disponível (Pode ser 4K+)</option>
              <option value="1080p">1080p (Full HD - Padrão)</option>
              <option value="720p">720p (HD)</option>
              <option value="360p">360p (Baixa Qualidade)</option>
            </select>
          </div>

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
           {/* ... (seu footer continua igual) ... */}
           <p>Suporta vídeos de YouTube, TikTok, Instagram e outras plataformas.</p>
          <p style={styles.footerSmall}>
            Use responsavelmente. Respeite os direitos autorais.
          </p>
        </div>
      </div>

      {/* --- MUDANÇA 4: FORMULÁRIO INVISÍVEL ADICIONADO --- */}
      {/* Este formulário é quem vai falar com o backend */}
      <form
        id="downloadForm"
        method="POST"
        // Ação aponta para a rota /api/download (vídeo inteiro)
        action={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/download`}
        style={{ display: 'none' }}
      >
        <input type="hidden" name="url" value={url} />
        <input type="hidden" name="quality" value={quality} />
      </form>

      {/* MUDANÇA 5: O MODAL FOI SIMPLIFICADO */}
      {/* Ele não tem mais 'loading', 'success', 'error'. Ele só abre. */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Botão fechar */}
            <button style={styles.closeButton} onClick={closeModal}>
              ✕
            </button>
            
            <h2 style={styles.modalTitle}>Seu download está pronto!</h2>
            <p style={styles.modalText}>
              Clique no botão abaixo para iniciar o download direto para sua máquina.
            </p>

            {/* --- AQUI VOCÊ COLOCA O ADSENSE --- */}
            <div style={styles.adPlaceholder}>
              <p>(Espaço reservado para Anúncios do AdSense)</p>
            </div>
            {/* --- FIM DO ESPAÇO DO ADSENSE --- */}

            {/* O botão de download final que aciona o formulário invisível */}
            <button
              style={styles.downloadButtonEnabled}
              onClick={handleFinalDownload}
            >
              📥 Baixar Vídeo Agora
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

// --- MUDANÇA 6: ESTILOS ---
// Adicionei 'adPlaceholder' e simplifiquei os estilos do modal
// (Os estilos que você já tinha estão aqui, só adicionei/removi o necessário)
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
  qualitySelector: {
    textAlign: 'left',
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

  // --- Estilos do Modal (Simplificados) ---
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
    margin: '10px 0 20px 0',
    fontSize: '14px',
    color: '#666',
  },
  // --- NOVO ESTILO PARA O AD ---
  adPlaceholder: {
      border: '2px dashed #ccc',
      padding: '40px',
      margin: '25px 0',
      textAlign: 'center',
      color: '#999',
      fontSize: '14px',
      backgroundColor: '#fafafa',
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
};

// Adiciona as animações CSS globalmente
const keyframesStyle = `
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
  if (!rules.includes('fadeIn')) {
      styleSheet.insertRule(keyframesStyle, styleSheet.cssRules.length);
  }
}
