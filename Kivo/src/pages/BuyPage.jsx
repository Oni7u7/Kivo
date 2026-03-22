import { ConnectButton } from 'accesly'
import { useWallet } from '../context/WalletContext'
import { useEscrowFlow } from '../hooks/useEscrowFlow'

function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function BuyPage() {
  const params   = new URLSearchParams(window.location.search)
  const seller   = params.get('seller')   || ''
  const amount   = params.get('amount')   || '0'
  const title    = params.get('title')    || 'Oferta'
  const desc     = params.get('desc')     || title
  const resolver = params.get('resolver') || seller

  const {
    walletAddress,
    connectFreighter,
    freighterLoading,
    freighterAddr,
    disconnectFreighter,
  } = useWallet()

  const { createEscrow, loading, error, result } = useEscrowFlow()

  async function handleBuy() {
    if (!walletAddress) return
    await createEscrow(
      {
        title,
        description:     desc,
        milestoneDesc:   desc,
        serviceProvider: seller,
        receiver:        seller,
        disputeResolver: resolver,
        amount,
        platformFee:     '1',
      },
      walletAddress,
    )
  }

  /* ── Éxito ── */
  if (result?.contractId !== undefined) {
    return (
      <div className="app">
        <BuyNav freighterAddr={freighterAddr} freighterLoading={freighterLoading} connectFreighter={connectFreighter} disconnectFreighter={disconnectFreighter} />
        <div className="buy-container">
          <div className="buy-card">
            <div className="modal-success-icon">✓</div>
            <h2 style={{ marginBottom: '0.5rem' }}>¡Escrow creado!</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
              Tu compra está protegida en la red Stellar.
            </p>
            {result.contractId && (
              <div className="contract-id-box">
                <span className="contract-label">Contract ID</span>
                <code className="contract-value">{result.contractId}</code>
              </div>
            )}
            <div className="buy-flow-info" style={{ marginTop: '1.25rem' }}>
              <div className="flow-step"><span className="flow-n">1</span> Escrow desplegado en Stellar</div>
              <div className="flow-step"><span className="flow-n">2</span> Financia el escrow con {amount} USDC</div>
              <div className="flow-step"><span className="flow-n">3</span> Aprueba cuando el vendedor entregue</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Formulario de compra ── */
  return (
    <div className="app">
      <BuyNav
        freighterAddr={freighterAddr}
        freighterLoading={freighterLoading}
        connectFreighter={connectFreighter}
        disconnectFreighter={disconnectFreighter}
      />

      <div className="buy-container">
        <div className="buy-card">
          <span className="modal-tag">Oferta de compra segura</span>
          <h2 className="buy-title">{title}</h2>
          {desc !== title && <p className="buy-desc">{desc}</p>}

          <div className="buy-details">
            <div className="buy-detail-row">
              <span className="buy-detail-label">Precio</span>
              <span className="buy-amount">{amount} USDC</span>
            </div>
            <div className="buy-detail-row">
              <span className="buy-detail-label">Vendedor</span>
              <code className="modal-wallet-addr">{shortenAddress(seller)}</code>
            </div>
          </div>

          <div className="buy-flow-info">
            <div className="flow-step"><span className="flow-n">1</span> Conecta tu wallet</div>
            <div className="flow-step"><span className="flow-n">2</span> Tu dirección queda como comprador en el escrow</div>
            <div className="flow-step"><span className="flow-n">3</span> Financia y espera la entrega para liberar fondos</div>
          </div>

          {error && <div className="modal-error">{error}</div>}

          {walletAddress ? (
            <>
              <div className="modal-wallet-row" style={{ marginBottom: '1rem' }}>
                <span className="status-dot" />
                <span className="modal-wallet-label">Tu wallet:</span>
                <code className="modal-wallet-addr">{shortenAddress(walletAddress)}</code>
              </div>
              <button
                className="btn-primary buy-btn"
                onClick={handleBuy}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" /> Creando escrow...</>
                  : `Comprar por ${amount} USDC`
                }
              </button>
            </>
          ) : (
            <div className="buy-connect-section">
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                Conecta tu wallet para comprar de forma segura
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn-connect-freighter"
                  onClick={connectFreighter}
                  disabled={freighterLoading}
                >
                  {freighterLoading ? <span className="spinner" /> : 'Freighter'}
                </button>
                <ConnectButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Navbar reutilizable dentro de BuyPage ── */
function BuyNav({ freighterAddr, freighterLoading, connectFreighter, disconnectFreighter }) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <polygon points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5" stroke="var(--gold)" strokeWidth="1.5" fill="none"/>
        </svg>
        <span>Kivo</span>
      </div>
      <div className="nav-wallet">
        {freighterAddr ? (
          <div className="wallet-chip">
            <span className="status-dot" />
            <span className="wallet-addr">{freighterAddr.slice(0, 6)}...{freighterAddr.slice(-4)}</span>
            <button className="btn-disconnect" onClick={disconnectFreighter}>✕</button>
          </div>
        ) : (
          <button className="btn-connect-freighter" onClick={connectFreighter} disabled={freighterLoading}>
            {freighterLoading ? <span className="spinner" /> : 'Freighter'}
          </button>
        )}
        <ConnectButton />
      </div>
    </nav>
  )
}
