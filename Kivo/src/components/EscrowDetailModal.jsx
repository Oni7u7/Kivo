import { useState } from 'react'
import { useEscrowFlow } from '../hooks/useEscrowFlow'
import { getEscrowStatus } from '../hooks/useMyEscrows'

/* ── Mapa de roles ─────────────────────────────────────────────────── */
const ROLES_CONFIG = [
  { key: 'approver',        label: 'Comprador',    desc: 'Aprueba y libera los fondos' },
  { key: 'serviceProvider', label: 'Vendedor',     desc: 'Entrega el bien o servicio' },
  { key: 'releaseSigner',   label: 'Firmante',     desc: 'Firma la transacción de pago' },
  { key: 'disputeResolver', label: 'Árbitro',      desc: 'Resuelve conflictos entre partes' },
  { key: 'receiver',        label: 'Receptor',     desc: 'Recibe los fondos finales' },
  { key: 'platformAddress', label: 'Plataforma',   desc: 'Percibe la comisión del trato' },
]

function shorten(addr, s = 8, e = 6) {
  if (!addr) return '—'
  return `${addr.slice(0, s)}...${addr.slice(-e)}`
}

function isMe(addr, walletAddress) {
  return addr && walletAddress && addr.toLowerCase() === walletAddress.toLowerCase()
}

/**
 * Flujo single-release:
 *   1. Fondear   (approver,      balance === 0)
 *   2. Aprobar   (approver,      balance > 0 y hito sin aprobar)
 *   3. Liberar   (releaseSigner, balance > 0 y todos los hitos aprobados)
 */
function getActions(escrow, walletAddress) {
  const flags        = escrow?.flags ?? {}
  const roles        = escrow?.roles ?? {}
  const balance      = Number(escrow?.balance ?? 0)
  const totalAmount  = Number(escrow?.amount ?? 0)
  const addr         = walletAddress?.toLowerCase() ?? ''
  const milestones   = escrow?.milestones ?? []
  const allApproved  = milestones.length > 0 && milestones.every(m => m.approved)
  const fullyFunded  = totalAmount > 0 && balance >= totalAmount

  if (flags.released || flags.resolved) return []

  const actions = []

  // 1. Fondear (mientras el balance no alcance el monto requerido)
  if (!fullyFunded && roles.approver?.toLowerCase() === addr)
    actions.push('fund')

  // 2. Aprobar hito (solo cuando el escrow está completamente fondeado)
  if (fullyFunded && !allApproved && roles.approver?.toLowerCase() === addr)
    actions.push('approve')

  // 3. Liberar (solo si todos los hitos están aprobados)
  if (fullyFunded && allApproved && roles.releaseSigner?.toLowerCase() === addr)
    actions.push('release')

  return actions
}

