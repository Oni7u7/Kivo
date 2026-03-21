import { useState, useEffect } from 'react'
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api'
import { EscrowModal }  from './components/EscrowModal'
import { EscrowDrawer } from './components/EscrowDrawer'
import './App.css'

function shortenAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [walletError, setWalletError] = useState(null)
  const [showEscrow, setShowEscrow]   = useState(false)
  const [showDrawer, setShowDrawer]   = useState(false)

  useEffect(() => {
    async function checkWallet() {
      try {
        const connected = await isConnected()
        if (connected) {
          const { address } = await getAddress()
          if (address) setWalletAddress(address)
        }
      } catch (_) {}
    }
    checkWallet()
  }, [])

  async function handleConnect() {
    setConnecting(true)
    setWalletError(null)
    try {
      const { address, error } = await requestAccess()
      if (error) {
        setWalletError('No se pudo conectar. ¿Tienes Freighter instalado?')
      } else {
        setWalletAddress(address)
      }
    } catch (_) {
      setWalletError('Freighter no encontrado. Instala la extensión.')
    } finally {
      setConnecting(false)
    }
  }

  function handleDisconnect() {
    setWalletAddress(null)
    setWalletError(null)
  }

  return (
    <div className="app">

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-brand">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5" stroke="var(--gold)" strokeWidth="1.5" fill="none"/>
          </svg>
          <span>Kivo</span>
        </div>

        <div className="nav-wallet">
          {walletAddress ? (
            <>
              <button className="btn-my-escrows" onClick={() => setShowDrawer(true)}>
                Mis Escrows
              </button>
              <div className="wallet-chip">
                <span className="status-dot" />
                <span className="wallet-addr">{shortenAddress(walletAddress)}</span>
              </div>
              <button className="btn-disconnect" onClick={handleDisconnect}>
                Desconectar
              </button>
            </>
          ) : (
            <button className="btn-connect" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <><span className="spinner" /> Conectando</>
              ) : (
                'Conectar Wallet'
              )}
            </button>
          )}
        </div>
      </nav>

      {walletError && (
        <div className="error-banner">{walletError}</div>
      )}

      {/* ── HERO ── */}
      <header className="hero">
        <p className="hero-eyebrow">Stellar Hackathon 2026</p>
        <h1 className="hero-title">
          Rieles de Confianza<br />
          <span className="text-gold">para el Comercio Mexicano</span>
        </h1>
        <p className="hero-body">
          Custodia programática sobre Stellar. El dinero solo se libera cuando
          las condiciones del trato se cumplen — sin intermediarios, sin fraude,
          con certeza matemática.
        </p>
        <div className="hero-actions">
          {walletAddress ? (
            <>
              <button className="btn-primary" onClick={() => setShowEscrow(true)}>
                Crear Escrow
              </button>
              <div className="connected-badge">
                <span className="status-dot" />
                {shortenAddress(walletAddress)}
              </div>
            </>
          ) : (
            <button className="btn-primary" onClick={handleConnect} disabled={connecting}>
              {connecting ? 'Conectando...' : 'Empezar con Freighter'}
            </button>
          )}
          <a href="#vision" className="btn-ghost">Ver más</a>
        </div>
      </header>

      {/* ── DIVIDER ── */}
      <div className="divider" />

      {/* ── VISIÓN ── */}
      <section id="vision" className="section">
        <span className="tag">Panorama General</span>
        <h2>¿Qué es Kivo?</h2>
        <p className="body-text">
          Kivo es una infraestructura fintech de <em>"Rieles de Confianza"</em> diseñada
          para el mercado mexicano y transfronterizo. Funciona como una plataforma de{' '}
          <strong>custodia programática (Escrow)</strong> que asegura transacciones de alto
          valor eliminando el riesgo de fraude entre desconocidos.
        </p>
        <p className="body-text">
          A diferencia de un notario tradicional, Kivo utiliza la red{' '}
          <strong>Stellar</strong> para garantizar que el dinero solo se libere cuando
          las condiciones del trato se cumplan, transformando la desconfianza del mercado
          informal en <strong>certeza matemática</strong>.
        </p>
      </section>

      {/* ── PROBLEMA ── */}
      <section className="section section-alt">
        <span className="tag">El Problema</span>
        <h2>Lo que resolvemos</h2>
        <div className="two-col">
          <div className="card">
            <div className="card-icon teal-icon">⬡</div>
            <h3>Inseguridad en Transacciones</h3>
            <p>El miedo a estafas en la compraventa de autos o inmuebles genera parálisis financiera en México.</p>
          </div>
          <div className="card">
            <div className="card-icon gold-icon">⬡</div>
            <h3>Fricción en Remesas</h3>
            <p>Los migrantes en EE. UU. no tienen forma segura de pagar activos directamente en México garantizando que el dinero llegue al vendedor real.</p>
          </div>
        </div>
      </section>

      {/* ── ARQUITECTURA ── */}
      <section className="section">
        <span className="tag">Arquitectura Técnica</span>
        <h2>Cuatro pilares Stellar-Native</h2>
        <div className="four-col">
          {[
            { n: '01', title: 'Smart Contracts', sub: 'Soroban / Rust', body: 'Cofre digital inmutable. Los fondos se bloquean y solo se liberan bajo condiciones predefinidas y auditables.' },
            { n: '02', title: 'Rampa de Rendimiento', sub: 'Etherfuse / RWA', body: 'El capital en custodia se convierte en tokens de bonos gubernamentales — productivo en lugar de estático.' },
            { n: '03', title: 'On/Off Ramps', sub: 'SEP-24 · Bitso · Anclap', body: 'Depósitos vía SPEI y retiros bancarios instantáneos en múltiples divisas a través de Anchors nativos.' },
            { n: '04', title: 'AI Concierge', sub: 'WhatsApp + App', body: 'Agente inteligente que traduce la complejidad blockchain a lenguaje sencillo. Soporte 24/7 del estado del dinero.' },
          ].map(p => (
            <div className="pillar" key={p.n}>
              <span className="pillar-n">{p.n}</span>
              <h3>{p.title}</h3>
              <p className="pillar-sub">{p.sub}</p>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODELO DE NEGOCIO ── */}
      <section className="section section-alt">
        <span className="tag">Business Model</span>
        <h2>Modelo de Negocio</h2>

        <div className="four-col bmc">
          {[
            { title: 'Propuesta de Valor', items: ['"Confianza Instantánea": escrow inmutable con rendimientos reales (RWA) y comisiones competitivas.'] },
            { title: 'Clientes', items: ['Mexicanos en EE. UU.', 'Lotes de autos · Inmobiliarias', 'Freelancers internacionales'] },
            { title: 'Socios Clave', items: ['SDF · Stellar Foundation', 'Etherfuse (RWA)', 'Bitso · Anclap', 'Compliance MX/EE.UU.'] },
            { title: 'Recursos', items: ['Contratos Soroban', 'Red de Anchors', 'Agentes de IA', 'Reputación on-chain'] },
          ].map(b => (
            <div className="bmc-block" key={b.title}>
              <h4>{b.title}</h4>
              <ul>{b.items.map(i => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>

        {/* Ingresos */}
        <div className="revenue-block">
          <h3>Modelo Financiero</h3>
          <div className="revenue-grid">
            <div>
              <p className="rev-label">Comisiones por transacción</p>
              <div className="fee-list">
                <div className="fee-item"><span>Starter</span><span className="fee-num">3%</span></div>
                <div className="fee-item"><span>Growth</span><span className="fee-num">2.5%</span></div>
                <div className="fee-item"><span>Enterprise</span><span className="fee-num">—</span></div>
              </div>
              <p className="rev-note">+ Float Yield en custodia · + Verificación vehicular y legal</p>
            </div>
            <div>
              <p className="rev-label">Estructura de Costos</p>
              <ul className="cost-list">
                <li>Auditoría de Smart Contracts e IA</li>
                <li>Compliance regulatorio MX/EE.UU.</li>
                <li>Infraestructura cloud</li>
                <li>Adquisición de clientes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── OBJETIVOS ── */}
      <section className="section">
        <span className="tag">Hackathon 2026</span>
        <h2>Objetivos de Demostración</h2>
        <div className="three-col">
          {[
            { icon: '⚡', title: 'Interoperabilidad', body: 'Movimiento de fondos de EE. UU. a México con liquidación en segundos.' },
            { icon: '◈', title: 'Eficiencia', body: 'Transacciones de bajo costo para proteger desde micro-pagos hasta grandes capitales.' },
            { icon: '⬟', title: 'Impacto Social', body: 'Proteger el patrimonio de familias mexicanas frente al fraude documental y financiero.' },
          ].map(g => (
            <div className="goal-card" key={g.title}>
              <span className="goal-icon">{g.icon}</span>
              <h3>{g.title}</h3>
              <p>{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUOTE ── */}
      <div className="divider" />
      <section className="quote-section">
        <blockquote>
          Kivo convierte la desconfianza del mercado informal en la{' '}
          <span className="text-gold">certeza matemática de la red Stellar</span>,
          protegiendo el esfuerzo de los trabajadores y haciendo que su dinero rinda
          incluso antes de ser gastado.
        </blockquote>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <polygon points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5" stroke="var(--gold)" strokeWidth="1.5" fill="none"/>
        </svg>
        <span>Kivo · Stellar Hackathon 2026</span>
      </footer>

      {/* ── ESCROW MODAL ── */}
      {showEscrow && (
        <EscrowModal
          walletAddress={walletAddress}
          onClose={() => setShowEscrow(false)}
        />
      )}

      {/* ── ESCROW DRAWER ── */}
      {showDrawer && (
        <EscrowDrawer
          walletAddress={walletAddress}
          onClose={() => setShowDrawer(false)}
        />
      )}

    </div>
  )
}
