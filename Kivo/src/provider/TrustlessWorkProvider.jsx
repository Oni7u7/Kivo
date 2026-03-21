import { TrustlessWorkConfig, development} from '@trustless-work/escrow'

/**
 * Envuelve la app con el proveedor del SDK de Trustless Work.
 * Usa VITE_TRUSTLESS_API_KEY del archivo .env
 * baseURL apunta a testnet (development). Cambia a `mainNet` para producción.
 */
export function TrustlessWorkProvider({ children }) {
  const apiKey = import.meta.env.VITE_TRUSTLESS_API_KEY || ''

  return (
    <TrustlessWorkConfig baseURL={development} apiKey={apiKey}>
      {children}
    </TrustlessWorkConfig>
  )
}
