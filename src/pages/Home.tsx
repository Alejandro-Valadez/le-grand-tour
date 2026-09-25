import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { KINDS } from '../../shared/board';
import { MODES } from '../../shared/engine';
import type { Room, SpaceKind } from '../../shared/types';
import { api, saveIdentity } from '../api';
import { Board } from '../components/Board';
import { FlagUK, Logo, MODE_INFO, Sheet } from '../components/ui';
import { navigate } from '../hooks';
import { useT } from '../peek';
import { JoinForm } from './RoomPage';

function demoRoom(): Room {
  const mk = (id: string, avatar: string, color: string, pos: number) => ({
    id,
    name: id,
    avatar,
    color,
    pos,
    score: 0,
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
    mode: 'plateau',
    durationMin: 5,
    startedAt: 0,
    endsAt: 0,
    players: [mk('a', '🐓', '#D7263D', 3), mk('b', '🥐', '#2F6FAE', 9), mk('c', '🗼', '#E09A1E', 20), mk('d', '🧀', '#3F7D58', 27)],
    turnIndex: 0,
    turnCount: 0,
    turn: null,
    lastMove: null,
    accusation: null,
    lastVerdict: null,
    log: [],
    seq: 1,
    combat: null,
    sprint: null,
  };
}

const LEGEND: SpaceKind[] = ['pp', 'etre', 'temps', 'vocab', 'parle', 'table', 'duel', 'chance', 'gare', 'depart'];

export function Home() {
  const t = useT();
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
            📜 {t('Règles', 'Rules')}
          </button>
          <button className="btn small ghost" onClick={() => navigate('/aide')}>
            🏠 {t('Aide', 'Help')}
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
              {t('Français III · Jeu de plateau', 'French III · Board game')}
            </span>
            <h1>
              <span className="le">Le</span>
              Grand <span className="tour">Tour</span>
            </h1>
            <p className="hero-sub">
              {t(
                <>
                  Un tour de France en 36 cases, un jeu de combat et une course de vitesse. Chacun joue sur <em>son téléphone</em>, on révise les participes passés, la maison d’être, le passé composé et l’imparfait… et surtout, <em>on parle français</em> !
                </>,
                <>
                  A 36-space tour of France, a fighting game and a speed race. Everyone plays on <em>their own phone</em>, you review past participles, the house of être, the passé composé and the imparfait… and above all, <em>you speak French</em>!
                </>,
              )}
            </p>
            <div className="hero-actions">
              <button className="btn rouge huge block" onClick={() => setCreating(true)}>
                {t('Créer une partie', 'Create a game')}
              </button>
              <div className="or">{t('ou', 'or')}</div>
              <form
                className="join-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (clean.length === 4) navigate(`/r/${clean}`);
                }}
              >
                <label className="sr-only" htmlFor="code">
                  {t('Code de la partie', 'Game code')}
                </label>
                <input id="code" className="input code" placeholder="CODE" value={clean} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" autoComplete="off" inputMode="text" />
                <button className="btn" disabled={clean.length !== 4}>
                  {t('Rejoindre', 'Join')}
                </button>
              </form>
            </div>
          </motion.div>

          <motion.div className="hero-art" initial={{ opacity: 0, scale: 0.92, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
            <span className="poster-tag tag-1">{t('2 à 6 joueurs · 1 à 20 min', '2 to 6 players · 1 to 20 min')}</span>
            <div className="poster">
              <Board room={demo} spin />
            </div>
            <span className="poster-tag tag-2">
              <FlagUK size={16} /> {t('Interdit de parler anglais !', 'No speaking English!')}
            </span>
          </motion.div>
        </section>

        <section className="legend">
          <h2>{t('Trois façons de jouer', 'Three ways to play')}</h2>
          <div className="mode-grid">
            {MODES.map((m, i) => {
              const mi = MODE_INFO[m];
              return (
                <motion.div key={m} className={`mode-tile ${m}`} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <span className="mode-ico">{mi.icon}</span>
                  <h3>{t(mi.fr.name, mi.en.name)}</h3>
                  <span className="kicker">{t(mi.fr.tag, mi.en.tag)}</span>
                  <p>{t(mi.fr.desc, mi.en.desc)}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="legend">
          <h2>{t('Les cases du plateau', 'The board spaces')}</h2>
          <div className="legend-grid">
            {LEGEND.map((k, i) => (
              <motion.div key={k} className="legend-item" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <span className="legend-dot" style={{ ['--c' as string]: k === 'depart' || k === 'gare' ? '#14213d' : KINDS[k].color }}>
                  {KINDS[k].icon}
                </span>
                <div>
                  <h3>{t(KINDS[k].label, KINDS[k].en.label)}</h3>
                  <p>{t(KINDS[k].blurb, KINDS[k].en.blurb)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p className="sign">Le Grand Tour</p>
        <p>{t('Conçu par Alejandro & Krithik · Français III avec M. Marshall · IMSA 2026-2027', 'Made by Alejandro & Krithik · French III with M. Marshall · IMSA 2026-2027')}</p>
      </footer>

      <AnimatePresence>
        {creating && (
          <Sheet onClose={() => setCreating(false)} label={t('Créer une partie', 'Create a game')}>
            <JoinForm
              title={t('Nouvelle partie', 'New game')}
              cta={t('Créer la partie 🚄', 'Create the game 🚄')}
              onSubmit={async (name, avatar) => {
                const r = await api.create(name, avatar);
                if (r.you) saveIdentity(r.room.code, r.you);
                navigate(`/r/${r.room.code}`);
              }}
            >
              <p className="muted" style={{ margin: 0 }}>
                {t('Tu seras l’hôte : tu choisis le mode, la durée, et tu lances la partie.', 'You’ll be the host: you pick the mode and the length, and you start the game.')}
              </p>
            </JoinForm>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}
