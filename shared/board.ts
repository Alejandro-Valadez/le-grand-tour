import type { SpaceKind } from './types.js';

// Le plateau : l'Hexagone (la France !) — 36 cases, 6 gares aux sommets.
// Index 0 = Départ (Lille). On tourne dans le sens des aiguilles d'une montre.

const SIDES: SpaceKind[][] = [
  ['pp', 'vocab', 'parle', 'etre', 'temps'],
  ['etre', 'chance', 'pp', 'table', 'parle'],
  ['temps', 'vocab', 'duel', 'pp', 'parle'],
  ['etre', 'temps', 'chance', 'vocab', 'parle'],
  ['pp', 'table', 'etre', 'temps', 'duel'],
  ['vocab', 'etre', 'parle', 'pp', 'temps'],
];

export const CITIES = ['Lille', 'Strasbourg', 'Nice', 'Perpignan', 'Bordeaux', 'Brest'];

export const BOARD: SpaceKind[] = SIDES.flatMap((side, i) => [i === 0 ? 'depart' : 'gare', ...side]);
export const BOARD_SIZE = BOARD.length; // 36

export function nextGare(from: number): number {
  for (let s = 1; s <= BOARD_SIZE; s++) {
    const i = (from + s) % BOARD_SIZE;
    if (BOARD[i] === 'gare' || BOARD[i] === 'depart') return i;
  }
  return from;
}

export function cityAt(i: number): string | null {
  return i % 6 === 0 ? CITIES[i / 6] : null;
}

export interface KindInfo {
  label: string;
  short: string;
  icon: string;
  color: string;
  blurb: string;
}

export const KINDS: Record<SpaceKind, KindInfo> = {
  pp: {
    label: 'Participe passé',
    short: 'Participe',
    icon: '✒️',
    color: '#2F6FAE',
    blurb: 'Trouve le bon participe passé (apprendre → appris).',
  },
  etre: {
    label: 'La maison d’être',
    short: 'Être',
    icon: '🏠',
    color: '#D7263D',
    blurb: 'DR & MRS VANDERTRAMP : être ou avoir ? Et l’accord ?',
  },
  temps: {
    label: 'Passé composé ou imparfait ?',
    short: 'PC / Imp.',
    icon: '⏳',
    color: '#E09A1E',
    blurb: 'Action ponctuelle ou description ? Choisis le bon temps.',
  },
  vocab: {
    label: 'Vocabulaire & écoute',
    short: 'Vocab',
    icon: '🔊',
    color: '#3F7D58',
    blurb: 'Expressions, nombres, faux amis et écoute.',
  },
  parle: {
    label: 'À toi de parler !',
    short: 'Parle',
    icon: '🎤',
    color: '#6D5BA8',
    blurb: 'Parle 45 secondes. Les autres votent.',
  },
  table: {
    label: 'Tour de table',
    short: 'Café',
    icon: '☕',
    color: '#B5552F',
    blurb: 'Tout le monde répond. Vote pour la meilleure réponse.',
  },
  duel: {
    label: 'Duel !',
    short: 'Duel',
    icon: '⚔️',
    color: '#1B2A4A',
    blurb: 'Défie un joueur. Le plus rapide gagne 2 🥐.',
  },
  chance: {
    label: 'Surprise !',
    short: 'Surprise',
    icon: '✨',
    color: '#2A2A2A',
    blurb: 'Grève, anniversaire, pique-nique… tout peut arriver.',
  },
  gare: {
    label: 'Gare TGV',
    short: 'Gare',
    icon: '🚄',
    color: '#14213D',
    blurb: 'Prends le TGV jusqu’à la gare suivante !',
  },
  depart: {
    label: 'Départ',
    short: 'Départ',
    icon: '🏁',
    color: '#14213D',
    blurb: 'Chaque tour complet : +3 🥐.',
  },
};

// Géométrie (viewBox 1000 × 1000). Hexagone « pointe en haut ».
export const CENTER = { x: 500, y: 500 };
export const RADIUS = 408;

export function vertex(k: number) {
  const a = ((-90 + 60 * k) * Math.PI) / 180;
  return { x: CENTER.x + RADIUS * Math.cos(a), y: CENTER.y + RADIUS * Math.sin(a) };
}

export function spacePos(i: number) {
  const side = Math.floor(i / 6) % 6;
  const t = (i % 6) / 6;
  const a = vertex(side);
  const b = vertex(side + 1);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
