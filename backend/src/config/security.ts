//backend/src/config/security.ts
import helmet from "helmet";
import { Express } from "express";

/**
 * 🔒 Configure Helmet avec une CSP personnalisée :
 *  - Autorise les images GitHub (avatars, logos d'organisations)
 *  - Garde une sécurité forte pour les autres ressources
 */
export function configureSecurity(app: Express) {
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: [
                        "'self'",
                        "data:",
                        "https://avatars.githubusercontent.com",
                        "https://github.com",
                    ],
                    connectSrc: [
                        "'self'",
                        "https://api.github.com",
                        "https://avatars.githubusercontent.com",
                    ],
                    fontSrc: ["'self'", "https:", "data:"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            },
            crossOriginResourcePolicy: { policy: "cross-origin" },
        })
    );
}
