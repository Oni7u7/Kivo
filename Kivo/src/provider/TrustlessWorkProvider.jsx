import { TrustlessWorkConfig, development, mainNet } from '@trustless-work/escrow'
import { useNetwork } from '../context/NetworkContext'

/**
 * Envuelve la app con el proveedor del SDK de Trustless Work.
 * Usa VITE_TRUSTLESS_API_KEY (testnet) o VITE_TRUSTLESS_API_KEY_MAINNET según la red activa.
 */
export function TrustlessWorkProvider({ children }) {
  const { network } = useNetwork()

  const apiKey = network === 'mainnet'
    ? import.meta.env.VITE_TRUSTLESS_API_KEY_MAINNET || ''
    : import.meta.env.VITE_TRUSTLESS_API_KEY || ''

  const baseURL = network === 'mainnet' ? mainNet : development

  return (
    <TrustlessWorkConfig baseURL={baseURL} apiKey={apiKey}>
      {children}
    </TrustlessWorkConfig>
  )
}