/* ── Componente principal ───────────────────────────────────────────── */
export function EscrowDetailModal({ escrow, walletAddress, onClose, onActionDone }) {
  const { fundEscrow, approveMilestone, releaseFunds, loading, error } = useEscrowFlow()
  const totalAmount   = Number(escrow?.amount ?? 0)
  const currentBalance = Number(escrow?.balance ?? 0)
  const remaining     = Math.max(0, totalAmount - currentBalance)
  const [fundAmount, setFundAmount] = useState(String(remaining || totalAmount || ''))
  const [actionDone, setActionDone] = useState(null)

  const status  = getEscrowStatus(escrow)
  const actions = getActions(escrow, walletAddress)

  async function handleFund() {
    await fundEscrow(escrow.contractId, fundAmount, walletAddress)
    setActionDone('funded')
    onActionDone?.()
  }

  async function handleApprove() {
    // Single-release tiene un solo hito: índice 0
    await approveMilestone(escrow.contractId, 0, walletAddress)
    setActionDone('approved')
    onActionDone?.()
  }

  async function handleRelease() {
    await releaseFunds(escrow.contractId, walletAddress)
    setActionDone('released')
    onActionDone?.()
  }

  const actionLabels = {
    funded:   'Escrow fondeado correctamente.',
    approved: 'Hito aprobado. Ya puedes liberar los fondos.',
    released: 'Fondos liberados al vendedor.',
  }

  return (
    <div className="detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="detail-box">

        {/* ── Header ── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <span className={`ec-status ${status.color}`}>{status.label}</span>
            <h2 className="detail-title">{escrow.title || 'Sin título'}</h2>
            <p className="detail-type">
              {escrow.type === 'multi-release' ? 'Multi-Release' : 'Single-Release'} ·{' '}
              {escrow.trustline?.symbol ?? 'USDC'}
            </p>
          </div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        {/* ── Monto ── */}
        <div className="detail-amount-row">
          <div className="detail-amount">
            <span className="detail-amount-val">{escrow.amount ?? '—'}</span>
            <span className="detail-amount-sym">{escrow.trustline?.symbol ?? 'USDC'}</span>
          </div>
          {escrow.balance !== undefined && (
            <div className="detail-balance">
              <span className="detail-balance-label">En custodia</span>
              <span className="detail-balance-val">
                {escrow.balance} {escrow.trustline?.symbol ?? 'USDC'}
              </span>
            </div>
          )}
        </div>

        {/* ── Descripción ── */}
        {escrow.description && (
          <p className="detail-desc">{escrow.description}</p>
        )}

        {/* ── Roles ── */}
        <div className="detail-section">
          <span className="detail-section-label">Roles del Contrato</span>
          <div className="roles-grid">
            {ROLES_CONFIG.map(({ key, label, desc }) => {
              const addr = escrow.roles?.[key]
              const mine = isMe(addr, walletAddress)
              return (
                <div key={key} className={`role-card ${mine ? 'role-card-mine' : ''}`}>
                  <div className="role-top">
                    <span className="role-label">{label}</span>
                    {mine && <span className="role-you-badge">Tú</span>}
                  </div>
                  <code className="role-addr">{shorten(addr)}</code>
                  <span className="role-desc">{desc}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Hitos ── */}
        {escrow.milestones?.length > 0 && (
          <div className="detail-section">
            <span className="detail-section-label">Hitos</span>
            <div className="milestones-list">
              {escrow.milestones.map((m, i) => (
                <div key={i} className="milestone-item">
                  <span className={`milestone-dot ${m.approved ? 'milestone-done' : ''}`} />
                  <span className="milestone-desc">{m.description || `Hito ${i + 1}`}</span>
                  {m.approved && <span className="milestone-check">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Contract ID ── */}
        {escrow.contractId && (
          <div className="detail-section">
            <span className="detail-section-label">Contract ID</span>
            <div className="detail-contract-row">
              <code className="detail-contract-id">{escrow.contractId}</code>
              <button
                className="ec-copy"
                title="Copiar"
                onClick={() => navigator.clipboard.writeText(escrow.contractId)}
              >
                <CopyIcon />
              </button>
            </div>
          </div>
        )}

        {/* ── Acciones ── */}
        {actions.length > 0 && !actionDone && (
          <div className="detail-actions">

            {/* Paso 1: Fondear */}
            {actions.includes('fund') && (
              <div className="action-block">
                <div className="action-step-header">
                  <span className="action-step-num">1</span>
                  <span className="detail-section-label">Fondear Escrow</span>
                </div>

                {/* Progreso del fondeo */}
                {totalAmount > 0 && (
                  <div className="fund-progress">
                    <div className="fund-progress-labels">
                      <span>Fondeado: <strong>{currentBalance} {escrow.trustline?.symbol ?? 'USDC'}</strong></span>
                      <span>Requerido: <strong>{totalAmount} {escrow.trustline?.symbol ?? 'USDC'}</strong></span>
                    </div>
                    <div className="fund-progress-bar">
                      <div
                        className="fund-progress-fill"
                        style={{ width: `${Math.min(100, (currentBalance / totalAmount) * 100)}%` }}
                      />
                    </div>
                    {currentBalance > 0 && remaining > 0 && (
                      <p className="fund-remaining-hint">
                        Faltan <strong>{remaining} {escrow.trustline?.symbol ?? 'USDC'}</strong> para completar el fondeo.
                      </p>
                    )}
                  </div>
                )}

                <div className="fund-row">
                  <div className="fund-input-wrap">
                    <input
                      type="number"
                      className="fund-input"
                      value={fundAmount}
                      onChange={e => setFundAmount(e.target.value)}
                      min="0.01"
                      max={remaining || undefined}
                      step="0.01"
                      placeholder="Monto USDC"
                    />
                    <span className="fund-sym">{escrow.trustline?.symbol ?? 'USDC'}</span>
                  </div>
                  <button
                    className="btn-action-fund"
                    onClick={handleFund}
                    disabled={loading || !fundAmount || Number(fundAmount) <= 0}
                  >
                    {loading ? <><span className="spinner" /> Firmando…</> : 'Fondear'}
                  </button>
                </div>

                {/* Advertencia si el monto ingresado no completa el total */}
                {Number(fundAmount) > 0 && Number(fundAmount) < remaining && (
                  <p className="fund-partial-warn">
                    Con este monto el escrow quedará parcialmente fondeado. El siguiente paso se habilitará cuando se alcancen los <strong>{totalAmount} {escrow.trustline?.symbol ?? 'USDC'}</strong> requeridos.
                  </p>
                )}
              </div>
            )}

            {/* Paso 2: Aprobar hito */}
            {actions.includes('approve') && (
              <div className="action-block">
                <div className="action-step-header">
                  <span className="action-step-num">2</span>
                  <span className="detail-section-label">Aprobar Hito</span>
                </div>
                <p className="action-warn">
                  Confirma que el vendedor cumplió con lo acordado antes de liberar el pago.
                </p>
                <button
                  className="btn-action-approve"
                  onClick={handleApprove}
                  disabled={loading}
                >
                  {loading ? <><span className="spinner" /> Firmando…</> : 'Aprobar Hito ✓'}
                </button>
              </div>
            )}

            {/* Paso 3: Liberar fondos */}
            {actions.includes('release') && (
              <div className="action-block">
                <div className="action-step-header">
                  <span className="action-step-num">3</span>
                  <span className="detail-section-label">Liberar Fondos</span>
                </div>
                <p className="action-warn">
                  Transfiere los fondos al vendedor. Acción irreversible.
                </p>
                <button
                  className="btn-action-release"
                  onClick={handleRelease}
                  disabled={loading}
                >
                  {loading ? <><span className="spinner" /> Firmando…</> : 'Liberar Fondos →'}
                </button>
              </div>
            )}

          </div>
        )}

        {/* ── Confirmación ── */}
        {actionDone && (
          <div className="action-success">
            <span className="action-success-icon">✓</span>
            {actionLabels[actionDone]}
          </div>
        )}

        {/* ── Error ── */}
        {error && <div className="modal-error">{error}</div>}

      </div>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
