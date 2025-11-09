# 🌐 FRW - Free Web Modern

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Alpha](https://img.shields.io/badge/Status-Alpha-orange.svg)]()

Decentralized web protocol - Liberté, sécurité, créativité

## Vision

**FRW (Free Web)** est un protocole web alternatif décentralisé inspiré de l'esprit du WWW des années 90-2000:

- Liberté totale sans contrôle des grandes entreprises tech
- Sécurité via chiffrement et signatures cryptographiques
- Décentralisation complète basée sur IPFS/libp2p
- Créativité avec pages personnelles, guestbooks, webrings
- Communauté avec découverte humaine sans algorithmes

## Caractéristiques

### Design moderne, philosophie rétro
- Pages HTML/CSS/JS standards servies en P2P
- Design moderne et responsive
- Interactions riches mais sécurisées (sandbox JS)

### Sécurité intégrée
- Signatures Ed25519 pour authentifier tout contenu
- Sandbox JavaScript pour exécution sécurisée
- Pas de tracking, cookies tiers, ou publicité

### Décentralisation complète
- Protocole `frw://` basé sur IPFS
- Hébergement distribué par les utilisateurs
- Réplication automatique P2P
- Découverte via webrings et annuaires

### Identité cryptographique
- Clé publique = identité utilisateur
- Pas de comptes centralisés
- Signature de tout contenu publié

## Installation

```bash
git clone https://github.com/your-org/frw-free-web-modern.git
cd frw-free-web-modern

# Installer toutes les dépendances
npm install

# Build tous les packages
npm run bootstrap

# Lancer le client
npm run dev

# Lancer le CLI
npm run dev:cli
```

## Quick Start

1. **Créer une page** (`index.frw`):
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ma Page FRW</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@your-public-key">
  <meta name="frw-date" content="2025-11-08T00:00:00Z">
</head>
<body>
  <h1>Hello FRW!</h1>
</body>
</html>
```

2. **Publier**:
```bash
npm run frw publish
```

3. **Naviguer**: `frw://your-public-key/index.frw`

## Documentation

- [📘 Spécification](./docs/SPECIFICATION.md) - Protocole FRW v1.0
- [🏗️ Architecture](./docs/ARCHITECTURE.md) - Structure système
- [🛣️ Roadmap](./docs/ROADMAP.md) - Phases développement
- [🔐 Sécurité](./docs/SECURITY.md) - Modèle sécurité
- [👨‍💻 Guide Développeur](./docs/DEVELOPER_GUIDE.md) - API référence
- [📚 Guide Utilisateur](./docs/USER_GUIDE.md) - Manuel utilisateur
- [⚡ Quick Start](./docs/QUICKSTART.md) - Setup 5 minutes

## Architecture Monorepo

```
frw-free-web-modern/
├── packages/              # Librairies core (publishables npm)
│   ├── common/           # @frw/common - Utilitaires partagés
│   ├── crypto/           # @frw/crypto - Signatures Ed25519
│   ├── ipfs/             # @frw/ipfs - Intégration IPFS
│   ├── protocol/         # @frw/protocol - Résolution URLs
│   ├── sandbox/          # @frw/sandbox - Exécution JS sécurisée
│   └── storage/          # @frw/storage - Cache et BDD locale
├── apps/                 # Applications
│   ├── client/          # Browser desktop (Electron)
│   └── cli/             # Outil ligne de commande
└── docs/                # Documentation complète
```

## Flux de Données

```
[Auteur] → crée/signe → [IPFS] → distribue → [Client FRW]
                           ↓                      ↓
                    [Autres nœuds]          [Utilisateur]
```

## Stack Technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Réseau | IPFS (libp2p) | Transport P2P |
| Découverte | IPNS/OrbitDB | Résolution noms |
| Contenu | HTML/CSS/JS | Pages interactives |
| Auth | Ed25519 | Signatures |
| Client | Electron | Browser desktop |
| Stockage | SQLite | Cache local |
| Tests | Jest | Tests auto |
| CI/CD | GitHub Actions | Build/deploy |

## Exemple

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Hello FRW</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@key">
  <meta name="frw-date" content="2025-11-08T00:00:00Z">
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; }
  </style>
</head>
<body>
  <h1>Bienvenue sur le Free Web!</h1>
  <p>Page décentralisée, sécurisée, libre.</p>
  <a href="frw://autre-cle/page.frw">Visiter site voisin</a>
  <script src="frw://key/script.frw.js"></script>
</body>
</html>
```

## Roadmap

| Phase | Statut | Description |
|-------|--------|-------------|
| Phase 0 | ✅ | Benchmark & inspirations |
| Phase 1 | ✅ | Spécification FRW v1.0 |
| Phase 2 | 📋 | Prototype CLI & Client |
| Phase 3 | 📋 | Alpha réseau P2P |
| Phase 4 | 📋 | Beta publique |
| Phase 5 | 📋 | Version stable |

## Contribuer

Contributions bienvenues! Voir [CONTRIBUTING.md](./CONTRIBUTING.md)

1. Fork le projet
2. Créer branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers branche (`git push origin feature/AmazingFeature`)
5. Ouvrir Pull Request

## Manifeste FRW

1. **Liberté** - Contrôle utilisateur du contenu et identité
2. **Décentralisation** - Pas d'autorité centrale
3. **Transparence** - Code open source, protocoles documentés
4. **Confidentialité** - Pas de tracking, pas de collecte données
5. **Simplicité** - Facile à utiliser et comprendre
6. **Créativité** - Encourager expression personnelle
7. **Communauté** - Découverte humaine, pas d'algorithmes

## Licence

MIT License - Voir [LICENSE](./LICENSE)

## Communauté

Fait avec passion par la communauté FRW

---

**Projet initié:** 8 Novembre 2025  
**Statut:** Phase 1 Complète - Prêt pour Phase 2
