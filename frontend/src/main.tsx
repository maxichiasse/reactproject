//frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from "@contexts/AuthContext";
import { OrgsProvider } from "@contexts/OrgsContext";
import { ToastProvider} from "@contexts/ToastContext.tsx";
import '@styles/main.scss';
import App from './App'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Router>
            <ToastProvider>
                <AuthProvider>
                    <OrgsProvider>
                        <App />
                    </OrgsProvider>
                </AuthProvider>
            </ToastProvider>
        </Router>
    </StrictMode>,
)