import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { KINDS } from '../../shared/board';
import type { Room, SpaceKind } from '../../shared/types';
import { api, saveIdentity } from '../api';
import { Board } from '../components/Board';
import { FlagUK, Logo, Sheet } from '../components/ui';
import { navigate } from '../hooks';
import { JoinForm } from './RoomPage';

function demoRoom(): Room {
  const mk = (id: string, name: string, avatar: string, color: string, pos: number, score: number) => ({
    id,
    name,
    avatar,
    color,
    pos,
    score,
    skip: false,
    stats: { right: 0, wrong: 0, spoke: 0, steals: 0 },
    accuseReadyAt: 0,
    joinedAt: 0,
  });
  return {
    code: 'DEMO',
    version: 1,
    createdAt: 0,
    hostId: 'a',
    status: 'lobby',
    durationMin: 20,
    startedAt: 0,
    endsAt: 0,
    players: [
      mk('a', 'A', '🐓', '#D7263D', 3, 0),
      mk('b', 'B', '🥐', '#2F6FAE', 9, 0),
      mk('c', 'C', '🗼', '#E09A1E', 20, 0),
      mk('d', 'D', '🧀', '#3F7D58', 27, 0),
    ],
    turnIndex: 0,
    turnCount: 0,
    turn: null,
    lastMove: null,
    accusation: null,
    lastVerdict: null,
    log: [],
    seq: 1,
  };
}

const LEGEND: SpaceKind[] = ['pp', 'etre', 'temps', 'vocab', 'parle', 'table', 'duel', 'chance', 'gare', 'depart'];

export function Home() {
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const demo = useMemo(demoRoom, []);
  const clean = code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

  return (
    <div className="home">
      <header className="home-bar">
        <a className="logo" href="/">
          <Logo />
          <span className="logo-text">Le Grand Tour</span>
        </a>
        <nav className="home-links">
          <button className="btn small ghost" onClick={() => navigate('/regles')}>
            📜 Règles
          </button>
          <button className="btn small ghost" onClick={() => navigate('/aide')}>
            🏠 Aide
          </button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="hero-kicker">
              <span className="tricolore">
                <i />
                <i />
                <i />
              </span>
              Français III · Jeu de plateau
            </span>
            <h1>
              <span className="le">Le</span>
              Grand <span className="tour">Tour</span>
            </h1>
            <p className="hero-sub">
              Un tour de France en 36 cases. Chacun joue sur <em>son téléphone</em>, on révise les participes passés, la maison d’être, le passé composé et l’imparfait… et surtout, <em>on parle français</em> !
            </p>
            <div className="hero-actions">
              <button className="btn rouge huge block" onClick={() => setCreating(true)}>
                Créer une partie
              </button>
              <div className="or">ou</div>
              <form
                className="join-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (clean.length === 4) navigate(`/r/${clean}`);
                }}
              >
                <label className="sr-only" htmlFor="code">
                  Code de la partie
                </label>
                <input id="code" className="input code" placeholder="CODE" value={clean} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" autoComplete="off" inputMode="text" />
                <button className="btn" disabled={clean.length !== 4}>
                  Rejoindre
                </button>
              </form>
            </div>
          </motion.div>

          <motion.div className="hero-art" initial={{ opacity: 0, scale: 0.92, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
            <span className="poster-tag tag-1">2 à 6 joueurs · 10 à 30 min</span>
            <div className="poster">
              <Board room={demo} spin />
            </div>
            <span className="poster-tag tag-2">
              <FlagUK size={16} /> Interdit de parler anglais !
            </span>
          </motion.div>
        </section>

        <section className="legend">
          <h2>Les cases du plateau</h2>
          <div className="legend-grid">
            {LEGEND.map((k, i) => (
              <motion.div key={k} className="legend-item" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <span className="legend-dot" style={{ ['--c' as string]: k === 'depart' || k === 'gare' ? '#14213d' : KINDS[k].color }}>
                  {KINDS[k].icon}
                </span>
                <div>
                  <h3>{KINDS[k].label}</h3>
                  <p>{KINDS[k].blurb}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p className="sign">Le Grand Tour</p>
        <p>Conçu par Alejandro &amp; Krithik · Français III avec M. Marshall · IMSA 2026-2027</p>
      </footer>

      <AnimatePresence>
        {creating && (
          <Sheet onClose={() => setCreating(false)} label="Créer une partie">
            <JoinForm
              title="Nouvelle partie"
              cta="Créer la partie 🚄"
              onSubmit={async (name, avatar) => {
                const r = await api.create(name, avatar);
                if (r.you) saveIdentity(r.room.code, r.you);
                navigate(`/r/${r.room.code}`);
              }}
            >
              <p className="muted" style={{ margin: 0 }}>
                Tu seras l’hôte : tu choisis la durée et tu lances la partie.
              </p>
            </JoinForm>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}
