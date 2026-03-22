import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useWallet } from '../context/WalletContext'

function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}

export function CreateOfferModal({ onClose }) {
  const { walletAddress } = useWallet()

  const [form, setForm] = useState({
    title:    '',
    desc:     '',
    amount:   '',
    resolver: '',
  })

  const [offerUrl, setOfferUrl]   = useState(null)
  const [copied,   setCopied]     = useState(false)

  function handleChange(ev) {
    setForm(prev => ({ ...prev, [ev.target.name]: ev.target.value }))
  }

  function handleGenerate(ev) {
    ev.preventDefault()
    const base = import.meta.env.VITE_APP_URL || window.location.origin
    const url = new URL('/buy', base)
    url.searchParams.set('seller', walletAddress)
    url.searchParams.set('amount', form.amount)
    url.searchParams.set('title',  form.title)
    if (form.desc)     url.searchParams.set('desc',     form.desc)
    if (form.resolver) url.searchParams.set('resolver', form.resolver)
    setOfferUrl(url.toString())
    setCopied(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(offerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Vista QR ── */
  if (offerUrl) {
    return (
      <ModalOverlay onClose={onClose}>
        <div className="modal-form">
          <div className="modal-header">
            <div>
              <span className="modal-tag">QR Generado</span>
              <h2 className="modal-title">Comparte con el comprador</h2>
            </div>
            <button type="button" className="modal-x" onClick={onClose} aria-label="Cerrar">×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            {/* QR */}
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px' }}>
              <QRCodeSVG value={offerUrl} size={200} />
            </div>

            {/* Resumen de la oferta */}
            <div className="buy-details" style={{ width: '100%' }}>
              <div className="buy-detail-row">
                <span className="buy-detail-label">Producto</span>
                <span style={{ color: 'var(--text)' }}>{form.title}</span>
              </div>
              <div className="buy-detail-row">
                <span className="buy-detail-label">Precio</span>
                <span className="buy-amount">{form.amount} USDC</span>
              </div>
              <div className="buy-detail-row">
                <span className="buy-detail-label">Tu dirección</span>
                <code className="modal-wallet-addr">{shortenAddress(walletAddress)}</code>
              </div>
            </div>

            {/* URL copiable */}
            <div className="contract-id-box" style={{ width: '100%' }}>
              <span className="contract-label">Enlace de la oferta</span>
              <code className="contract-value" style={{ fontSize: '0.63rem', wordBreak: 'break-all' }}>
                {offerUrl}
              </code>
            </div>

            {/* Acciones */}
            <div className="modal-actions" style={{ width: '100%' }}>
              <button className="btn-modal-ghost" onClick={() => setOfferUrl(null)} style={{ flex: 1 }}>
                Nueva oferta
              </button>
              <button className="btn-modal-primary" onClick={handleCopy} style={{ flex: 1 }}>
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </button>
            </div>
          </div>
        </div>
      </ModalOverlay>
    )
  }

  /* ── Formulario ── */
  return (
    <ModalOverlay onClose={onClose}>
      <form className="modal-form" onSubmit={handleGenerate}>
        <div className="modal-header">
          <div>
            <span className="modal-tag">Vender</span>
            <h2 className="modal-title">Crear oferta con QR</h2>
          </div>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Vendedor (pre-llenado con tu wallet) */}
        <div className="modal-wallet-row">
          <span className="status-dot" />
          <span className="modal-wallet-label">Tu dirección (vendedor)</span>
          <code className="modal-wallet-addr">{shortenAddress(walletAddress)}</code>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">
              Producto o servicio <span className="form-required">*</span>
            </label>
            <input
              name="title"
              placeholder="Ej: Bolsa de café orgánico 1 kg"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Descripción <span className="form-hint"> — opcional</span>
            </label>
            <textarea
              name="desc"
              rows={2}
              placeholder="Detalles adicionales del producto..."
              value={form.desc}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Precio (USDC) <span className="form-required">*</span>
            </label>
            <input
              type="number"
              name="amount"
              placeholder="15.00"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </div>

          {/* Desglose de comisión */}
          {form.amount > 0 && (
            <div className="fee-breakdown">
              <div className="fee-breakdown-row">
                <span>Precio de venta</span>
                <span>{Number(form.amount).toFixed(2)} USDC</span>
              </div>
              <div className="fee-breakdown-row fee-breakdown-deduction">
                <span>Comisión Kivo (1%)</span>
                <span>− {(Number(form.amount) * 0.01).toFixed(2)} USDC</span>
              </div>
              <div className="fee-breakdown-row fee-breakdown-total">
                <span>Recibes tú</span>
                <span>{(Number(form.amount) * 0.99).toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">
              Árbitro <span className="form-hint"> — opcional, por defecto tu dirección</span>
            </label>
            <input
              name="resolver"
              placeholder="G... (dirección Stellar del árbitro)"
              value={form.resolver}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Info del flujo */}
        <div className="modal-flow-info">
          <div className="flow-step"><span className="flow-n">1</span> El comprador escanea el QR y conecta su wallet</div>
          <div className="flow-step"><span className="flow-n">2</span> El escrow se crea con ambas direcciones automáticamente</div>
          <div className="flow-step"><span className="flow-n">3</span> El comprador aprueba al recibir — los fondos te llegan</div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-modal-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-modal-primary">
            Generar QR
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

/* ── Overlay ── */
function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={ev => { if (ev.target === ev.currentTarget) onClose() }}
    >
      <div className="modal-box">
        {children}
      </div>
    </div>
  )
}
