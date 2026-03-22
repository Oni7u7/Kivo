import { useState } from 'react'
import { useEscrowFlow } from '../hooks/useEscrowFlow'

function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}

/**
 * Modal para crear un escrow de liberación única con TrustlessWork.
 *
 * Props:
 *   - walletAddress: string  (dirección del cliente/comprador conectado)
 *   - onClose: () => void
 */
export function EscrowModal({ walletAddress, onClose }) {
  const { createEscrow, loading, error, result } = useEscrowFlow()

  const [form, setForm] = useState({
    title:           '',
    description:     '',
    milestoneDesc:   '',
    serviceProvider: '',
    receiver:        '',
    disputeResolver: '',
    amount:          '',
    platformFee:     '2',
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await createEscrow(form, walletAddress)
  }

  // ── Estado: éxito ────────────────────────────────────────────────────────
  if (result?.contractId !== undefined) {
    return (
      <ModalOverlay onClose={onClose}>
        <div className="modal-success">
          <div className="modal-success-icon">✓</div>
          <h3>¡Escrow creado!</h3>
          <p className="modal-success-sub">
            Tu contrato de custodia está desplegado en la red Stellar.
          </p>
          {result.contractId ? (
            <div className="contract-id-box">
              <span className="contract-label">Contract ID</span>
              <code className="contract-value">{result.contractId}</code>
            </div>
          ) : (
            <p className="modal-success-sub" style={{ color: 'var(--teal)' }}>
              Transacción enviada — el Contract ID se confirma en unos segundos.
            </p>
          )}
          <button className="btn-modal-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </ModalOverlay>
    )
  }

  // ── Formulario ───────────────────────────────────────────────────────────
  return (
    <ModalOverlay onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span className="modal-tag">TrustlessWork · Single-Release</span>
            <h2 className="modal-title">Nuevo Escrow</h2>
          </div>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Wallet del cliente */}
        <div className="modal-wallet-row">
          <span className="status-dot" />
          <span className="modal-wallet-label">Cliente (tú)</span>
          <code className="modal-wallet-addr">{shortenAddress(walletAddress)}</code>
        </div>

        {/* Campos del escrow */}
        <div className="form-grid">
          <Field label="Título del Escrow" required>
            <input
              name="title"
              placeholder="Ej. Compra de vehículo Toyota 2022"
              value={form.title}
              onChange={handleChange}
              required
            />
          </Field>

          <Field label="Descripción" required>
            <textarea
              name="description"
              rows={2}
              placeholder="Describe el acuerdo entre las partes…"
              value={form.description}
              onChange={handleChange}
              required
            />
          </Field>

          <Field label="Descripción del hito" hint="¿Qué debe entregarse para liberar los fondos?">
            <input
              name="milestoneDesc"
              placeholder="Ej. Entrega física del vehículo con documentación"
              value={form.milestoneDesc}
              onChange={handleChange}
            />
          </Field>

          <div className="form-two-col">
            <Field label="Monto (USDC)" required>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </Field>

            <div className="form-field">
              <label className="form-label">Comisión Kivo</label>
              <div className="platform-fee-badge">2%</div>
            </div>
          </div>

          <Field label="Dirección del Vendedor (Service Provider)" required>
            <input
              name="serviceProvider"
              placeholder="G..."
              value={form.serviceProvider}
              onChange={handleChange}
              required
            />
          </Field>

          <Field
            label="Dirección del Receptor"
            hint="Deja vacío para usar la misma del vendedor"
          >
            <input
              name="receiver"
              placeholder="G... (opcional)"
              value={form.receiver}
              onChange={handleChange}
            />
          </Field>

          <Field label="Resolutor de Disputas" hint="Árbitro neutral en caso de conflicto" required>
            <input
              name="disputeResolver"
              placeholder="G..."
              value={form.disputeResolver}
              onChange={handleChange}
              required
            />
          </Field>
        </div>

        {/* Info del flujo */}
        <div className="modal-flow-info">
          <div className="flow-step"><span className="flow-n">1</span> Se despliega el contrato en Soroban</div>
          <div className="flow-step"><span className="flow-n">2</span> Firmas con Freighter</div>
          <div className="flow-step"><span className="flow-n">3</span> Se envía a la red Stellar</div>
        </div>

        {/* Error */}
        {error && (
          <div className="modal-error">{error}</div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button type="button" className="btn-modal-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="btn-modal-primary" disabled={loading}>
            {loading ? (
              <><span className="spinner" /> Procesando…</>
            ) : (
              'Crear Escrow'
            )}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

/* ── Overlay ──────────────────────────────────────────────────────────── */
function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-box">
        {children}
      </div>
    </div>
  )
}

/* ── Field helper ─────────────────────────────────────────────────────── */
function Field({ label, hint, required, children }) {
  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
        {hint && <span className="form-hint"> — {hint}</span>}
      </label>
      {children}
    </div>
  )
}
