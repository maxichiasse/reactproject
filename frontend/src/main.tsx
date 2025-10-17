//frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from "@contexts/AuthContext";
import '@styles/styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Router>
          <AuthProvider>
              <App />
          </AuthProvider>
      </Router>
  </StrictMode>,
)
