# Méthodologie — Good Maps

**Atelier : Création de Good Maps avec l'IA Générative**  
**Cours : Coder avec l'IA Générative — EPSI**

---

## Outils IA utilisés

### Claude Code — Anthropic

**Rôle :** Assistant principal de développement, utilisé tout au long du projet pour la génération de code, le débogage et les décisions d'architecture.

**Interactions clés :**

| Phase | Usage de l'IA |
|---|---|
| Architecture | Choix du framework, structure des dossiers, définition des interfaces TypeScript |
| Développement | Génération des composants React, logique métier, intégration Leaflet |
| Débogage | Résolution des erreurs SSR, synchronisation async Leaflet/React |
| API & données | Migration Overpass → Nominatim, parsing des tags OSM d'accessibilité |
| Documentation | Rédaction du README, de ce fichier et des commentaires critiques |

---

## Préprompt principal

Le préprompt ci-dessous a servi de base à l'ensemble du projet. Il a été conçu pour cadrer précisément le contexte, les contraintes techniques et les exigences fonctionnelles, afin d'orienter l'IA vers une solution cohérente dès le départ.

```
Tu es un développeur web expert spécialisé en accessibilité numérique.

Je dois créer une application web mobile-first appelée "Good Maps", 
destinée aux personnes en situation de handicap. L'objectif est de leur 
permettre de trouver facilement des lieux accessibles adaptés à leurs 
besoins, géolocalisés sur une carte interactive.

Contraintes et exigences :

  STACK :
  - Framework : Next.js 14 avec App Router et TypeScript
  - Style : Tailwind CSS, design mobile-first (max 430px)
  - Carte : Leaflet + tuiles OpenStreetMap (gratuit, sans clé API)
  - Données POI : API publique OpenStreetMap (Nominatim / Overpass)
  - Aucune dépendance à Google Maps ou à une API payante

  FONCTIONNALITÉS :
  - Écran splash animé avec le logo Good Maps
  - Formulaire de profil : prénom (optionnel), ville, besoins d'accessibilité
    (fauteuil roulant, malvoyant, malentendant, cognitif, mobilité réduite, 
    toilettes adaptées) — plusieurs besoins sélectionnables
  - Carte interactive avec marqueurs colorés selon le niveau d'accessibilité
    réel du lieu par rapport aux besoins déclarés
  - Filtres par catégorie (restaurant, musée, pharmacie, hôtel, etc.)
  - Fiche détail d'un lieu avec badges d'accessibilité contextuels,
    horaires, téléphone, site web
  - Recherche par ville ou géolocalisation
  - Bouton retour vers le profil avec persistance des données saisies

  DESIGN :
  - Couleur principale : #E8554A (rouge-orange)
  - Marqueurs : vert = accessible, orange = partiel, gris = non accessible,
    rouge = données manquantes
  - Badges "non renseigné" affichés en orange (pas en gris neutre)

  MÉTHODOLOGIE :
  - Construire fonctionnalité par fonctionnalité, ne pas tout générer d'un coup
  - Chaque composant doit être dans son propre fichier
  - Code TypeScript strict, pas de any non justifié
  - Sécurité : sanitiser les inputs utilisateur, rel="noopener noreferrer" 
    sur tous les liens externes
```

---

## Processus de développement itératif

Le développement a suivi une boucle courte de type **prompt → génération → test → ajustement**, permettant de valider chaque brique avant d'en construire une nouvelle.

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│   Prompt    │────▶│  Code généré     │────▶│  Test navigateur│
│  (humain)   │     │  par l'IA        │     │  (comportement) │
└─────────────┘     └──────────────────┘     └───────┬────────┘
       ▲                                             │
       └──────────── Prompt de correction ◀──────────┘
                     (si bug ou ajustement)
