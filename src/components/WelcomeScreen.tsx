// WelcomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import icono from '../img/logo1.png'; // Usando tu logo real

const quotes = [
  '"Tu salud es nuestra prioridad. Confía en profesionales que cuidan de ti."',
  '"Medicamentos de calidad y atención personalizada para tu bienestar."',
  '"Cuidamos de ti y tu familia las 24 horas del día."'
];

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [quoteOpacity, setQuoteOpacity] = useState(1);

  useEffect(() => {
    if (loading) {
      let quoteChanges = 0;
      const quoteInterval = setInterval(() => {
        // Efecto de fade para el texto
        setQuoteOpacity(0);
        
        setTimeout(() => {
          setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
          setQuoteOpacity(1);
          quoteChanges++;
        }, 500);

        if (quoteChanges >= 2) {
          clearInterval(quoteInterval);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => navigate('/login'), 800);
          }, 1500);
        }
      }, 2500);

      return () => clearInterval(quoteInterval);
    }
  }, [loading, navigate]);

  const handleStart = () => {
    setLoading(true);
  };

  return (
    <div className={`welcome-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="overlay">
        <div className={`container ${loading ? 'is-loading' : ''}`}>
          <div className="glass-card">
            <div className="content">
              {/* Logo con brillo sutil */}
              <div className="logo-wrapper">
                <img src={icono} alt="Clínica Montecinos" className="main-logo" />
              </div>

              <h1 className="main-title">Clínica Montecinos</h1>
              <div className="divider"></div>
              
              <p className="quote-text" style={{ opacity: quoteOpacity }}>
                {quotes[currentQuoteIndex]}
              </p>

              <button 
                className={`action-button ${loading ? 'btn-loading' : ''}`}
                onClick={handleStart}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  'INGRESAR AL SISTEMA'
                )}
              </button>
            </div>
          </div>
          
          <p className="footer-tag">Panel de Control Farmacéutico 2026</p>
        </div>
      </div>

      <style>{`
        .welcome-screen {
          width: 100%;
          height: 100vh;
          background-image: url('/fondo-clinica.jpg'); /* Asegúrate de tener esta imagen en public */
          background-size: cover;
          background-position: center;
          transition: transform 1.2s cubic-bezier(0.7, 0, 0.3, 1), opacity 0.8s;
        }

        .welcome-screen.fade-out {
          opacity: 0;
          transform: scale(1.1);
        }

        .overlay {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-blur: 2px;
        }

        .container {
          width: 90%;
          max-width: 500px;
          text-align: center;
          transition: all 0.5s ease;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 32px;
          padding: 50px 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }

        .logo-wrapper {
          width: 160px;
          height: 100px;
          margin: 0 auto 30px;
          filter: drop-shadow(0 0 15px rgba(33, 28, 115, 0.4));
        }

        .main-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          animation: float 4s infinite ease-in-out;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .main-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .divider {
          width: 50px;
          height: 4px;
          background: #265FFF;
          margin: 15px auto 25px;
          border-radius: 10px;
        }

        .quote-text {
          font-size: 1.05rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          min-height: 60px;
          margin-bottom: 40px;
          font-style: italic;
          font-weight: 300;
          transition: opacity 0.5s ease;
        }

        .action-button {
          background: #265FFF;
          color: white;
          width: 100%;
          padding: 18px;
          border-radius: 16px;
          border: none;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px -5px rgba(38, 95, 255, 0.4);
        }

        .action-button:hover {
          background: #1e4bc2;
          transform: translateY(-2px);
          box-shadow: 0 15px 25px -5px rgba(38, 95, 255, 0.5);
        }

        .action-button:active {
          transform: translateY(0);
        }

        .footer-tag {
          margin-top: 30px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Estilo para cuando está cargando */
        .is-loading .glass-card {
          transform: scale(0.98);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;