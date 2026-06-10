# Méthodologie — Good Maps

Atelier : Création de Good Maps avec l'IA Générative  
Cours : Coder avec l'IA Générative — EPSI

---

## Outils IA utilisés

### Claude (Anthropic) — via Claude Code
Outil principal de génération et de correction de code.

**Usages concrets dans ce projet :**
- Génération de l'architecture Next.js App Router complète
- Création des composants React/TypeScript (ProfileForm, MapView, PlaceDetail, etc.)
- Débogage des erreurs Leaflet (double initialisation, SSR)
- Migration de l'API Overpass vers Nominatim suite aux erreurs 406/timeout
- Calcul de la logique d'accessibilité multi-besoins (markerColor, getAccessibilityBadges)
- Rédaction de la documentation (README, METHODOLOGY)

---

## Préprompts utilisés

### Préprompt d'initialisation du projet

> "En Next.js ou React ce qui est le mieux, fais moi ce projet : une application de carte accessible pour personnes en situation de handicap. L'utilisateur saisit son type de handicap, la carte affiche des lieux adaptés (accès fauteuil, toilettes adaptées, rampes, etc.). API de carte gratuite, pas Google Maps. Ne fais pas tout d'un coup, fait un par un."

**Décision IA** : Next.js 14 avec App Router a été recommandé plutôt que React seul, pour bénéficier des routes API et du SSR — plus adapté à un projet structuré et maintenable.

---

### Préprompts de correction et d'amélioration (itérations)

| Problème rencontré | Prompt utilisé |
|---|---|
| Page blanche après lancement | `"j'ai une page vide avec que sa GOOD MAPS / Suggestions d'activités adaptées"` |
| Erreur de connexion | `"Failed to Load Page ERR_CONNECTION_REFUSED (-102)"` |
| API Overpass en timeout | `"une erreur quand je met restos a lille, soit il manque des chose dans l'api de map et elle ne fait que paris soit il y a une erreur qq part"` |
| Carte ne changeait pas de ville | `"fais que le obtenir des suggestion si il y a une ville que ce soit celle qu'on met au debut ou dans la barre de recherche"` |
| Marqueurs tous verts (accessibilité incorrecte) | `"nn je veux dire quand c nn renseigne met le point en orange si il manque une partie ou gris si il manque les 2 comment ca se fait qu'il soit vert"` |
| Badges non renseignés en mauvaise couleur | `"si il y en a un en nn renseigne ne met pas en vert mais en orange"` |
| Bouton retour → retour au formulaire avec ville pré-remplie | `"maintenant le bouton en haut a gauche change le pour qu'il permette de revenir en arriere et de mettre en place la ville dans les demandes au debut"` |

---

## Processus de développement

### Méthode itérative (prompt → test → correction)

Le développement a suivi une boucle courte :

```
Prompt → Code généré → Test dans le navigateur → Bug identifié → Prompt de correction → ...
```

Chaque fonctionnalité a été construite et testée avant de passer à la suivante, conformément à la consigne ("ne fais pas tout d'un coup").

### Étapes chronologiques

1. **Maquette** — Analyse du Figma/Canva fourni pour définir les écrans (splash, profil, carte)
2. **Structure** — Création du projet Next.js + Tailwind + TypeScript
3. **Composants visuels** — SplashScreen, GoodMapsLogo, ProfileForm
4. **Intégration carte** — MapView avec Leaflet + OSM (gestion SSR avec `dynamic()`)
5. **API données** — Intégration Overpass puis migration vers Nominatim (plus fiable)
6. **Logique accessibilité** — Calcul de couleur des marqueurs selon les besoins
7. **Fiche détail** — PlaceDetail avec badges par type de besoin
8. **Navigation** — Bouton retour avec persistance du profil
9. **GitHub** — Push sur le compte personnel `xzeoflo`
10. **Documentation** — README + METHODOLOGY

---

## Décisions techniques prises avec l'IA

### Pourquoi Nominatim et pas Overpass ?
Overpass API retournait des erreurs 406 (Not Acceptable) et des timeouts sur plusieurs serveurs miroirs. Nominatim, l'API de recherche officielle d'OpenStreetMap, s'est révélée plus stable et suffisante pour la recherche de POI par catégorie dans une zone géographique.

### Pourquoi `reactStrictMode: false` ?
En mode strict React, les effets `useEffect` sont montés deux fois en développement. Leaflet initialise une carte dans un `<div>` et ne tolère pas d'être initialisé deux fois sur le même élément. Désactiver le strict mode est la solution recommandée pour Leaflet en Next.js.

### Pourquoi `isMapReady` state ?
Leaflet s'initialise de façon asynchrone (import dynamique). Si les données des lieux arrivaient avant la fin de l'initialisation, les marqueurs étaient perdus car `mapRef.current` était `null`. Le flag `isMapReady` synchronise les deux processus asynchrones.

### Pourquoi `dynamic(() => import(...), { ssr: false })` ?
Leaflet utilise `window` et `document` qui n'existent pas côté serveur (SSR). Le chargement dynamique côté client uniquement évite les erreurs d'hydratation Next.js.

---

## Limites identifiées

- Les données d'accessibilité OSM sont incomplètes selon les villes (peu de tags `wheelchair`, `hearing_loop`, etc. en dehors des grandes métropoles)
- Nominatim a une limite de requêtes (1 req/s) — pas de problème en usage individuel, mais à prévoir pour un déploiement à grande échelle
- L'application n'a pas de backend persistant : les préférences utilisateur ne sont pas sauvegardées entre sessions

---

## Compétences démontrées

- Prompting itératif et précis pour la génération de code
- Capacité à identifier et corriger les erreurs retournées par l'IA
- Intégration de bibliothèques tiers (Leaflet) dans un contexte Next.js/SSR
- Architecture front-end structurée et maintenable
- Documentation technique complète
