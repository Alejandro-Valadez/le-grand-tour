// Types partagés entre le serveur (api/) et le client (src/).

export type QuizCat = 'pp' | 'etre' | 'temps' | 'vocab';
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
}

export interface SpeakCard {
  id: string;
  prompt: string;
  /** Temps / structure à utiliser */
  focus: string;
  seconds: number;
}

export interface TableCard {
  id: string;
  prompt: string;
  focus: string;
}

export interface EventCard {
  id: string;
  title: string;
  text: string;
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
  tone?: 'good' | 'bad' | 'info';
}

export interface RoomBase<P> {
  code: string;
  version: number;
  createdAt: number;
  hostId: string;
  status: 'lobby' | 'playing' | 'ended';
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
}

export type ServerRoom = RoomBase<ServerPlayer> & { used: Record<string, string[]> };
export type Room = RoomBase<Player>;

export type Action =
  | { type: 'start'; durationMin: number }
  | { type: 'setDuration'; durationMin: number }
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
}
