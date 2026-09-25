import { motion } from 'motion/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { BOARD, CENTER, cityAt, KINDS, RADIUS, spacePos, vertex } from '../../shared/board';
import type { Move, Player, Room } from '../../shared/types';
import { sfx } from '../fx';
import { serverNow } from '../hooks';

const STEP_S = 0.33;
const DELAY_S = 0.5;

const hexPoints = (r: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = ((-90 + 60 * k) * Math.PI) / 180;
    return `${CENTER.x + r * Math.cos(a)},${CENTER.y + r * Math.sin(a)}`;
  }).join(' ');

function slot(i: number, k: number, n: number) {
  const base = spacePos(i);
  if (n <= 1) return base;
  const a = (k / n) * Math.PI * 2 - Math.PI / 2;
  const r = n === 2 ? 20 : 26;
  return { x: base.x + Math.cos(a) * r, y: base.y + Math.sin(a) * r };
}

// ─── Décor (statique, mémorisé) ──────────────────────────────

const Scenery = memo(function Scenery({ spin }: { spin: boolean }) {
  const track = hexPoints(RADIUS);
  return (
    <g>
      <defs>
        <pattern id="waves" width="46" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 12 q 11.5 -9 23 0 t 23 0" fill="none" stroke="#86a9a8" strokeWidth="2" opacity=".55" />
        </pattern>
        <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="14" stroke="#14213d" strokeWidth="1" opacity=".05" />
        </pattern>
        <radialGradient id="land" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fbf5ea" />
          <stop offset="100%" stopColor="#efe3cc" />
        </radialGradient>
      </defs>

      <rect x="4" y="4" width="992" height="992" rx="44" fill="#b9d0cf" />
      <rect x="4" y="4" width="992" height="992" rx="44" fill="url(#waves)" />

      {/* Rose des vents */}
      <g transform="translate(92 110)" opacity=".75">
        <circle r="40" fill="none" stroke="#14213d" strokeWidth="2" />
        <circle r="30" fill="none" stroke="#14213d" strokeWidth="1" strokeDasharray="3 4" />
        <path d="M0 -52 L8 0 L0 52 L-8 0 Z" fill="#14213d" />
        <path d="M-52 0 L0 -8 L52 0 L0 8 Z" fill="#d7263d" />
        <text y="-60" textAnchor="middle" fontFamily="var(--f-sign)" fontWeight="900" fontSize="22" fill="#14213d">
          N
        </text>
      </g>

      {/* Mers et voisins */}
      <g fontFamily="var(--f-display)" fontStyle="italic" fill="#14213d" opacity=".6" fontSize="26">
        <text x="232" y="206" transform="rotate(-30 232 206)" textAnchor="middle">
          la Manche
        </text>
        <text x="86" y="560" transform="rotate(-90 86 560)" textAnchor="middle">
          Océan Atlantique
        </text>
        <text x="742" y="858" transform="rotate(-30 742 858)" textAnchor="middle">
          Mer Méditerranée
        </text>
      </g>
      <g fontFamily="var(--f-sign)" fontWeight="800" letterSpacing="5" fill="#14213d" opacity=".38" fontSize="18">
        <text x="770" y="196" transform="rotate(30 770 196)" textAnchor="middle">
          BELGIQUE · ALLEMAGNE
        </text>
        <text x="930" y="500" transform="rotate(90 930 500)" textAnchor="middle">
          SUISSE · ITALIE
        </text>
        <text x="262" y="846" transform="rotate(30 262 846)" textAnchor="middle">
          ESPAGNE
        </text>
      </g>

      {/* Corse */}
      <g transform="translate(905 790) rotate(12)">
        <path d="M0 -44 C 16 -40 20 -14 16 6 C 12 30 4 44 -6 42 C -18 38 -16 12 -20 -8 C -22 -28 -14 -46 0 -44 Z" fill="url(#land)" stroke="#14213d" strokeWidth="3" />
        <text y="68" textAnchor="middle" fontFamily="var(--f-display)" fontStyle="italic" fontSize="20" fill="#14213d" opacity=".7">
          Corse
        </text>
      </g>

      {/* L’Hexagone */}
      <polygon points={hexPoints(RADIUS + 44)} fill="#14213d" opacity=".12" transform="translate(8 10)" />
      <polygon points={hexPoints(RADIUS + 44)} fill="url(#land)" stroke="#14213d" strokeWidth="4" strokeLinejoin="round" />
      <polygon points={hexPoints(RADIUS + 44)} fill="url(#hatch)" />
      <polygon points={hexPoints(RADIUS + 34)} fill="none" stroke="#14213d" strokeWidth="1.5" strokeDasharray="2 7" opacity=".5" strokeLinejoin="round" />

      {/* Voie ferrée */}
      <polygon points={track} fill="none" stroke="#14213d" strokeWidth="16" strokeLinejoin="round" />
      <polygon points={track} fill="none" stroke="#f3ebdd" strokeWidth="6" strokeDasharray="14 12" strokeLinejoin="round" />

      {/* Centre : Paris */}
      <g className={spin ? 'spin-slow' : undefined} opacity=".16">
        {Array.from({ length: 24 }, (_, k) => (
          <line
            key={k}
            x1={500}
            y1={500}
            x2={500 + 250 * Math.cos((k * Math.PI) / 12)}
            y2={500 + 250 * Math.sin((k * Math.PI) / 12)}
            stroke="#14213d"
            strokeWidth={k % 2 ? 1 : 3}
          />
        ))}
      </g>
      <circle cx="500" cy="500" r="215" fill="#fbf5ea" stroke="#14213d" strokeWidth="3" />
      <circle cx="500" cy="500" r="202" fill="none" stroke="#d7263d" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />

      {/* Tour Eiffel stylisée */}
      <g transform="translate(500 312)" fill="#14213d">
        <path d="M-3 -52 L3 -52 L5 -30 L-5 -30 Z" />
        <path d="M-8 -30 L8 -30 L14 6 L-14 6 Z" />
        <rect x="-20" y="6" width="40" height="6" rx="1" />
        <path d="M-17 12 L17 12 L34 58 L20 58 Q0 30 -20 58 L-34 58 Z" />
        <rect x="-36" y="56" width="72" height="5" rx="1" />
      </g>

      <text x="500" y="428" textAnchor="middle" fontFamily="var(--f-sign)" fontWeight="900" letterSpacing="10" fontSize="22" fill="#d7263d">
        ★ PARIS ★
      </text>
      <text x="500" y="505" textAnchor="middle" fontFamily="var(--f-display)" fontStyle="italic" fontSize="58" fill="#14213d">
        Le Grand
      </text>
      <text x="500" y="584" textAnchor="middle" fontFamily="var(--f-display)" fontSize="98" fill="#14213d" letterSpacing="-2">
        Tour
      </text>
      <text x="500" y="632" textAnchor="middle" fontFamily="var(--f-sign)" fontWeight="800" letterSpacing="6" fontSize="17" fill="#6d6a60">
        FRANÇAIS III · IMSA
      </text>
    </g>
  );
});

