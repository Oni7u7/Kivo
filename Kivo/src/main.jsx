import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TrustlessWorkProvider } from './provider/TrustlessWorkProvider'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TrustlessWorkProvider>
      <App />
    </TrustlessWorkProvider>
  </StrictMode>,
)
