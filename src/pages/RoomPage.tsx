import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AVATARS, MAX_PLAYERS } from '../../shared/engine';
import type { Action, Player, Room } from '../../shared/types';
import { api, ApiError, claimIdentity, forgetIdentity, getIdentity, saveIdentity, type Identity } from '../api';
import { Board } from '../components/Board';
import { cardOpen, Dock, type Act } from '../components/Dock';
import { AccusationModal, AccusePicker, MenuSheet, PhrasesSheet, VerdictStamp } from '../components/Overlays';
import { Av, Flap, FlagUK, Logo, Qr, Say } from '../components/ui';
import { buzz, sfx } from '../fx';
import { navigate, useRoom, useTick } from '../hooks';

// ─── Rejoindre ──────────────────────────────────────────────

export function JoinForm({
  title,
  cta,
  onSubmit,
  children,
}: {
  title: string;
  cta: string;
  onSubmit: (name: string, avatar: string) => Promise<void>;
  children?: ReactNode;
}) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * 6)]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel"
      style={{ display: 'grid', gap: 16 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setErr('Écris ton prénom !');
        setBusy(true);
        setErr(null);
        try {
          await onSubmit(name.trim(), avatar);
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Erreur');
          setBusy(false);
        }
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      {children}
      <div className="field">
        <label htmlFor="nm">Ton prénom</label>
        <input id="nm" className="input" value={name} maxLength={16} autoComplete="given-name" placeholder="Ex. : Camille" onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Ton pion</label>
        <div className="avatars" role="radiogroup" aria-label="Choisis ton pion">
          {AVATARS.map((a) => (
            <button type="button" key={a} role="radio" aria-checked={a === avatar} className={a === avatar ? 'on' : ''} onClick={() => setAvatar(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>
      {err && <div className="error">{err}</div>}
      <button className="btn rouge block" disabled={busy}>
        {busy ? 'Un instant…' : cta}
      </button>
    </form>
  );
}

function SimpleBar({ right }: { right?: ReactNode }) {
  return (
    <div className="home-bar">
      <a
        className="logo"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          navigate('/');
        }}
      >
        <Logo />
        <span className="logo-text">Le Grand Tour</span>
      </a>
      {right}
    </div>
  );
}

// ─── Salle d’attente ────────────────────────────────────────

function Lobby({ room, me, act, busy, tv }: { room: Room; me: Player | null; act: Act; busy: boolean; tv: boolean }) {
  const isHost = me?.id === room.hostId;
  const link = `${location.origin}/r/${room.code}`;
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Le Grand Tour', text: `Rejoins ma partie ! Code : ${room.code}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* annulé */
    }
  };
  const seats = Array.from({ length: MAX_PLAYERS }, (_, i) => room.players[i] ?? null);
  return (
    <div className="lobby">
      <SimpleBar
        right={
          <a className="btn small ghost" href="/regles" target="_blank" rel="noreferrer">
            📜 Règles
          </a>
        }
      />
      <div className="lobby-grid">
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="ticket boarding">
            <div className="ticket-stub" aria-hidden>
              <span className="ico">🚄</span>
              <span className="vert">Carte d’embarquement</span>
              <span className="ico">🥐</span>
            </div>
            <div className="ticket-body">
              <span className="kicker">Code de la partie</span>
              <div className="big-code" aria-label={`Code : ${room.code.split('').join(' ')}`}>
                {room.code.split('').map((c, i) => (
                  <motion.span key={i} initial={{ rotateX: 90 }} animate={{ rotateX: 0 }} transition={{ delay: 0.1 * i }}>
                    {c}
                  </motion.span>
                ))}
              </div>
              <div className="qr-row">
                <Qr text={link} />
                <div style={{ display: 'grid', gap: 8 }}>
                  <span className="muted">Scanne ou va sur :</span>
                  <span className="link-line">{link.replace(/^https?:\/\//, '')}</span>
                  {!tv && (
                    <button className="btn small ghost" onClick={share}>
                      {copied ? 'Lien copié ✓' : '📤 Partager'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Comment jouer ?</h2>
            <ol className="steps">
              <li>Chacun rejoint la partie sur son téléphone.</li>
              <li>À ton tour, lance le dé et avance sur l’Hexagone.</li>
              <li>Réponds à la carte : participes passés, être ou avoir, PC ou imparfait, vocabulaire…</li>
              <li>Sur les cases 🎤 et ☕, tu parles et les autres votent.</li>
              <li>Gagne des croissants 🥐. Quand le temps est écoulé, le plus gros tas gagne !</li>
              <li>
                <b>Règle d’or :</b> on parle <b>français</b>. Quelqu’un parle anglais ? Appuie sur <b>
                  <FlagUK size={15} /> Anglais !
                </b>
              </li>
            </ol>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="panel">
            <h2>
              Passagers <span className="muted">({room.players.length}/{MAX_PLAYERS})</span>
            </h2>
            <div className="seats">
              <AnimatePresence>
                {seats.map((p, i) =>
                  p ? (
                    <motion.div key={p.id} className="seat" style={{ ['--pc' as string]: p.color }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <span className="av">{p.avatar}</span>
                      <span className="nm">
                        {p.name} {p.id === me?.id && <small className="muted">(toi)</small>}
                      </span>
                      <span className="role">{p.id === room.hostId ? 'Hôte' : `Siège ${i + 1}`}</span>
                      {isHost && p.id !== me?.id && (
                        <button className="kick" aria-label={`Retirer ${p.name}`} onClick={() => act({ type: 'kick', target: p.id })}>
                          ✕
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <div key={`e${i}`} className="seat empty">
                      <span className="av">·</span>
                      <span>Place libre</span>
                    </div>
                  ),
                )}
              </AnimatePresence>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              Idéal : 4 joueurs. Minimum : 2.
            </p>
          </div>

          <div className="panel">
            <h2>Durée du voyage</h2>
            <div className="durations">
              {[10, 15, 20, 30].map((m) => (
                <button key={m} className={`chip-btn${room.durationMin === m ? ' on' : ''}`} disabled={!isHost || busy} onClick={() => act({ type: 'setDuration', durationMin: m })}>
                  {m} min
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              {isHost ? (
                <button className="btn rouge huge block" disabled={busy || room.players.length < 2} onClick={() => act({ type: 'start', durationMin: room.durationMin })}>
                  {room.players.length < 2 ? 'En attente de joueurs…' : 'En voiture ! ▶'}
                </button>
              ) : (
                <Say label="Attente">
                  <q>On attend l’hôte… Tu es prêt(e) ?</q>
                </Say>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fin de partie ──────────────────────────────────────────

function End({ room, me, act, busy }: { room: Room; me: Player | null; act: Act; busy: boolean }) {
  const ranked = useMemo(() => [...room.players].sort((a, b) => b.score - a.score || b.stats.right - a.stats.right), [room.players]);
  const top = ranked[0]?.score ?? 0;
  const winners = ranked.filter((p) => p.score === top);
  const isHost = me?.id === room.hostId;

  useEffect(() => {
    sfx.chime();
    const colors = ['#1f4fa3', '#ffffff', '#d7263d', '#e09a1e'];
    const end = Date.now() + 1800;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const podium = [ranked[1], ranked[0], ranked[2]];
  const cls = ['second', 'first', 'third'];
  const place = [2, 1, 3];
  return (
    <div className="end">
      <SimpleBar />
      <div className="end-inner">
        <div style={{ textAlign: 'center' }}>
          <span className="kicker">Terminus · tout le monde descend !</span>
          <h1>
            {winners.length > 1 ? 'Égalité !' : 'Victoire de'}
            <br />
            <span style={{ color: 'var(--rouge)', fontStyle: 'italic' }}>{winners.map((w) => w.name).join(' & ')}</span>
          </h1>
        </div>
        <div className="podium">
          {podium.map((p, i) =>
            p ? (
              <motion.div key={p.id} className={`step ${cls[i]}`} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + (2 - place[i]) * 0.25 }}>
                <Av p={p} />
                <span className="nm">{p.name}</span>
                <span className="score">{p.score} 🥐</span>
                <div className="block">{place[i]}</div>
              </motion.div>
            ) : (
              <div key={i} />
            ),
          )}
        </div>
        <div className="ranking">
          {ranked.map((p, i) => (
            <div key={p.id} className="rank">
              <span className="pos">{i + 1}</span>
              <Av p={p} />
              <div>
                <b>{p.name}</b>
                <div className="stats">
                  ✅ {p.stats.right} bonne{p.stats.right > 1 ? 's' : ''} réponse{p.stats.right > 1 ? 's' : ''} · 🦊 {p.stats.steals} vol{p.stats.steals > 1 ? 's' : ''} · 🎤 {p.stats.spoke} prise{p.stats.spoke > 1 ? 's' : ''} de parole
                </div>
              </div>
              <span className="sc">{p.score} 🥐</span>
            </div>
          ))}
        </div>
        <Say label="Pour finir">
          Chacun dit une chose qu’il a apprise : <q>Aujourd’hui, j’ai appris que…</q>
        </Say>
        {isHost ? (
          <button className="btn rouge huge block" disabled={busy} onClick={() => act({ type: 'restart' })}>
            Nouvelle partie ↻
          </button>
        ) : (
          <p className="muted" style={{ textAlign: 'center' }}>
            L’hôte peut relancer une nouvelle partie.
          </p>
        )}
        <button className="btn ghost block" onClick={() => navigate('/')}>
          Retour à l’accueil
        </button>
      </div>
    </div>
  );
}

// ─── Partie en cours ────────────────────────────────────────

function Game({
  room,
  me,
  act,
  busy,
  tv,
  onLeave,
}: {
  room: Room;
  me: Player | null;
  act: Act;
  busy: boolean;
  tv: boolean;
  onLeave: () => void;
}) {
  const now = useTick(250);
  const [menu, setMenu] = useState(false);
  const [phrases, setPhrases] = useState(false);
  const [accuse, setAccuse] = useState(false);
  const left = room.endsAt - now;
  const open = cardOpen(room);
  const activeId = room.turn?.pid;

  // Sons & vibrations
  const prevKey = useRef('');
  useEffect(() => {
    const t = room.turn;
    if (!t) return;
    const key = `${t.phase}:${t.pid}:${'deadline' in t ? t.deadline : ''}`;
    if (key === prevKey.current) return;
    const first = prevKey.current === '';
    prevKey.current = key;
    if (first) return;
    if (t.phase === 'roll' && me && t.pid === me.id) {
      sfx.chime();
      buzz([120, 80, 120]);
    }
    if (t.phase === 'reveal') {
      sfx.stamp();
      const o = t.outcome;
      const good = o.kind === 'quiz' ? o.correct || !!o.stealer : o.kind === 'duel' ? !!o.winner : o.kind === 'speak' ? o.gained > 0 : o.winners.length > 0;
      setTimeout(() => (good ? sfx.good() : sfx.bad()), 150);
    }
    if (t.phase === 'steal' && me && t.pid !== me.id) buzz(60);
    if (t.phase === 'tgv') sfx.whistle();
  }, [room.turn, me]);

  const recent = room.log.slice(-6).reverse();
  const fmt = (at: number) => new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="game">
      <header className="topbar">
        <Logo size={30} />
        <span className="code-chip">
          <small>Code</small>
          {room.code}
        </span>
        <span className="spacer" />
        {left > 0 ? <Flap ms={left} /> : <span className="sign" style={{ color: 'var(--moutarde)' }}>Dernier tour !</span>}
        {!tv && (
          <button className="icon-btn" aria-label="Menu" onClick={() => setMenu(true)}>
            ☰
          </button>
        )}
      </header>

      <nav className="players" aria-label="Joueurs et scores">
        {room.players.map((p) => (
          <div key={p.id} className={`pchip${p.id === activeId ? ' active' : ''}`}>
            <Av p={p} />
            <span className="nm">{p.name}</span>
            {p.id === me?.id && <span className="me">toi</span>}
            {p.skip && (
              <span className="skip" title="Passe son prochain tour">
                🚗
              </span>
            )}
            <motion.span key={p.score} className="sc" initial={{ scale: 1.6, color: '#d7263d' }} animate={{ scale: 1, color: '#14213d' }}>
              {p.score}🥐
            </motion.span>
          </div>
        ))}
      </nav>

      <main className="stage">
        <div className={`board-area${open && !tv ? ' compact' : ''}`}>
          <Board room={room} spin={tv} />
        </div>
        <div className="dock">
          <div className="dock-inner">
            <Dock room={room} me={me} act={act} busy={busy} />
            {!me && !tv && <Say label="Spectateur">Tu regardes la partie.</Say>}
            <div className="section-title">Journal de bord</div>
            <ul className="feed">
              {recent.map((l) => (
                <li key={l.id} className={l.tone}>
                  <time>{fmt(l.at)}</time>
                  <span>{l.text}</span>
                </li>
              ))}
            </ul>
            <span className="credit">Le Grand Tour · conçu par Alejandro & Krithik · Français III</span>
          </div>
        </div>
      </main>

      {me && !tv && (
        <div className="fab-row">
          <button className="fab english" onClick={() => setAccuse(true)} disabled={!!room.accusation}>
            <FlagUK size={18} /> Anglais !
          </button>
          <button className="fab" onClick={() => setPhrases(true)}>
            💬 Phrases
          </button>
        </div>
      )}

      <AnimatePresence>
        {menu && (
          <MenuSheet
            key="menu"
            room={room}
            me={me}
            act={act}
            onClose={() => setMenu(false)}
            onPhrases={() => {
              setMenu(false);
              setPhrases(true);
            }}
            onLeave={onLeave}
          />
        )}
        {phrases && <PhrasesSheet key="phrases" onClose={() => setPhrases(false)} />}
        {accuse && me && !room.accusation && <AccusePicker key="accuse" room={room} me={me} act={act} onClose={() => setAccuse(false)} />}
        {room.accusation && <AccusationModal key="accusation" room={room} me={me} act={act} busy={busy} />}
      </AnimatePresence>
      <VerdictStamp room={room} />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────

export function RoomPage({ code, tv = false }: { code: string; tv?: boolean }) {
  const { room, error, offline, accept } = useRoom(code);
  // Le mode projecteur est toujours spectateur, même sur l’appareil d’un joueur.
  const [identity, setIdentity] = useState<Identity | null>(() => (tv ? null : getIdentity(code).mine));
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [spectate, setSpectate] = useState(tv);

  const me = useMemo(() => (identity && room ? room.players.find((p) => p.id === identity.id) ?? null : null), [identity, room]);

  const say = useCallback((text: string) => {
    const id = Date.now();
    setToast({ id, text });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2800);
  }, []);

  const act: Act = useCallback(
    async (action: Action) => {
      if (!identity) return false;
      setBusy(true);
      const t0 = Date.now();
      try {
        const r = await api.act(code, identity, action);
        accept(r, t0, Date.now());
        return true;
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.data) accept(e.data, t0, Date.now());
          say(e.message);
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [code, identity, accept, say],
  );

  const leave = () => {
    forgetIdentity(code);
    setIdentity(null);
    navigate('/');
  };

  const toastEl = (
    <div className="toast-zone" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} className="toast bad" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
            {toast.text}
          </motion.div>
        )}
        {offline && (
          <motion.div key="off" className="toast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            📡 Connexion perdue… on réessaie.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (error) {
    return (
      <div className="loading">
        <div style={{ fontSize: '3rem' }}>🚫🚉</div>
        <h1 className="display" style={{ fontSize: '2.6rem', margin: 0 }}>
          Partie introuvable
        </h1>
        <p className="muted">Le code {code} n’existe pas (ou la partie est terminée depuis longtemps).</p>
        <button className="btn rouge" onClick={() => navigate('/')}>
          Retour à l’accueil
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="loading">
        <div className="train-loader">🚂💨</div>
        <p className="kicker">Le train entre en gare…</p>
      </div>
    );
  }

  if (!me && !spectate) {
    const { remembered } = getIdentity(code);
    const known = remembered ? room.players.find((p) => p.id === remembered.id) : null;
    return (
      <div className="lobby">
        <SimpleBar />
        <div className="join">
          <div style={{ textAlign: 'center' }}>
            <span className="kicker">Partie</span>
            <h1 className="display" style={{ fontSize: '3.4rem', margin: '4px 0', letterSpacing: '0.12em' }}>
              {room.code}
            </h1>
            <p className="muted" style={{ margin: 0 }}>
              {room.players.length} passager{room.players.length > 1 ? 's' : ''} à bord : {room.players.map((p) => `${p.avatar} ${p.name}`).join(' · ')}
            </p>
          </div>
          {known && remembered && (
            <button
              className="btn jaune block"
              onClick={() => {
                claimIdentity(code, remembered);
                setIdentity(remembered);
              }}
            >
              Reprendre en tant que {known.avatar} {known.name}
            </button>
          )}
          {room.status === 'lobby' && room.players.length < MAX_PLAYERS ? (
            <JoinForm
              title={known ? 'Ou un nouveau joueur' : 'Monte à bord !'}
              cta="Monter à bord 🚄"
              onSubmit={async (name, avatar) => {
                const r = await api.join(code, name, avatar);
                if (r.you) {
                  saveIdentity(code, r.you);
                  setIdentity(r.you);
                }
                accept(r);
              }}
            />
          ) : (
            <div className="panel">
              <h2>{room.status === 'lobby' ? 'La partie est complète' : 'Le train est déjà parti !'}</h2>
              <p>Tu peux regarder la partie en spectateur, ou créer ta propre partie.</p>
              <div style={{ display: 'grid', gap: 10 }}>
                <button className="btn block" onClick={() => setSpectate(true)}>
                  👀 Regarder
                </button>
                <button className="btn ghost block" onClick={() => navigate('/')}>
                  Créer une partie
                </button>
              </div>
            </div>
          )}
        </div>
        {toastEl}
      </div>
    );
  }

  return (
    <>
      {room.status === 'lobby' && <Lobby room={room} me={me} act={act} busy={busy} tv={tv} />}
      {room.status === 'playing' && <Game room={room} me={me} act={act} busy={busy} tv={tv} onLeave={leave} />}
      {room.status === 'ended' && <End key={room.startedAt} room={room} me={me} act={act} busy={busy} />}
      {toastEl}
    </>
  );
}