const Spaces = memo(function Spaces() {
  return (
    <g>
      {BOARD.map((kind, i) => {
        const { x, y } = spacePos(i);
        const info = KINDS[kind];
        const corner = kind === 'gare' || kind === 'depart';
        const r = corner ? 42 : 28;
        const city = cityAt(i);
        const v = corner ? vertex(i / 6) : null;
        const f = i % 18 === 0 ? 1.135 : 1.235; // Lille (haut) et Perpignan (bas) : moins d’écart
        const lx = v ? CENTER.x + (v.x - CENTER.x) * f : 0;
        const ly = v ? CENTER.y + (v.y - CENTER.y) * f : 0;
        return (
          <g key={i}>
            <circle cx={x + 3} cy={y + 4} r={r + 3} fill="#14213d" opacity=".25" />
            <circle cx={x} cy={y} r={r + 3} fill="#14213d" />
            <circle cx={x} cy={y} r={r} fill={corner ? '#14213d' : info.color} stroke="#fffaf0" strokeWidth={corner ? 5 : 4} />
            {kind === 'depart' && (
              <g>
                <clipPath id="dep-clip">
                  <circle cx={x} cy={y} r={r - 4} />
                </clipPath>
                <g clipPath="url(#dep-clip)">
                  <rect x={x - r} y={y - r} width={(2 * r) / 3} height={2 * r} fill="#1f4fa3" />
                  <rect x={x - r / 3} y={y - r} width={(2 * r) / 3} height={2 * r} fill="#fff" />
                  <rect x={x + r / 3} y={y - r} width={(2 * r) / 3} height={2 * r} fill="#d7263d" />
                </g>
              </g>
            )}
            {kind !== 'depart' && (
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize={corner ? 34 : 25}>
                {info.icon}
              </text>
            )}
            {kind === 'depart' && (
              <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily="var(--f-sign)" fontWeight="900" fontSize="17" fill="#14213d" letterSpacing="1">
                DÉPART
              </text>
            )}
            {city && (
              <g>
                <rect
                  x={lx - (city.length * 9.6 + 20) / 2}
                  y={ly - 17}
                  width={city.length * 9.6 + 20}
                  height={32}
                  rx={7}
                  fill={kind === 'depart' ? '#d7263d' : '#14213d'}
                  stroke="#fffaf0"
                  strokeWidth="2"
                />
                <text x={lx} y={ly + 1} textAnchor="middle" dominantBaseline="central" fontFamily="var(--f-sign)" fontWeight="800" fontSize="18" letterSpacing="2" fill="#fffaf0">
                  {city.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
});

// ─── Pions ───────────────────────────────────────────────────

function Pawn({ p, k, n, move, active }: { p: Player; k: number; n: number; move: Move | null; active: boolean }) {
  const final = slot(p.pos, k, n);
  const myMove = move && move.pid === p.id ? move : null;
  const myMoveId = myMove?.id ?? -1;
  const seen = useRef(myMoveId);
  const shown = useRef(p.pos);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [anim, setAnim] = useState<{ xs: number[]; ys: number[]; times: number[]; duration: number; delay: number } | null>(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Déclenché uniquement quand CE pion reçoit un nouveau déplacement.
  useEffect(() => {
    if (myMoveId === seen.current) return;
    seen.current = myMoveId;
    clearTimers();
    if (!myMove || myMove.path.length === 0) {
      setAnim(null);
      return;
    }
    const duration = myMove.path.length * STEP_S;
    const delay0 = myMove.dice > 0 ? DELAY_S : 0.15;
    const age = (serverNow() - myMove.at) / 1000;
    if (age > delay0 + duration + 0.5) {
      setAnim(null);
      return;
    }
    const delay = Math.max(0, delay0 - age);
    const pts = [spacePos(shown.current), ...myMove.path.map((i) => spacePos(i))];
    pts[pts.length - 1] = final;
    const xs: number[] = [pts[0].x];
    const ys: number[] = [pts[0].y];
    for (let s = 1; s < pts.length; s++) {
      xs.push((pts[s - 1].x + pts[s].x) / 2, pts[s].x);
      ys.push((pts[s - 1].y + pts[s].y) / 2 - 26, pts[s].y);
    }
    const times = xs.map((_, i) => i / (xs.length - 1));
    setAnim({ xs, ys, times, duration, delay });
    timers.current = [
      ...myMove.path.map((_, s) => setTimeout(() => sfx.step(), (delay + (s + 1) * STEP_S) * 1000)),
      setTimeout(() => setAnim(null), (delay + duration + 0.1) * 1000),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMoveId]);

  // Mémorise la dernière position affichée (après l’effet ci-dessus).
  useEffect(() => {
    shown.current = p.pos;
  }, [p.pos]);

  useEffect(() => clearTimers, []);

  const size = n > 2 ? 27 : n === 2 ? 31 : 37;
  const lift = -14;
  return (
    <motion.g
      initial={false}
      animate={anim ? { x: anim.xs, y: anim.ys } : { x: final.x, y: final.y }}
      transition={
        anim
          ? { duration: anim.duration, times: anim.times, ease: 'easeInOut', delay: anim.delay }
          : { type: 'spring', stiffness: 260, damping: 24 }
      }
      style={{ pointerEvents: 'none' }}
    >
      <ellipse cx="0" cy="6" rx={size * 0.95} ry={size * 0.38} fill="#14213d" opacity=".45" />
      <g transform={`translate(0 ${lift})`}>
        {active && <circle r={size + 12} fill="none" stroke={p.color} strokeWidth="6" className="pulse-ring" />}
        <circle r={size + 3} fill="#14213d" />
        <circle r={size} fill={p.color} stroke="#fff" strokeWidth="4" />
        <text textAnchor="middle" dominantBaseline="central" y="1.5" fontSize={size * 1.1}>
          {p.avatar}
        </text>
      </g>
    </motion.g>
  );
}

// ─── Dé ──────────────────────────────────────────────────────

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const FACE_TRANSFORM: Record<number, string> = {
  1: 'rotateY(0deg)',
  6: 'rotateY(180deg)',
  2: 'rotateY(90deg)',
  5: 'rotateY(-90deg)',
  3: 'rotateX(90deg)',
  4: 'rotateX(-90deg)',
};

const SHOW: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: 0, y: -90 },
  5: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
};

export function DieFace({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={PIPS[n].includes(i) ? `pip${n === 1 ? ' r' : ''}` : undefined} style={PIPS[n].includes(i) ? undefined : { visibility: 'hidden' }} />
      ))}
    </>
  );
}

function Die3D({ value, rollId }: { value: number; rollId: number }) {
  const s = 74;
  const target = SHOW[value];
  const spinX = useMemo(() => 720 + Math.floor(Math.random() * 2) * 360, [rollId]);
  const spinY = useMemo(() => 720 + Math.floor(Math.random() * 2) * 360, [rollId]);
  return (
    <motion.div
      key={rollId}
      className="die"
      initial={{ rotateX: target.x - spinX, rotateY: target.y - spinY, scale: 0.4, y: -60, opacity: 0 }}
      animate={{ rotateX: target.x, rotateY: target.y, scale: 1, y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.85, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {[1, 2, 3, 4, 5, 6].map((f) => (
        <div key={f} className="face" style={{ transform: `${FACE_TRANSFORM[f]} translateZ(${s / 2}px)` }}>
          <DieFace n={f} />
        </div>
      ))}
    </motion.div>
  );
}

function DiceOverlay({ move }: { move: Move | null }) {
  const [show, setShow] = useState<Move | null>(null);
  const seen = useRef<number>(move?.id ?? -1);
  useEffect(() => {
    if (!move || move.id === seen.current) return;
    seen.current = move.id;
    if (move.dice <= 0 || serverNow() - move.at > 2500) return;
    setShow(move);
    sfx.roll();
    const t = setTimeout(() => setShow(null), 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [move?.id]);
  if (!show) return null;
  return (
    <div className="dice-layer">
      <Die3D value={show.dice} rollId={show.id} />
    </div>
  );
}

// ─── Plateau ─────────────────────────────────────────────────

export function Board({ room, spin = false }: { room: Room; spin?: boolean }) {
  const groups = useMemo(() => {
    const byPos = new Map<number, string[]>();
    for (const p of room.players) byPos.set(p.pos, [...(byPos.get(p.pos) ?? []), p.id]);
    return byPos;
  }, [room.players]);

  const activeId = room.status === 'playing' ? room.turn?.pid : undefined;
  const activePlayer = room.players.find((p) => p.id === activeId);
  const highlight = activePlayer && room.turn?.phase !== 'roll' ? spacePos(activePlayer.pos) : null;

  return (
    <div style={{ position: 'relative', height: '100%', aspectRatio: '1', maxWidth: '100%', margin: '0 auto' }}>
      <svg className="board-svg" viewBox="0 0 1000 1000" role="img" aria-label="Plateau de jeu : un tour de France en 36 cases" preserveAspectRatio="xMidYMid meet">
        <Scenery spin={spin} />
        <Spaces />
        {highlight && (
          <circle cx={highlight.x} cy={highlight.y} r="36" fill="none" stroke="#e09a1e" strokeWidth="6" strokeDasharray="6 6">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${highlight.x} ${highlight.y}`} to={`360 ${highlight.x} ${highlight.y}`} dur="6s" repeatCount="indefinite" />
          </circle>
        )}
        {room.players.map((p) => {
          const g = groups.get(p.pos) ?? [p.id];
          return <Pawn key={p.id} p={p} k={g.indexOf(p.id)} n={g.length} move={room.lastMove} active={p.id === activeId} />;
        })}
      </svg>
      <DiceOverlay move={room.lastMove} />
    </div>
  );
}
