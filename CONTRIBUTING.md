# Contribuer à VélibMap

Merci de l'intérêt ! Le projet est volontairement petit pour rester facile à reprendre.

## Démarrer

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # vérifie que ça compile
pnpm exec tsc -b  # vérifie le typage strict
```

## Style

- Tailwind v4 + tokens shadcn pour les couleurs. Pas de couleurs en dur dans le JSX, utilise les classes `bg-background`, `text-muted-foreground`, etc.
- Pas de commentaire qui paraphrase le code. Garde-en un quand l'intention n'est pas évidente.
- Garde les composants découplés : le `Map` ne sait rien du domaine Vélib ; les composants `Stations*` ne parlent pas à l'API directement.

## Workflow

1. Fork + branche depuis `main`
2. Commits en [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
3. Vérifie `pnpm exec tsc -b` avant push
4. Ouvre une PR avec un titre clair et une capture si c'est visuel

## Idées en attente

Voir la section roadmap du [README](./README.md). Ouvre une issue avant les gros changements.