```

### Étapes de construction

1. **Analyse de la maquette** — Identification des 3 écrans (splash, profil, carte) et des composants nécessaires
2. **Scaffolding** — Création du projet Next.js, configuration Tailwind et TypeScript
3. **Composants UI** — `SplashScreen`, `GoodMapsLogo` (SVG), `ProfileForm` avec sélection multiple
4. **Intégration carte** — `MapView` avec Leaflet chargé dynamiquement (`ssr: false`) pour éviter les erreurs d'hydratation
5. **Données d'accessibilité** — Connexion à l'API OSM, parsing des tags (`wheelchair`, `hearing_loop`, etc.)
6. **Logique de couleur** — Calcul du niveau d'accessibilité par rapport aux besoins déclarés
7. **Fiche détail** — `PlaceDetail` avec badges contextuels par type de besoin
8. **Navigation** — Bouton retour avec persistance du formulaire (`initialProfile` prop)
9. **Déploiement** — Push sur GitHub (compte `xzeoflo`)
10. **Documentation** — README complet + fichier méthodologie

---

## Prompts d'ajustement significatifs

Au-delà du préprompt initial, plusieurs itérations ont affiné le comportement de l'application :

**Gestion de la ville dans les suggestions**
> "Le bouton 'Obtenir des suggestions' doit prioriser la ville saisie dans la barre de recherche, sinon utiliser la ville du profil, sinon la géolocalisation, sinon Paris en fallback."

**Cohérence des couleurs d'accessibilité**
> "Les marqueurs doivent refléter l'accessibilité réelle selon les besoins sélectionnés, pas uniquement le tag `wheelchair`. Si plusieurs besoins sont sélectionnés, calculer un ratio satisfait/total pour choisir la couleur."

**Clarté des données manquantes**
> "Quand une information d'accessibilité n'est pas renseignée dans OSM, l'afficher en orange dans la fiche lieu — pas en vert ou en gris neutre — pour que l'utilisateur sache qu'il doit vérifier avant de se déplacer."

---

## Décisions techniques justifiées

### Nominatim plutôt qu'Overpass
L'API Overpass retournait des erreurs 406 et des timeouts répétés sur plusieurs serveurs miroirs. Nominatim, l'API de recherche officielle d'OpenStreetMap, offre une syntaxe plus simple et des résultats plus stables pour la recherche de POI par catégorie dans une zone géographique bornée (viewbox).

### `reactStrictMode: false`
En mode strict React, les effets `useEffect` sont exécutés deux fois en développement. Leaflet ne supporte pas d'être initialisé deux fois sur le même élément DOM (`_leaflet_id` déjà présent). La désactivation du strict mode est la solution recommandée pour Leaflet dans un environnement Next.js.

### `isMapReady` — synchronisation asynchrone
Leaflet s'initialise via un import dynamique asynchrone. Sans ce flag, si les données des lieux arrivaient avant la fin de l'initialisation, `mapRef.current` était `null` et les marqueurs étaient silencieusement perdus. Le state `isMapReady` permet de déclencher le rendu des marqueurs uniquement quand les deux conditions sont réunies : données disponibles **et** carte initialisée.

### `dynamic(() => import(...), { ssr: false })`
Leaflet utilise `window` et `document`, qui n'existent pas lors du rendu serveur de Next.js. Le chargement dynamique côté client uniquement supprime les erreurs d'hydratation et les crashes au build.

---

## Limites identifiées

- **Données OSM incomplètes** — Les tags d'accessibilité (`wheelchair`, `tactile_paving`, `hearing_loop`) sont peu renseignés hors des grandes métropoles. L'application affiche "non renseigné" dans ces cas plutôt que d'inventer une information.
- **Rate limiting Nominatim** — L'API publique est limitée à 1 requête/seconde. Suffisant pour un usage individuel, à considérer pour un déploiement à grande échelle (cache ou instance privée).
- **Pas de persistance** — Les préférences utilisateur ne sont pas sauvegardées entre sessions (pas de backend ni de localStorage). Évolution possible pour une v2.

---

## Compétences mises en œuvre

- Rédaction de préprompts structurés et précis pour cadrer la génération de code
- Dialogue itératif avec l'IA : identification des écarts entre attendu et résultat, formulation de corrections ciblées
- Validation humaine à chaque étape (tests navigateur, lecture du code généré)
- Compréhension des contraintes techniques spécifiques (SSR, async, bibliothèques tierces) pour guider l'IA efficacement
- Architecture front-end maintenable indépendante de l'outil de génération
