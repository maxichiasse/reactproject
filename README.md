## 🔐 Configuration pour les profs (authentification GitHub)

Pour que les profs puissent se connecter à l'application, chaque professeur doit fournir un **token GitHub personnel** (_Personal Access Token_).

### 🎯 Scopes à cocher

Lorsque vous créez un token GitHub (classic), cochez uniquement **ces 3 scopes** :

- `read:user` → pour lire votre nom, login et avatar
- `user:email` → pour accéder à l'adresse mail publique
- `read:org` → pour lire les informations sur vos organisations
- `write:org` → pour gérer les organisations
- `repo` → pour créer les projets dans les repositories de vos organisations
- `delete_repo` → pour supprimer des repositories

🛠️ Le token peut avoir une **expiration de 90 jours** (recommandé pour la sécurité).

Expliquer comment renouveler le token

---

### 🔑 Ajouter un prof

Une fois que le prof vous transmet son token, ajoutez-le en base avec la commande suivante :

```bash
   cd backend
   npm run add-prof ghp_Token
```
---

### Démarrer le projet
En Production 

https://githelper.up.railway.app

En Développement

```bash
   cd backend
   npm run dev
```

```bash
   cd frontend
   npm run dev
```