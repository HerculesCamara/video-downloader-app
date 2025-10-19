export const metadata = {
  title: 'Video Downloader - YouTube, TikTok, Instagram',
  description: 'Baixe vídeos do YouTube, TikTok, Instagram e outras plataformas de forma simples e rápida.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          /* Animações CSS */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes progressIndeterminate {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(250%); }
            100% { transform: translateX(-100%); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Hover effects */
          button:hover:not(:disabled) {
            opacity: 0.9;
          }

          a:hover {
            opacity: 0.9;
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
