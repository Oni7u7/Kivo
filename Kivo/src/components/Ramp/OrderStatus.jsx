import { useLanguage } from '../../context/LanguageContext'

export function OrderStatus({ status, order, quote, onReset }) {
  const { t } = useLanguage()
  const r = t.ramp

  const isOnramp = !!order?.depositClabe

  const steps = isOnramp
    ? r.stepsOnramp.map((label, i) => ({ label, key: ['quote','payment','process','done'][i] }))
    : r.stepsOfframp.map((label, i) => ({ label, key: ['quote','payment','process','done'][i] }))

  function stepState(key) {
    if (status === 'error') return 'pending'
    switch (key) {
      case 'quote':   return 'done'
      case 'payment': return status === 'awaiting_payment' ? 'active' : 'done'
      case 'process':
        if (status === 'processing') return 'active'
        if (status === 'completed')  return 'done'
        return 'pending'
      case 'done':    return status === 'completed' ? 'done' : 'pending'
      default:        return 'pending'
    }
  }

  const headerKey = status === 'completed'
    ? (isOnramp ? 'completed_onramp' : 'completed_offramp')
    : status
  const h = r.statusHeaders[headerKey] ?? { icon: '⏳', title: 'Processing…', sub: '' }

  function fmtMXN(n) {
    return n != null
      ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
      : '—'
  }
  function fmtUSDC(n) {
    return n != null ? `${Number(n).toFixed(2)} USDC` : '—'
  }

  const srcAmt = quote?.sourceAmount ?? order?.depositAmount ?? order?.sourceAmount
  const tgtAmt = quote?.destinationAmount ?? order?.destinationAmount ?? order?.targetAmount

  return (
    <div className="ramp-status-wrap">

      {/* Header */}
      <div className="ramp-status-header">
        <div className="ramp-status-icon">{h.icon}</div>
        <div className="ramp-status-title">{h.title}</div>
        {h.sub && <div className="ramp-status-sub">{h.sub}</div>}
      </div>

      {/* CLABE */}
      {isOnramp && status === 'awaiting_payment' && order.depositClabe && (
        <div className="ramp-clabe-card">
          <div className="ramp-clabe-label">{r.clabeDepositLabel}</div>
          <div className="ramp-clabe-value">{order.depositClabe}</div>
          <div className="ramp-clabe-sub">
            {r.clabeTransferNote.replace('{amount}', fmtMXN(srcAmt))}
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="ramp-steps">
        {steps.map(s => {
          const st = stepState(s.key)
          return (
            <div className="ramp-step" key={s.key}>
              <div className={`ramp-step-dot ${st}`}>
                {st === 'done' ? '✓' : st === 'active' ? '●' : '○'}
              </div>
              <span className={`ramp-step-text ${st}`}>{s.label}</span>
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      {(srcAmt != null || tgtAmt != null) && (
        <div className="ramp-summary">
          {isOnramp ? (
            <>
              <div className="ramp-quote-row">
                <span className="ramp-quote-label">{r.youSend}</span>
                <span className="ramp-quote-val">{fmtMXN(srcAmt)}</span>
              </div>
              <div className="ramp-quote-row">
                <span className="ramp-quote-label">{r.youReceive}</span>
                <span className="ramp-quote-val highlight">{fmtUSDC(tgtAmt)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="ramp-quote-row">
                <span className="ramp-quote-label">{r.youSend}</span>
                <span className="ramp-quote-val highlight">{fmtUSDC(srcAmt)}</span>
              </div>
              <div className="ramp-quote-row">
                <span className="ramp-quote-label">{r.youReceive}</span>
                <span className="ramp-quote-val">{fmtMXN(tgtAmt)}</span>
              </div>
            </>
          )}
          {order?.orderId && (
            <div className="ramp-quote-row">
              <span className="ramp-quote-label">Order ID</span>
              <span className="ramp-quote-val" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>
                {order.orderId}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Botones */}
      {status === 'completed' && (
        <button className="ramp-btn-primary" onClick={onReset}>
          {r.newOperation}
        </button>
      )}
      {status === 'error' && (
        <button className="ramp-btn-ghost" onClick={onReset}>
          {r.tryAgain}
        </button>
      )}
    </div>
  )
}
