import { AnimatePresence, motion } from 'motion/react';
import QRCode from 'qrcode';
import { useEffect, useState, type ReactNode } from 'react';
import { KINDS } from '../../shared/board';
import type { Player, SpaceKind } from '../../shared/types';
import { serverNow } from '../hooks';
import { useT } from '../peek';

/** Rend le **gras** des cartes, et « ___ » comme un blanc à remplir. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((s, i) =>
        i % 2 ? s === '___' ? <span key={i} className="blank" aria-label="blanc" /> : <b key={i}>{s}</b> : <span key={i}>{s}</span>,
      )}
    </>
  );
}

/** Drapeaux en SVG (les émojis-drapeaux ne s’affichent pas sous Windows). */
export function FlagUK({ size = 22 }: { size?: number }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 60 40" aria-label="drapeau britannique" role="img" style={{ verticalAlign: '-0.2em', borderRadius: 3, border: '1.5px solid #14213d' }}>
      <rect width="60" height="40" fill="#1f3f8f" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#d7263d" strokeWidth="3" />
      <path d="M30 0 V40 M0 20 H60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0 V40 M0 20 H60" stroke="#d7263d" strokeWidth="6" />
    </svg>
  );
}

export function FlagFR({ size = 22 }: { size?: number }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 3 2" aria-label="drapeau français" role="img" style={{ verticalAlign: '-0.2em', borderRadius: 3, border: '1.5px solid #14213d' }}>
      <rect width="1" height="2" fill="#1f4fa3" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#d7263d" />
    </svg>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="#14213d" />
      <polygon points="50,14 81,32 81,68 50,86 19,68 19,32" fill="none" stroke="#f3ebdd" strokeWidth="5" strokeDasharray="7 5" />
      <circle cx="50" cy="50" r="15" fill="#d7263d" />
      <circle cx="50" cy="50" r="6" fill="#f3ebdd" />
    </svg>
  );
}

export function Flap({ ms }: { ms: number }) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return (
    <span className={`flap${s <= 30 ? ' urgent' : ''}`} aria-label={`${Math.floor(s / 60)} min ${s % 60} s`}>
      <span>{mm[0]}</span>
      <span>{mm[1]}</span>
      <span className="colon">:</span>
      <span>{ss[0]}</span>
      <span>{ss[1]}</span>
    </span>
  );
}

export function TimeBar({ deadline, total, label = true }: { deadline: number; total: number; label?: boolean }) {
  const t = useT();
  const left = Math.max(0, deadline - serverNow());
  const frac = Math.max(0, Math.min(1, left / total));
  const secs = Math.ceil(left / 1000);
  return (
    <>
      {label && (
        <div className="time-row">
          <span className="kicker">{t('Temps', 'Time')}</span>
          <span className="secs">{secs} s</span>
        </div>
      )}
      <div className={`timebar${secs <= 5 ? ' low' : ''}`} role="progressbar" aria-valuenow={secs} aria-valuemin={0} aria-label={t('Temps restant', 'Time left')}>
        <i style={{ transform: `scaleX(${frac})` }} />
      </div>
    </>
  );
}

export function Av({ p, className = 'av' }: { p: Pick<Player, 'avatar' | 'color'>; className?: string }) {
  return (
    <span className={className} style={{ ['--pc' as string]: p.color }}>
      {p.avatar}
    </span>
  );
}

export function ticketNo(seed: string) {
  let h = 7;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return `N° ${String(h).padStart(4, '0')}`;
}

