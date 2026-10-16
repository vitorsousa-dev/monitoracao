import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ScopeProvider } from './contexts/ScopeContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LayoutProvider } from './contexts/LayoutContext'
import { loadLiveData } from './lib/liveData'
import App from './App'
import './index.css'

const LIVE_REFRESH_MS = 5 * 60 * 1000

// recarrega os dados ao vivo periodicamente; ao chegar dado novo, remonta as telas para recalcularem os indicadores
function LiveRoot() {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.visibilityState === 'visible' && (await loadLiveData())) setVersion((v) => v + 1)
    }, LIVE_REFRESH_MS)
    return () => clearInterval(id)
  }, [])
  return <App key={version} />
}

// carrega os dados ao vivo antes da primeira tela (até 5 s); sem resposta, abre com os dados estáticos
loadLiveData().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ScopeProvider>
            <ThemeProvider>
              <LayoutProvider>
                <LiveRoot />
              </LayoutProvider>
            </ThemeProvider>
          </ScopeProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  )
})
