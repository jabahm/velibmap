# Soumission « Réutilisation » sur data.gouv.fr

Ce document contient tout le contenu prêt à coller pour publier VélibMap comme **Réutilisation** sur [data.gouv.fr](https://www.data.gouv.fr/).

## 1. Étapes

1. Connecte-toi sur https://www.data.gouv.fr/ (compte requis).
2. Aller sur [https://www.data.gouv.fr/datasets/velib-velos-et-bornes-disponibilite-temps-reel/](https://www.data.gouv.fr/datasets/velib-velos-et-bornes-disponibilite-temps-reel/).
3. Clique sur **« Publier une réutilisation »** depuis la page du dataset (ou via le menu **Publier** → **Une réutilisation**).
4. Remplis le formulaire avec le contenu ci-dessous.
5. Upload la capture d'écran comme image principale.

## 2. Métadonnées à coller

### Type
**Application** *(ou « Visualisation » si Application n'est pas proposé)*

### Titre
```
VélibMap : disponibilité Vélib' Métropole en temps réel
```

### Description (markdown accepté)
````markdown
**VélibMap** est une carte web open source, sans clé d'API et sans tracker, qui visualise en temps réel la disponibilité des stations Vélib' Métropole : vélos mécaniques, vélos électriques et bornettes libres.

### Fonctionnalités

- **Carte temps réel** des ~1 500 stations Vélib', rafraîchie automatiquement toutes les 60 secondes
- **Markers colorés** selon le critère choisi (méca / élec / bornette) : vert ≥ 3 dispo, ambre 1-2, gris 0
- **Géolocalisation** en un clic ou **recherche d'adresse** via la [Base Adresse Nationale](https://adresse.data.gouv.fr/)
- **Itinéraire piéton** calculé via [OSRM](https://project-osrm.org/) jusqu'à la station choisie, avec distance et heure d'arrivée
- **Modes d'affichage** carte 2D, 2D inclinée (pitch 55°) avec extrusion 3D des bâtiments, ou globe 3D
- Thème clair / sombre, responsive, déployable en statique

### Source des données

- Dataset : [Vélib' - Vélos et bornes - Disponibilité temps réel](https://www.data.gouv.fr/datasets/velib-velos-et-bornes-disponibilite-temps-reel/) (Vélib' Métropole, via Opendata Paris)
- Endpoint utilisé : `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json`

### Stack technique

[Vite](https://vitejs.dev/) · [React 19](https://react.dev/) · TypeScript · [Tailwind CSS v4](https://tailwindcss.com/) · [MapLibre GL](https://maplibre.org/) · composants [mapcn](https://github.com/AnmolSaini16/mapcn) · tuiles [Carto](https://carto.com/) · routing piéton [OSRM](https://project-osrm.org/) · géocodage [BAN](https://adresse.data.gouv.fr/).

### Code source

Open source sous licence MIT : https://github.com/jabahm/velibmap

### Démo

https://jabahm.github.io/velibmap/
````

### URL de la démo
```
https://jabahm.github.io/velibmap/
```

(Active GitHub Pages dans Settings → Pages → Source : « GitHub Actions », puis le workflow déploie automatiquement.)

### Image / vignette
Joindre `docs/thumbnail.png` (1200 × 800 px recommandé). Voir section ci-dessous pour générer la capture.

### Tags / mots-clés
```
velib, mobilite, paris, transport, temps-reel, carte, opensource, react, maplibre, gbfs
```

### Datasets liés
- **Vélib' Vélos et bornes Disponibilité temps réel**, slug `velib-velos-et-bornes-disponibilite-temps-reel`

## 3. Générer la vignette (thumbnail)

L'app tourne en local sur http://localhost:5173 (via `pnpm dev`).

1. Ouvre l'app dans Chrome.
2. Reset à l'état initial (Paris zoom 12, thème clair, vue 2D).
3. Optionnel : tape une adresse pour montrer le pin pulsant + la liste des stations à proximité.
4. Capture d'écran : Cmd+Shift+4 sur macOS, ou utilise DevTools → Device Mode pour cadrer à 1200×800.
5. Enregistre sous `docs/thumbnail.png`.

## 4. Une fois publié

Édite ce fichier en remplaçant `https://github.com/jabahm/velibmap` et `https://jabahm.github.io/velibmap/` par les URLs définitives, et mets aussi à jour le [README.md](./README.md).

Pense à ajouter le lien vers la réutilisation publiée dans le README sous la forme :

```markdown
[![Réutilisation data.gouv.fr](https://img.shields.io/badge/data.gouv.fr-r%C3%A9utilisation-29304f?logo=data-dot-gouv-dot-fr)](https://www.data.gouv.fr/reuses/<slug-attribue>/)
```