export function Ticket({
  kind,
  seed,
  children,
  stamp,
  title,
}: {
  kind: SpaceKind;
  seed: string;
  children: ReactNode;
  stamp?: { ok: boolean; text: string } | null;
  title?: ReactNode;
}) {
  const t = useT();
  const info = KINDS[kind];
  return (
    <motion.div
      className="ticket"
      style={{ ['--cat' as string]: info.color }}
      initial={{ y: 40, opacity: 0, rotate: -1.5 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
    >
      <div className="ticket-stub" aria-hidden>
        <span className="ico">{info.icon}</span>
        <span className="vert">Grand Tour · {t(info.short, info.en.short)}</span>
        <span className="ico">🥐</span>
      </div>
      <div className="ticket-body">
        <div className="ticket-head">
          <span className="ticket-class">{title ?? t(info.label, info.en.label)}</span>
          <span className="ticket-no">{ticketNo(seed)}</span>
        </div>
        {children}
      </div>
      <AnimatePresence>
        {stamp && (
          <motion.div
            key={stamp.text}
            className={`stamp ${stamp.ok ? 'ok' : 'no'}`}
            initial={{ scale: 2.6, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            {stamp.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Say({ children, label }: { children: ReactNode; label?: ReactNode }) {
  const t = useT();
  return (
    <div className="say">
      <span className="lbl">💬 {label ?? t('À dire', 'Say it')}</span>
      <span>{children}</span>
    </div>
  );
}

export function Qr({ text }: { text: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 0, color: { dark: '#14213d', light: '#ffffff' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [text]);
  return <div className="qr" aria-label={`QR : ${text}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Sheet({ onClose, children, label }: { onClose?: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Phrases utiles : [français, anglais]. On les prononce toujours en français. */
export const PHRASES: [string, string][] = [
  ['C’est à qui ?', 'Whose turn is it?'],
  ['C’est à toi !', 'It’s your turn!'],
  ['C’est à moi !', 'It’s my turn!'],
  ['Vas-y, lance le dé !', 'Go on, roll the die!'],
  ['Bien joué !', 'Nice job!'],
  ['Dommage !', 'Too bad!'],
  ['Bravo !', 'Well done!'],
  ['Je ne sais pas…', 'I don’t know…'],
  ['Tu peux répéter, s’il te plaît ?', 'Can you repeat that, please?'],
  ['Comment dit-on… en français ?', 'How do you say… in French?'],
  ['Qu’est-ce que ça veut dire ?', 'What does that mean?'],
  ['Je suis d’accord.', 'I agree.'],
  ['Je ne suis pas d’accord !', 'I disagree!'],
  ['Attends !', 'Wait!'],
  ['Dépêche-toi !', 'Hurry up!'],
  ['En garde !', 'On guard!'],
  ['Prends ça !', 'Take that!'],
  ['Aïe ! Ça fait mal !', 'Ouch! That hurts!'],
  ['J’ai gagné !', 'I won!'],
  ['Tu triches !', 'You’re cheating!'],
  ['Chut ! Parle français !', 'Shh! Speak French!'],
];

/** Les trois modes de jeu, en français et en anglais. */
export const MODE_INFO = {
  plateau: {
    icon: '🗺️',
    fr: { name: 'Le Grand Tour', tag: 'Plateau', desc: 'Le jeu de plateau : cartes, conversation et votes. Le mode qui fait le plus parler !' },
    en: { name: 'The Grand Tour', tag: 'Board', desc: 'The board game: cards, conversation and votes. The mode that gets people talking the most!' },
  },
  combat: {
    icon: '🥊',
    fr: { name: 'Combat', tag: 'Jeu de combat', desc: 'Chaque bonne réponse frappe un adversaire. Combos, K.O., le dernier debout gagne !' },
    en: { name: 'Fight', tag: 'Fighting game', desc: 'Every right answer hits an opponent. Combos, K.O.s — last one standing wins!' },
  },
  sprint: {
    icon: '⚡',
    fr: { name: 'Sprint', tag: 'Course de vitesse', desc: 'Tout le monde reçoit la même question. Le plus rapide gagne 3 points !' },
    en: { name: 'Sprint', tag: 'Speed race', desc: 'Everyone gets the same question. The fastest gets 3 points!' },
  },
} as const;
