import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'

const IS_DEV = import.meta.env.DEV

export function OnrampForm({ onSubmit, loading, error }) {
  const [amount, setAmount] = useState('')
  const { t } = useLanguage()
  const r = t.ramp

  function handleSubmit(e) {
    e.preventDefault()
    const n = parseFloat(amount)
    if (!n || n <= 0) return
    onSubmit(n)
  }

  const mxnNum = parseFloat(amount) || 0

  return (
    <form className="ramp-body" onSubmit={handleSubmit}>

      <div className="ramp-field">
        <label className="ramp-label">{r.depositLabel}</label>
        <div className="ramp-input-wrap">
          <input
            className="ramp-input"
            type="number"
            min="1"
            step="0.01"
            placeholder="500.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={loading}
            required
          />
          <span className="ramp-input-badge">MXN</span>
        </div>
      </div>

      {IS_DEV && mxnNum > 0 && (
        <div className="ramp-note">{r.sandboxNote}</div>
      )}

      {!IS_DEV && mxnNum > 0 && (
        <div className="ramp-note">{r.clabeNote}</div>
      )}

      {error && <div className="ramp-error">{error}</div>}

      <button
        type="submit"
        className="ramp-btn-primary"
        disabled={loading || !amount || parseFloat(amount) <= 0}
      >
        {loading
          ? <><span className="ramp-spinner" /> {r.processing}</>
          : r.buyBtn
        }
      </button>
    </form>
  )
}
