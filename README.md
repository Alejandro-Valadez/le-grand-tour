# 🥐 Le Grand Tour

**A multiplayer online board game for practicing spoken French.** 2 to 6 players, each on their own phone. **[Play it at le-grand-tour.vercel.app](https://le-grand-tour.vercel.app)**

Built by Alejandro Valadez for M. Marshall's French III class at IMSA (2026-27), as a group assignment with Krithik.

[English](#english) · [Français](#français)

---

## English

### Three game modes

- **🗺️ Le Grand Tour.** The board game: a 36-space tour of France with cards, conversation prompts, and votes. Games run 1 to 20 minutes.
- **🥊 Combat.** Every right answer lands a hit on an opponent, with combos, speed bonuses, and a stun when you miss. 1, 2, or 3 minute rounds.
- **⚡ Sprint.** Everyone gets the same question, and the first correct answer scores 3 points. 1, 2, or 5 minutes.

Hold the **👀 English** button to see the screen in English; let go to return to French. Answer choices stay in French.

**The golden rule: speak French.** Any player can press **Anglais !** to call a vote. If the majority agrees, the speaker loses a croissant.

### What it reviews

Past participles, *être* vs *avoir* verbs (DR & MRS VANDERTRAMP) and agreement, *passé composé* vs *imparfait*, vocabulary and listening (text-to-speech audio cards), plus 45-second speaking turns, whole-table questions, and head-to-head duels.

For a class, open projector mode at `/tv/CODE` to show the board on the big screen. Full rules are at `/regles` and a grammar cheat sheet is at `/aide`.

### How it works

- **Front end:** Vite, React 19, and TypeScript. Motion for animation. The board is SVG.
- **Back end:** one Vercel function (`api/room.ts`) with Redis for game state. The server is the authority: it rolls the die, keeps answers secret until reveal, and runs the timers.
- **Game engine:** `shared/engine.ts`. **Cards:** `shared/cards.ts`.

### Run it locally

Needs Node.js and npm.

```bash
git clone https://github.com/Alejandro-Valadez/le-grand-tour.git
cd le-grand-tour
npm install
npm run dev      # http://localhost:5173 (uses in-memory storage if no Redis is set)
npm run sim      # checks every card and simulates 250 random games per mode
npm run build    # type-check and build to dist/
```

To use Redis, set one of these:

- `REDIS_URL`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- `KV_REST_API_URL` and `KV_REST_API_TOKEN`

---

## Français

**Un jeu de plateau en ligne pour parler français.** De 2 à 6 joueurs, chacun sur son téléphone.

### Trois modes

- **🗺️ Le Grand Tour.** Le jeu de plateau : un tour de France en 36 cases, avec des cartes, de la conversation et des votes (1 à 20 minutes ; parties éclair de 1 ou 2 minutes avec des délais plus courts).
- **🥊 Combat.** Chaque bonne réponse frappe un adversaire (combos, bonus de vitesse, étourdissement si on se trompe, K.O. !). Rounds de 1, 2 ou 3 minutes.
- **⚡ Sprint.** Tout le monde reçoit la même question ; le premier qui trouve gagne 3 points (1, 2 ou 5 minutes).

Le bouton **👀 English** (à maintenir) affiche l'écran en anglais ; on relâche pour revenir au français. Les choix de réponse restent en français.

### Ce qu'on révise

| Case | Contenu |
| --- | --- |
| ✒️ Participe passé | apprendre → appris, retrouver l'infinitif, phrases à compléter |
| 🏠 La maison d'être | DR & MRS VANDERTRAMP, être ou avoir, accord du participe |
| ⏳ PC ou imparfait ? | mots-signaux, habitude vs action ponctuelle |
| 🔊 Vocabulaire & écoute | expressions, nombres, faux amis, cartes audio (synthèse vocale) |
| 🎤 À toi de parler ! | 45 s de conversation, les autres votent |
| ☕ Tour de table | tout le monde répond, on vote pour la meilleure réponse |
| ⚔️ Duel | même question pour deux joueurs, le plus rapide gagne |
| ✨ Surprise · 🚄 Gare TGV | événements et raccourcis |

**Règle d'or : on parle français !** Le bouton **Anglais !** lance un vote : si la majorité est d'accord, le joueur perd un croissant.

Les règles complètes sont sur la page `/regles` et l'aide-mémoire de grammaire sur `/aide`. Le mode projecteur (`/tv/CODE`) affiche le plateau pour toute la classe.

### Technique

- **Front :** Vite + React + TypeScript, Motion pour les animations, plateau en SVG.
- **Back :** une fonction Vercel (`api/room.ts`) + **Redis** pour l'état des parties. Le serveur fait autorité : il lance le dé, garde les réponses secrètes et gère les délais.
- Le moteur du jeu est dans `shared/engine.ts` ; les cartes sont dans `shared/cards.ts`.

```bash
npm install
npm run dev        # http://localhost:5173 (stockage en mémoire si pas de Redis)
npm run sim        # vérifie les cartes et simule 250 parties par mode
npm run build
```

Variables d'environnement (une seule option) : `REDIS_URL`, ou `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, ou `KV_REST_API_URL` + `KV_REST_API_TOKEN`.
