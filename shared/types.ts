// Types partagés entre le serveur (api/) et le client (src/).

export type QuizCat = 'pp' | 'etre' | 'temps' | 'vocab';
export type Mode = 'plateau' | 'combat' | 'sprint';
export type SpaceKind = QuizCat | 'parle' | 'table' | 'duel' | 'chance' | 'gare' | 'depart';

export interface QuizCard {
  id: string;
  cat: QuizCat;
  /** Consigne courte, ex. « Participe passé » */
  ask: string;
  /** La question elle-même (peut contenir **gras**) */
  q: string;
  /** Bonne réponse */
  a: string;
  /** Mauvaises réponses */
  w: string[];
  /** Explication montrée après la réponse */
  x: string;
  /** Texte lu à voix haute (synthèse vocale) pour les cartes d'écoute */
  audio?: string;
  /** Traduction anglaise (bouton 👀 English) — les options restent en français */
  en: { ask: string; q: string; x: string };
}

export interface SpeakCard {
  id: string;
  prompt: string;
  /** Temps / structure à utiliser */
  focus: string;
  seconds: number;
  en: { prompt: string; focus: string };
}

export interface TableCard {
  id: string;
  prompt: string;
  focus: string;
  en: { prompt: string; focus: string };
}

export interface EventCard {
  id: string;
  title: string;
  text: string;
  en: { title: string; text: string };
  effect:
    | { kind: 'score'; amount: number }
    | { kind: 'move'; steps: number }
    | { kind: 'everyone'; amount: number }
    | { kind: 'birthday'; amount: number }
    | { kind: 'rob-leader'; amount: number }
    | { kind: 'skip' }
    | { kind: 'again' };
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  pos: number;
  score: number;
  skip: boolean;
  stats: { right: number; wrong: number; spoke: number; steals: number };
  accuseReadyAt: number;
  joinedAt: number;
}

/** Joueur tel que stocké côté serveur (avec son jeton secret). */
export interface ServerPlayer extends Player {
  token: string;
}

/** Carte quiz distribuée : options mélangées, réponse cachée (-1) côté client tant que non révélée. */
export interface DealtQuiz {
  id: string;
  cat: QuizCat;
  ask: string;
  q: string;
  options: string[];
  answer: number;
  x: string;
  audio?: string;
  en: { ask: string; q: string; x: string };
}

export type Turn =
  | { phase: 'roll'; pid: string; deadline: number }
  | { phase: 'quiz'; pid: string; card: DealtQuiz; startsAt: number; deadline: number }
  | {
      phase: 'steal';
      pid: string;
      card: DealtQuiz;
      firstChoice: number; // -1 = temps écoulé
      tried: string[];
      deadline: number;
    }
  | { phase: 'duel_pick'; pid: string; startsAt: number; deadline: number }
  | {
      phase: 'duel';
      pid: string;
      opp: string;
      card: DealtQuiz;
      locked: string[];
      startsAt: number;
      deadline: number;
    }
  | { phase: 'speak'; pid: string; card: SpeakCard; startsAt: number; deadline: number }
  | { phase: 'vote'; pid: string; card: SpeakCard; votes: Record<string, boolean>; deadline: number }
  | { phase: 'table_speak'; pid: string; card: TableCard; startsAt: number; deadline: number }
  | { phase: 'table_vote'; pid: string; card: TableCard; votes: Record<string, string>; deadline: number }
  | { phase: 'event'; pid: string; card: EventCard; startsAt: number; deadline: number }
  | { phase: 'tgv'; pid: string; from: number; to: number; startsAt: number; deadline: number }
  | { phase: 'reveal'; pid: string; outcome: Outcome; deadline: number };

export type Outcome =
  | {
      kind: 'quiz';
      card: DealtQuiz;
      choice: number; // choix du joueur actif (-1 = temps écoulé)
      correct: boolean;
      stealer?: string;
      stealChoice?: number;
    }
  | { kind: 'duel'; card: DealtQuiz; opp: string; winner?: string }
  | { kind: 'speak'; card: SpeakCard; yes: number; no: number; gained: number }
  | { kind: 'table'; card: TableCard; winners: string[]; tally: Record<string, number> };

export interface Move {
  id: number;
  pid: string;
  dice: number;
  path: number[];
  at: number;
}

export interface Accusation {
  id: number;
  by: string;
  target: string;
  votes: Record<string, boolean>;
  deadline: number;
}

export interface Verdict {
  id: number;
  by: string;
  target: string;
  guilty: boolean;
  at: number;
}

export interface LogEntry {
  id: number;
  at: number;
  text: string;
  en?: string;
  tone?: 'good' | 'bad' | 'info';
}

/** Résultat de la dernière réponse d'un combattant (pour l'animation). */
export interface FightResult {
  id: number;
  ok: boolean;
  dmg: number;
  choice: number;
  card: DealtQuiz;
  at: number;
}

export interface Fighter {
  hp: number;
  combo: number;
  bestCombo: number;
  target: string | null;
  q: DealtQuiz;
  qAt: number;
  stunUntil: number;
  hits: number;
  misses: number;
  dmg: number;
  kos: number;
  koAt: number;
  lastHit: { id: number; by: string; dmg: number; at: number } | null;
  lastResult: FightResult | null;
}

export interface CombatState {
  startsAt: number;
  fighters: Record<string, Fighter>;
  winners: string[];
}

export interface SprintState {
  startsAt: number;
  round: number;
  q: DealtQuiz;
  qAt: number;
  deadline: number;
  answers: Record<string, { choice: number; at: number; ok: boolean; pts: number }>;
  /** 0 tant que la question est ouverte, sinon fin de l'écran de réponse */
  revealUntil: number;
  firstId: string | null;
}

export interface RoomBase<P> {
  code: string;
  version: number;
  createdAt: number;
  hostId: string;
  status: 'lobby' | 'playing' | 'ended';
  mode: Mode;
  durationMin: number;
  startedAt: number;
  endsAt: number;
  players: P[];
  turnIndex: number;
  turnCount: number;
  turn: Turn | null;
  lastMove: Move | null;
  accusation: Accusation | null;
  lastVerdict: Verdict | null;
  log: LogEntry[];
  seq: number;
  combat: CombatState | null;
  sprint: SprintState | null;
}

export type ServerRoom = RoomBase<ServerPlayer> & { used: Record<string, string[]> };
export type Room = RoomBase<Player>;

export type Action =
  | { type: 'start'; durationMin: number }
  | { type: 'setDuration'; durationMin: number }
  | { type: 'setMode'; mode: Mode }
  | { type: 'fight'; choice: number }
  | { type: 'target'; target: string }
  | { type: 'sprintAnswer'; choice: number }
  | { type: 'kick'; target: string }
  | { type: 'roll' }
  | { type: 'answer'; choice: number }
  | { type: 'steal'; choice: number }
  | { type: 'pickOpponent'; target: string }
  | { type: 'duelAnswer'; choice: number }
  | { type: 'doneSpeaking' }
  | { type: 'vote'; yes: boolean }
  | { type: 'tableDone' }
  | { type: 'tableVote'; target: string }
  | { type: 'continue' }
  | { type: 'accuse'; target: string }
  | { type: 'accuseVote'; yes: boolean }
  | { type: 'endNow' }
  | { type: 'restart' };

export interface RoomResponse {
  room: Room;
  now: number;
  you?: { id: string; token: string };
  error?: string;
  errorEn?: string;
}
