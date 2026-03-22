import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TrustlessWorkProvider } from './provider/TrustlessWorkProvider'
import { AcceslyProvider } from 'accesly'
import { WalletProvider } from './context/WalletContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TrustlessWorkProvider>
      <AcceslyProvider
        appId={import.meta.env.VITE_ACCESLY_APP_ID}
        network="testnet"
        theme="dark"
      >
        {/* WalletProvider debe estar dentro de AcceslyProvider para usar useAccesly */}
        <WalletProvider>
          <App />
        </WalletProvider>
      </AcceslyProvider>
    </TrustlessWorkProvider>
  </StrictMode>,
)
