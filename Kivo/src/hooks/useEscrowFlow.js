import { useState } from 'react'
import {
  useInitializeEscrow,
  useFundEscrow,
  useReleaseFunds,
  useSendTransaction,
} from '@trustless-work/escrow/hooks'
import { signTransaction } from '@stellar/freighter-api'

// Red testnet de Stellar
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

// USDC en testnet de Stellar
const USDC_TESTNET = {
  symbol: 'USDC',
  address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
}

// Dirección de la plataforma Kivo (recibe las comisiones)
const KIVO_PLATFORM_ADDRESS =
  import.meta.env.VITE_KIVO_PLATFORM_ADDRESS || ''

/**
 * Firma un XDR sin firmar usando Freighter y retorna el XDR firmado.
 */
async function signWithFreighter(unsignedXdr, walletAddress) {
  const result = await signTransaction(unsignedXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: walletAddress,
  })
  // freighter-api v6 retorna { signedTxXdr, signerAddress }
  return result.signedTxXdr
}

/**
 * Hook central de escrow para Kivo.
 *
 * Expone:
 *   - createEscrow(formData, walletAddress) → { contractId }
 *   - fundEscrow(contractId, amount, walletAddress) → void
 *   - releaseFunds(contractId, releaseSigner) → void
 *   - loading, error, result
 */
export function useEscrowFlow() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [result, setResult]   = useState(null)

  const { deployEscrow }   = useInitializeEscrow()
  const { fundEscrow: fund } = useFundEscrow()
  const { releaseFunds: release } = useReleaseFunds()
  const { sendTransaction } = useSendTransaction()

  /**
   * Crea un escrow de liberación única (single-release).
   *
   * @param {Object} formData
   * @param {string} formData.title
   * @param {string} formData.description
   * @param {string} formData.serviceProvider  - Dirección del vendedor
   * @param {string} formData.receiver         - Dirección receptora (default = serviceProvider)
   * @param {string} formData.disputeResolver  - Dirección del árbitro
   * @param {number} formData.amount           - Monto en USDC
   * @param {number} formData.platformFee      - Comisión de la plataforma (ej. 3)
   * @param {string} formData.milestoneDesc    - Descripción del único hito
   * @param {string} walletAddress             - Dirección del wallet conectado (cliente)
   *
   * @returns {{ contractId: string }}
   */
  async function createEscrow(formData, walletAddress) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // engagementId: ID único requerido por la API de TrustlessWork.
      // Usamos crypto.randomUUID() si está disponible (todos los navegadores modernos),
      // o un fallback de timestamp + random para compatibilidad.
      const engagementId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `kivo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      const payload = {
        signer: walletAddress,
        engagementId,
        title: formData.title,
        description: formData.description,
        amount: Number(formData.amount),
        platformFee: Number(formData.platformFee),
        roles: {
          approver: walletAddress,               // el cliente aprueba
          serviceProvider: formData.serviceProvider,
          platformAddress: KIVO_PLATFORM_ADDRESS || walletAddress,
          releaseSigner: walletAddress,          // el cliente libera los fondos
          disputeResolver: formData.disputeResolver,
          receiver: formData.receiver || formData.serviceProvider,
        },
        milestones: [
          { description: formData.milestoneDesc || formData.description },
        ],
        trustline: USDC_TESTNET,
      }

      // 1. Obtener XDR sin firmar
      const { unsignedTransaction, status } = await deployEscrow(payload, 'single-release')

      if (status === 'FAILED' || !unsignedTransaction) {
        throw new Error('El despliegue del escrow falló. Revisa tu API Key y conexión.')
      }

      // 2. Firmar con Freighter
      const signedXdr = await signWithFreighter(unsignedTransaction, walletAddress)

      // 3. Enviar a la red Stellar
      const txResult = await sendTransaction(signedXdr)

      const contractId = txResult?.contractId || txResult?.data?.contractId || null
      const outcome = { contractId, status: txResult?.status }

      setResult(outcome)
      return outcome
    } catch (err) {
      const msg = err?.message || 'Error desconocido al crear el escrow.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Financia un escrow existente con USDC.
   *
   * @param {string} contractId
   * @param {number} amount
   * @param {string} walletAddress - Quien firma (el cliente)
   */
  async function fundEscrow(contractId, amount, walletAddress) {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        contractId,
        amount: Number(amount),
        signer: walletAddress,
      }

      const { unsignedTransaction, status } = await fund(payload, 'single-release')

      if (status === 'FAILED' || !unsignedTransaction) {
        throw new Error('No se pudo financiar el escrow.')
      }

      const signedXdr = await signWithFreighter(unsignedTransaction, walletAddress)
      const txResult  = await sendTransaction(signedXdr)

      setResult({ funded: true, status: txResult?.status })
    } catch (err) {
      const msg = err?.message || 'Error al financiar el escrow.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Libera los fondos del escrow hacia el proveedor de servicios.
   *
   * @param {string} contractId
   * @param {string} releaseSigner - Quien firma la liberación (el cliente/approver)
   */
  async function releaseFunds(contractId, releaseSigner) {
    setLoading(true)
    setError(null)

    try {
      const payload = { contractId, releaseSigner }

      const { unsignedTransaction, status } = await release(payload, 'single-release')

      if (status === 'FAILED' || !unsignedTransaction) {
        throw new Error('No se pudo liberar los fondos.')
      }

      const signedXdr = await signWithFreighter(unsignedTransaction, releaseSigner)
      const txResult  = await sendTransaction(signedXdr)

      setResult({ released: true, status: txResult?.status })
    } catch (err) {
      const msg = err?.message || 'Error al liberar los fondos.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }

  return {
    createEscrow,
    fundEscrow,
    releaseFunds,
    loading,
    error,
    result,
  }
}
