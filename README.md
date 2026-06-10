# Good Maps 🗺️

Application web mobile-first permettant aux personnes en situation de handicap de trouver des lieux accessibles autour d'elles, avec filtrage par type de besoin et visualisation cartographique.

---

## Présentation du projet

Good Maps répond à une problématique concrète : les personnes en situation de handicap manquent d'un outil simple pour identifier les lieux accessibles à leurs besoins spécifiques (fauteuil roulant, malvoyant, malentendant, etc.).

L'application permet de :
- Renseigner son profil d'accessibilité (type(s) de handicap)
- Visualiser sur une carte les lieux proches filtrés par catégorie
- Obtenir pour chaque lieu un statut d'accessibilité détaillé (PMR, boucle magnétique, guidage sonore, etc.)
- Chercher par ville ou laisser la géolocalisation agir

---

## Stack technique

| Technologie | Rôle |
|---|---|
| **Next.js 14** (App Router) | Framework React avec routing et SSR |
| **TypeScript** | Typage statique pour la fiabilité du code |
| **Tailwind CSS** | Stylisation utilitaire responsive |
| **Leaflet + OpenStreetMap** | Carte interactive, 100% gratuite, sans clé API |
| **Nominatim API** | Géocodage et recherche de points d'intérêt (OSM) |

> Aucune clé API requise. Toutes les données cartographiques sont issues d'OpenStreetMap (licence ODbL).

---

## Architecture du projet

```
goodmaps/
├── app/
│   ├── components/
│   │   ├── GoodMapsLogo.tsx    # Logo SVG réutilisable (3 tailles)
│   │   ├── SplashScreen.tsx    # Écran de démarrage (2,5 s)
│   │   ├── ProfileForm.tsx     # Formulaire de profil utilisateur
│   │   ├── MapView.tsx         # Carte Leaflet + recherche + marqueurs
│   │   └── PlaceDetail.tsx     # Fiche détail d'un lieu
│   ├── lib/
│   │   └── overpass.ts         # Appels Nominatim + parsing + catégories
│   ├── types.ts                # Interfaces TypeScript partagées
│   ├── page.tsx                # Orchestration des 3 écrans (splash/profil/carte)
│   ├── layout.tsx              # Layout racine Next.js
│   └── globals.css             # Variables CSS globales + Tailwind
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### Flux de navigation

```
SplashScreen (2,5s auto) → ProfileForm (besoins + ville) → MapView (carte)
                                ↑                                  |
                                └──────────── onBack ──────────────┘
```

---

## Fonctionnalités

### Profil utilisateur
- Prénom optionnel
- Ville de départ (optionnel — fallback géolocalisation → Paris)
- Sélection multiple de besoins : fauteuil roulant, malvoyant, malentendant, handicap cognitif, mobilité réduite, toilettes adaptées

### Carte interactive
- Marqueurs colorés selon l'accessibilité du lieu par rapport aux besoins déclarés :
  - **Vert** : tous les critères satisfaits
  - **Orange** : partiellement accessible
  - **Gris** : non accessible
  - **Rouge** : données manquantes
- 12 catégories filtrables : Tout, Restos, Cafés, Bars, Hôtels, Musées, Cinémas, Théâtres, Pharmacies, Toilettes, Supermarchés, Hôpitaux
- Recherche par ville/adresse
- Bouton "Obtenir des suggestions" (géolocalisation ou ville du profil)

### Fiche lieu
- Badges d'accessibilité contextuels selon les besoins sélectionnés
- Horaires, numéro de téléphone, site web
- Lien OpenStreetMap pour itinéraire
- Mention des données manquantes en orange (non renseigné)

---

## Installation et lancement

### Prérequis
- Node.js ≥ 18.16
- npm

### Étapes

```bash
# Cloner le dépôt
git clone https://github.com/xzeoflo/good-maps.git
cd good-maps

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans un navigateur.

### Build de production

```bash
npm run build
npm start
```

---

## Sécurité

- **Aucune clé API** : Nominatim est public, aucun secret à protéger
- **Pas de base de données** : l'application est stateless, pas de fuite de données utilisateur
- **Sanitisation des entrées** : toutes les saisies utilisateur passent par `encodeURIComponent` avant les appels fetch
- **Liens externes sécurisés** : `rel="noopener noreferrer"` sur tous les `<a target="_blank">`
- **Pas d'injection HTML** : les variables injectées dans les SVG Leaflet proviennent uniquement du code interne (couleurs calculées), jamais de l'utilisateur

---

## Structure et maintenabilité

- **Séparation claire des responsabilités** : lib (API), components (UI), types (interfaces)
- **TypeScript strict** : toutes les props et données API sont typées
- **Ajout de catégorie** : modifier uniquement le tableau `CATEGORIES` dans `app/lib/overpass.ts`
- **Ajout d'un besoin** : ajouter l'option dans `ProfileForm.tsx`, la logique badge dans `PlaceDetail.tsx` et le score dans `MapView.tsx`
- **Zéro dépendance propriétaire** : Next.js, Tailwind, Leaflet — toutes open-source

---

## Données OpenStreetMap

Les données d'accessibilité (tags `wheelchair`, `tactile_paving`, `hearing_loop`, etc.) proviennent des contributions OpenStreetMap. La qualité varie selon les villes et les contributeurs.

> Pensez à contribuer à OpenStreetMap pour améliorer les données d'accessibilité de votre ville !

---

## Licence

Projet réalisé dans le cadre du cours **"Coder avec l'IA Générative"** à l'EPSI.  
Données cartographiques : © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL).
