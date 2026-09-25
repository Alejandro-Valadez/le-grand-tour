# 🥐 Le Grand Tour

**Un jeu de plateau en ligne pour parler français** — conçu par Alejandro & Krithik pour le cours de Français III de M. Marshall (IMSA, 2026-2027).

Un tour de France en 36 cases sur l’Hexagone. Chaque joueur joue sur son téléphone (2 à 6 joueurs, idéalement 4), et la partie dure 10 à 30 minutes. Le joueur qui a le plus de croissants 🥐 à la fin gagne.

## Ce qu’on révise

| Case | Contenu |
| --- | --- |
| ✒️ Participe passé | apprendre → appris, retrouver l’infinitif, phrases à compléter |
| 🏠 La maison d’être | DR & MRS VANDERTRAMP, être ou avoir, accord du participe |
| ⏳ PC ou imparfait ? | mots-signaux, habitude vs action ponctuelle |
| 🔊 Vocabulaire & écoute | expressions, nombres, faux amis, cartes audio (synthèse vocale) |
| 🎤 À toi de parler ! | 45 s de conversation, les autres votent |
| ☕ Tour de table | tout le monde répond, on vote pour la meilleure réponse |
| ⚔️ Duel | même question pour deux joueurs, le plus rapide gagne |
| ✨ Surprise · 🚄 Gare TGV | événements et raccourcis |

**Règle d’or :** on parle français ! Le bouton **Anglais !** lance un vote : si la majorité est d’accord, le joueur perd un croissant.

Les règles complètes sont sur la page `/regles` et l’aide-mémoire de grammaire sur `/aide`. Le mode projecteur (`/tv/CODE`) affiche le plateau pour toute la classe.

## Technique

- **Front :** Vite + React + TypeScript, Motion pour les animations, plateau en SVG.
- **Back :** une fonction Vercel (`api/room.ts`) + **Redis** pour l’état des parties. Le serveur fait autorité : il lance le dé, garde les réponses secrètes et gère les délais.
- Le moteur du jeu est dans `shared/engine.ts` ; les cartes sont dans `shared/cards.ts`.

```bash
npm install
npm run dev        # http://localhost:5173 (stockage en mémoire si pas de Redis)
npm run sim        # vérifie les cartes et simule 400 parties
npm run build
```

Variables d’environnement (une des deux) : `REDIS_URL`, ou `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_URL` + `KV_REST_API_TOKEN`).
