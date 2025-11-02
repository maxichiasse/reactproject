## 🔐 Configuration pour les profs (authentification GitHub)

Pour que les profs puissent se connecter à l'application, chaque professeur doit fournir un **token GitHub personnel** (_Personal Access Token_).

### 🎯 Scopes à cocher

Lorsque vous créez un token GitHub (classic), cochez uniquement **ces 3 scopes** :

- `read:user` → pour lire votre nom, login et avatar
- `user:email`
- `read:org`
- `write:org` → pour gérer les organisations
- `repo` → pour créer les projets dans les repositories de vos organisations
- `delete_repo`

🛠️ Le token peut avoir une **expiration de 90 jours** (recommandé pour la sécurité).

---

### 🔑 Exemple d'ajout d'un prof

Une fois que le prof vous transmet son token, ajoutez-le en base avec la commande suivante :

```bash
   npm run add-prof ghp_Token
```

Ajouter plus tard comment lancer le serveur et le front
(1 ou 2 commandes?)