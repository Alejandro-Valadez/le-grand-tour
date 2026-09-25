import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AVATARS, DURATIONS, isFast, MAX_PLAYERS, MODES } from '../../shared/engine';
import type { Action, Player, Room } from '../../shared/types';
import { api, ApiError, claimIdentity, forgetIdentity, getIdentity, saveIdentity, type Identity } from '../api';
import { Board } from '../components/Board';
import { CombatView } from '../components/Combat';
import { cardOpen, Dock, type Act } from '../components/Dock';
import { AccusationModal, AccusePicker, MenuSheet, PhrasesSheet, VerdictStamp } from '../components/Overlays';
import { SprintView } from '../components/Sprint';
import { Av, Flap, FlagUK, Logo, MODE_INFO, Qr, Say } from '../components/ui';
import { buzz, sfx } from '../fx';
import { navigate, useRoom, useTick } from '../hooks';
import { useT } from '../peek';

// ─── Rejoindre ──────────────────────────────────────────────

export function JoinForm({
  title,
  cta,
  onSubmit,
  children,
}: {
  title: ReactNode;
  cta: ReactNode;
  onSubmit: (name: string, avatar: string) => Promise<void>;
  children?: ReactNode;
}) {
  const t = useT();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * 6)]);
  const [err, setErr] = useState<{ fr: string; en: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel"
      style={{ display: 'grid', gap: 16 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setErr({ fr: 'Écris ton prénom !', en: 'Type your first name!' });
        setBusy(true);
        setErr(null);
        try {
          await onSubmit(name.trim(), avatar);
        } catch (e) {
          if (e instanceof ApiError) setErr({ fr: e.message, en: e.en });
          else setErr({ fr: 'Erreur', en: 'Error' });
          setBusy(false);
        }
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      {children}
      <div className="field">
        <label htmlFor="nm">{t('Ton prénom', 'Your first name')}</label>
        <input id="nm" className="input" value={name} maxLength={16} autoComplete="given-name" placeholder={t('Ex. : Camille', 'E.g. Camille')} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>{t('Ton pion', 'Your game piece')}</label>
        <div className="avatars" role="radiogroup" aria-label={t('Choisis ton pion', 'Pick your game piece')}>
          {AVATARS.map((a) => (
            <button type="button" key={a} role="radio" aria-checked={a === avatar} className={a === avatar ? 'on' : ''} onClick={() => setAvatar(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>
      {err && <div className="error">{t(err.fr, err.en)}</div>}
      <button className="btn rouge block" disabled={busy}>
        {busy ? t('Un instant…', 'One moment…') : cta}
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

// ─── Comment jouer (par mode) ───────────────────────────────

function HowTo({ mode }: { mode: Room['mode'] }) {
  const t = useT();
  const golden = (
    <li>
      {t(
        <>
          <b>Règle d’or :</b> on parle <b>français</b>. Quelqu’un parle anglais ? Appuie sur{' '}
          <b>
            <FlagUK size={15} /> Anglais !
          </b>
        </>,
        <>
          <b>Golden rule:</b> speak <b>French</b>. Someone spoke English? Press{' '}
          <b>
            <FlagUK size={15} /> Anglais !
          </b>
        </>,
      )}
    </li>
  );
  const peek = <li>{t('Maintiens 👀 English pour lire l’écran en anglais une seconde.', 'Hold 👀 English to read the screen in English for a moment.')}</li>;
  if (mode === 'combat') {
    return (
      <ol className="steps">
        <li>{t('Chacun joue sur son téléphone : tout le monde répond en même temps !', 'Everyone plays on their own phone — all at the same time!')}</li>
        <li>{t('Bonne réponse = tu frappes ton adversaire (10 dégâts, plus avec les combos et la vitesse).', 'Right answer = you hit your opponent (10 damage, more with combos and speed).')}</li>
        <li>{t('Mauvaise réponse = −5 PV et tu es étourdi(e) 1,5 seconde.', 'Wrong answer = −5 HP and you’re stunned for 1.5 seconds.')}</li>
        <li>{t('À 3 joueurs ou plus, touche la barre d’un adversaire pour le viser 🎯.', 'With 3+ players, tap an opponent’s bar to target them 🎯.')}</li>
        <li>{t('Le dernier debout gagne — ou celui qui a le plus de PV à la fin.', 'Last one standing wins — or whoever has the most HP at the end.')}</li>
        {golden}
        {peek}
      </ol>
    );
  }
  if (mode === 'sprint') {
    return (
      <ol className="steps">
        <li>{t('Tout le monde reçoit la même question en même temps.', 'Everyone gets the same question at the same time.')}</li>
        <li>{t('Le premier qui trouve gagne 3 points ; les autres bonnes réponses, 1 point.', 'The first correct answer wins 3 points; other correct answers get 1 point.')}</li>
        <li>{t('Un seul essai par question, et 10 secondes.', 'One try per question, and 10 seconds.')}</li>
        <li>{t('Après chaque question, lisez l’explication ensemble… en français !', 'After each question, read the explanation together… in French!')}</li>
        {golden}
        {peek}
      </ol>
    );
  }
  return (
    <ol className="steps">
      <li>{t('Chacun rejoint la partie sur son téléphone.', 'Everyone joins the game on their phone.')}</li>
      <li>{t('À ton tour, lance le dé et avance sur l’Hexagone.', 'On your turn, roll the die and move around the Hexagon.')}</li>
      <li>{t('Réponds à la carte : participes passés, être ou avoir, PC ou imparfait, vocabulaire…', 'Answer the card: past participles, être or avoir, PC or imparfait, vocabulary…')}</li>
      <li>{t('Sur les cases 🎤 et ☕, tu parles et les autres votent.', 'On the 🎤 and ☕ spaces, you talk and the others vote.')}</li>
      <li>{t('Gagne des croissants 🥐. Quand le temps est écoulé, le plus gros tas gagne !', 'Win croissants 🥐. When time runs out, the biggest pile wins!')}</li>
      {golden}
      {peek}
    </ol>
  );
}

// ─── Salle d’attente ────────────────────────────────────────

function Lobby({ room, me, act, busy, tv }: { room: Room; me: Player | null; act: Act; busy: boolean; tv: boolean }) {
  const t = useT();
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
  const info = MODE_INFO[room.mode];
  return (
    <div className="lobby">
      <SimpleBar
        right={
          <a className="btn small ghost" href="/regles" target="_blank" rel="noreferrer">
            📜 {t('Règles', 'Rules')}
          </a>
        }
      />
      <div className="lobby-grid">
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="ticket boarding">
            <div className="ticket-stub" aria-hidden>
              <span className="ico">🚄</span>
              <span className="vert">{t('Carte d’embarquement', 'Boarding pass')}</span>
              <span className="ico">🥐</span>
            </div>
            <div className="ticket-body">
              <span className="kicker">{t('Code de la partie', 'Game code')}</span>
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
                  <span className="muted">{t('Scanne ou va sur :', 'Scan or go to:')}</span>
                  <span className="link-line">{link.replace(/^https?:\/\//, '')}</span>
                  {!tv && (
                    <button className="btn small ghost" onClick={share}>
                      {copied ? t('Lien copié ✓', 'Link copied ✓') : t('📤 Partager', '📤 Share')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>{t('Comment jouer ?', 'How to play')}</h2>
            <HowTo mode={room.mode} />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="panel">
            <h2>{t('Mode de jeu', 'Game mode')}</h2>
            <div className="modes">
              {MODES.map((m) => {
                const mi = MODE_INFO[m];
                const on = room.mode === m;
                return (
                  <button key={m} className={`mode-card ${m}${on ? ' on' : ''}`} disabled={!isHost || busy} onClick={() => !on && act({ type: 'setMode', mode: m })} aria-pressed={on}>
                    <span className="mode-ico">{mi.icon}</span>
                    <span className="mode-txt">
                      <b>{t(mi.fr.name, mi.en.name)}</b>
                      <small>{t(mi.fr.tag, mi.en.tag)}</small>
                    </span>
                    {on && <span className="mode-check">✓</span>}
                  </button>
                );
              })}
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              {info.icon} {t(info.fr.desc, info.en.desc)}
            </p>
          </div>

          <div className="panel">
            <h2>
              {t('Passagers', 'Passengers')} <span className="muted">({room.players.length}/{MAX_PLAYERS})</span>
            </h2>
            <div className="seats">
              <AnimatePresence>
                {seats.map((p, i) =>
                  p ? (
                    <motion.div key={p.id} className="seat" style={{ ['--pc' as string]: p.color }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <span className="av">{p.avatar}</span>
                      <span className="nm">
                        {p.name} {p.id === me?.id && <small className="muted">{t('(toi)', '(you)')}</small>}
                      </span>
                      <span className="role">{p.id === room.hostId ? t('Hôte', 'Host') : t(`Siège ${i + 1}`, `Seat ${i + 1}`)}</span>
                      {isHost && p.id !== me?.id && (
                        <button className="kick" aria-label={t(`Retirer ${p.name}`, `Remove ${p.name}`)} onClick={() => act({ type: 'kick', target: p.id })}>
                          ✕
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <div key={`e${i}`} className="seat empty">
                      <span className="av">·</span>
                      <span>{t('Place libre', 'Empty seat')}</span>
                    </div>
                  ),
                )}
              </AnimatePresence>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              {room.mode === 'combat' ? t('Idéal : 2 joueurs (1 contre 1) ou tous contre tous jusqu’à 6.', 'Best: 2 players (1 vs 1), or free-for-all up to 6.') : t('Idéal : 4 joueurs. Minimum : 2.', 'Best: 4 players. Minimum: 2.')}
            </p>
          </div>

          <div className="panel">
            <h2>{t('Durée', 'Length')}</h2>
            <div className="durations">
              {DURATIONS[room.mode].map((m) => (
                <button key={m} className={`chip-btn${room.durationMin === m ? ' on' : ''}`} disabled={!isHost || busy} onClick={() => act({ type: 'setDuration', durationMin: m })}>
                  {m} min
                </button>
              ))}
            </div>
            {room.mode === 'plateau' && isFast(room.durationMin) && (
              <p className="muted" style={{ marginBottom: 0 }}>
                ⚡ {t('Partie éclair : les délais sont plus courts !', 'Speed round: shorter timers!')}
              </p>
            )}
            <div style={{ marginTop: 16 }}>
              {isHost ? (
                <button className="btn rouge huge block" disabled={busy || room.players.length < 2} onClick={() => act({ type: 'start', durationMin: room.durationMin })}>
                  {room.players.length < 2 ? t('En attente de joueurs…', 'Waiting for players…') : room.mode === 'combat' ? t('En garde ! 🥊', 'Fight! 🥊') : room.mode === 'sprint' ? t('À vos marques ! ⚡', 'Ready, set… ⚡') : t('En voiture ! ▶', 'All aboard! ▶')}
                </button>
              ) : (
                <Say label={t('Attente', 'Waiting')}>
                  <q lang="fr">On attend l’hôte… Tu es prêt(e) ?</q>
                  {t(null, <span className="gloss"> — Waiting for the host… Are you ready?</span>)}
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
  const t = useT();
  const fs = room.combat?.fighters;
  const combat = room.mode === 'combat' && !!fs;
  const ranked = useMemo(() => {
    const ps = [...room.players];
    if (combat) {
      const f = (p: Player) => fs![p.id];
      const standing = (p: Player) => (f(p).koAt === 0 ? 1 : 0);
      // Debout d’abord, puis PV, puis K.O. le plus tardif, puis dégâts infligés.
      return ps.filter((p) => f(p)).sort((a, b) => standing(b) - standing(a) || f(b).hp - f(a).hp || f(b).koAt - f(a).koAt || f(b).dmg - f(a).dmg);
    }
    return ps.sort((a, b) => b.score - a.score || b.stats.right - a.stats.right);
  }, [room.players, combat, fs]);
  const valueOf = (p: Player) => (combat ? fs![p.id].hp : p.score);
  const unit = combat ? t('PV', 'HP') : room.mode === 'sprint' ? 'pts' : '🥐';
  const winners = combat ? ranked.filter((p) => room.combat!.winners.includes(p.id)) : ranked.filter((p) => valueOf(p) === valueOf(ranked[0]));
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
  const plural = (n: number, fr: string, en: string) => t(`${n} ${fr}${n > 1 ? 's' : ''}`, `${n} ${en}${n === 1 ? '' : 's'}`);
  const stats = (p: Player) => {
    if (combat) {
      const f = fs![p.id];
      return `🥊 ${plural(f.hits, 'coup', 'hit')} · 🔥 ${t('combo max', 'best combo')} ×${f.bestCombo} · 💥 ${f.kos} K.O. · ${f.dmg} ${t('dégâts', 'damage')}`;
    }
    if (room.mode === 'sprint') return `✅ ${plural(p.stats.right, 'bonne réponse', 'right answer')} · ❌ ${p.stats.wrong}`;
    return `✅ ${plural(p.stats.right, 'bonne réponse', 'right answer')} · 🦊 ${plural(p.stats.steals, 'vol', 'steal')} · 🎤 ${plural(p.stats.spoke, 'prise de parole', 'time speaking')}`;
  };

  return (
    <div className="end">
      <SimpleBar />
      <div className="end-inner">
        <div style={{ textAlign: 'center' }}>
          <span className="kicker">{combat ? t('Fin du combat !', 'Fight over!') : t('Terminus · tout le monde descend !', 'Last stop · everybody off!')}</span>
          <h1>
            {winners.length > 1 ? t('Égalité !', 'It’s a tie!') : t('Victoire de', 'Victory for')}
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
                <span className="score">
                  {combat && fs![p.id].koAt ? 'K.O.' : valueOf(p)} {combat && fs![p.id].koAt ? '' : unit}
                </span>
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
                <div className="stats">{stats(p)}</div>
              </div>
              <span className="sc">
                {combat && fs![p.id].koAt ? 'K.O.' : `${valueOf(p)} ${unit}`}
              </span>
            </div>
          ))}
        </div>
        <Say label={t('Pour finir', 'To wrap up')}>
          {t('Chacun dit une chose qu’il a apprise :', 'Everyone says one thing they learned:')} <q lang="fr">Aujourd’hui, j’ai appris que…</q>
        </Say>
        {isHost ? (
          <button className="btn rouge huge block" disabled={busy} onClick={() => act({ type: 'restart' })}>
            {combat ? t('Revanche ! ↻', 'Rematch! ↻') : t('Nouvelle partie ↻', 'New game ↻')}
          </button>
        ) : (
          <p className="muted" style={{ textAlign: 'center' }}>
            {t('L’hôte peut relancer une nouvelle partie.', 'The host can start a new game.')}
          </p>
        )}
        <button className="btn ghost block" onClick={() => navigate('/')}>
          {t('Retour à l’accueil', 'Back to home')}
        </button>
      </div>
    </div>
  );
}

// ─── Partie en cours ────────────────────────────────────────

function Game({ room, me, act, busy, tv, onLeave }: { room: Room; me: Player | null; act: Act; busy: boolean; tv: boolean; onLeave: () => void }) {
  const t = useT();
  const now = useTick(250);
  const [menu, setMenu] = useState(false);
  const [phrases, setPhrases] = useState(false);
  const [accuse, setAccuse] = useState(false);
  const plateau = room.mode === 'plateau';
  const introEnd = room.combat?.startsAt ?? room.sprint?.startsAt ?? 0;
  const left = now < introEnd ? room.durationMin * 60_000 : room.endsAt - now;
  const open = plateau && cardOpen(room);
  const activeId = plateau ? room.turn?.pid : undefined;

  // Le bouton 👀 English se place au-dessus des boutons flottants.
  useEffect(() => {
    if (!me || tv) return;
    document.documentElement.classList.add('has-fab');
    return () => document.documentElement.classList.remove('has-fab');
  }, [me, tv]);

  // Sons & vibrations (plateau)
  const prevKey = useRef('');
  useEffect(() => {
    const tr = room.turn;
    if (!tr) return;
    const key = `${tr.phase}:${tr.pid}:${'deadline' in tr ? tr.deadline : ''}`;
    if (key === prevKey.current) return;
    const firstRun = prevKey.current === '';
    prevKey.current = key;
    if (firstRun) return;
    if (tr.phase === 'roll' && me && tr.pid === me.id) {
      sfx.chime();
      buzz([120, 80, 120]);
    }
    if (tr.phase === 'reveal') {
      sfx.stamp();
      const o = tr.outcome;
      const good = o.kind === 'quiz' ? o.correct || !!o.stealer : o.kind === 'duel' ? !!o.winner : o.kind === 'speak' ? o.gained > 0 : o.winners.length > 0;
      setTimeout(() => (good ? sfx.good() : sfx.bad()), 150);
    }
    if (tr.phase === 'steal' && me && tr.pid !== me.id) buzz(60);
    if (tr.phase === 'tgv') sfx.whistle();
  }, [room.turn, me]);

  const recent = room.log.slice(plateau ? -6 : -4).reverse();
  const fmt = (at: number) => new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const feed = (
    <>
      <div className="section-title">{t('Journal de bord', 'Logbook')}</div>
      <ul className="feed">
        {recent.map((l) => (
          <li key={l.id} className={l.tone}>
            <time>{fmt(l.at)}</time>
            <span>{t(l.text, l.en ?? l.text)}</span>
          </li>
        ))}
      </ul>
      <span className="credit">{t('Le Grand Tour · conçu par Alejandro & Krithik · Français III', 'Le Grand Tour · made by Alejandro & Krithik · French III')}</span>
    </>
  );

  return (
    <div className={`game mode-${room.mode}`}>
      <header className="topbar">
        <Logo size={30} />
        <span className="code-chip">
          <small>Code</small>
          {room.code}
        </span>
        <span className="mode-pill">
          {MODE_INFO[room.mode].icon} {t(MODE_INFO[room.mode].fr.name, MODE_INFO[room.mode].en.name)}
        </span>
        <span className="spacer" />
        {left > 0 ? <Flap ms={left} /> : <span className="sign" style={{ color: 'var(--moutarde)' }}>{t('Dernier tour !', 'Last turn!')}</span>}
        {!tv && (
          <button className="icon-btn" aria-label="Menu" onClick={() => setMenu(true)}>
            ☰
          </button>
        )}
      </header>

      {plateau && (
        <nav className="players" aria-label={t('Joueurs et scores', 'Players and scores')}>
          {room.players.map((p) => (
            <div key={p.id} className={`pchip${p.id === activeId ? ' active' : ''}`}>
              <Av p={p} />
              <span className="nm">{p.name}</span>
              {p.id === me?.id && <span className="me">{t('toi', 'you')}</span>}
              {p.skip && (
                <span className="skip" title={t('Passe son prochain tour', 'Skips next turn')}>
                  🚗
                </span>
              )}
              <motion.span key={p.score} className="sc" initial={{ scale: 1.6, color: '#d7263d' }} animate={{ scale: 1, color: '#14213d' }}>
                {p.score}🥐
              </motion.span>
            </div>
          ))}
        </nav>
      )}

      {plateau ? (
        <main className="stage">
          <div className={`board-area${open && !tv ? ' compact' : ''}`}>
            <Board room={room} spin={tv} />
          </div>
          <div className="dock">
            <div className="dock-inner">
              <Dock room={room} me={me} act={act} busy={busy} />
              {!me && !tv && <Say label={t('Spectateur', 'Spectator')}>{t('Tu regardes la partie.', 'You’re watching the game.')}</Say>}
              {feed}
            </div>
          </div>
        </main>
      ) : (
        <main className="stage solo">
          <div className="solo-inner">
            {room.mode === 'combat' ? <CombatView room={room} me={me} act={act} busy={busy} /> : <SprintView room={room} me={me} act={act} busy={busy} />}
            {feed}
          </div>
        </main>
      )}

      {me && !tv && (
        <div className="fab-row">
          <button className="fab english" onClick={() => setAccuse(true)} disabled={!!room.accusation}>
            <FlagUK size={18} /> Anglais !
          </button>
          <button className="fab" onClick={() => setPhrases(true)}>
            💬 {t('Phrases', 'Phrases')}
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
  const t = useT();
  const { room, error, offline, accept } = useRoom(code);
  // Le mode projecteur est toujours spectateur, même sur l’appareil d’un joueur.
  const [identity, setIdentity] = useState<Identity | null>(() => (tv ? null : getIdentity(code).mine));
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ id: number; fr: string; en: string } | null>(null);
  const [spectate, setSpectate] = useState(tv);

  const me = useMemo(() => (identity && room ? room.players.find((p) => p.id === identity.id) ?? null : null), [identity, room]);

  const say = useCallback((fr: string, en: string) => {
    const id = Date.now();
    setToast({ id, fr, en });
    setTimeout(() => setToast((x) => (x?.id === id ? null : x)), 2800);
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
          say(e.message, e.en);
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
            {t(toast.fr, toast.en)}
          </motion.div>
        )}
        {offline && (
          <motion.div key="off" className="toast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {t('📡 Connexion perdue… on réessaie.', '📡 Connection lost… retrying.')}
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
          {t('Partie introuvable', 'Game not found')}
        </h1>
        <p className="muted">{t(`Le code ${code} n’existe pas (ou la partie est terminée depuis longtemps).`, `The code ${code} doesn’t exist (or the game ended a long time ago).`)}</p>
        <button className="btn rouge" onClick={() => navigate('/')}>
          {t('Retour à l’accueil', 'Back to home')}
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="loading">
        <div className="train-loader">🚂💨</div>
        <p className="kicker">{t('Le train entre en gare…', 'The train is pulling into the station…')}</p>
      </div>
    );
  }

  if (!me && !spectate) {
    const { remembered } = getIdentity(code);
    const known = remembered ? room.players.find((p) => p.id === remembered.id) : null;
    const mi = MODE_INFO[room.mode];
    return (
      <div className="lobby">
        <SimpleBar />
        <div className="join">
          <div style={{ textAlign: 'center' }}>
            <span className="kicker">
              {t('Partie', 'Game')} · {mi.icon} {t(mi.fr.name, mi.en.name)}
            </span>
            <h1 className="display" style={{ fontSize: '3.4rem', margin: '4px 0', letterSpacing: '0.12em' }}>
              {room.code}
            </h1>
            <p className="muted" style={{ margin: 0 }}>
              {t(`${room.players.length} passager${room.players.length > 1 ? 's' : ''} à bord :`, `${room.players.length} passenger${room.players.length > 1 ? 's' : ''} on board:`)} {room.players.map((p) => `${p.avatar} ${p.name}`).join(' · ')}
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
              {t('Reprendre en tant que', 'Continue as')} {known.avatar} {known.name}
            </button>
          )}
          {room.status === 'lobby' && room.players.length < MAX_PLAYERS ? (
            <JoinForm
              title={known ? t('Ou un nouveau joueur', 'Or a new player') : t('Monte à bord !', 'Hop on board!')}
              cta={t('Monter à bord 🚄', 'Get on board 🚄')}
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
              <h2>{room.status === 'lobby' ? t('La partie est complète', 'The game is full') : t('Le train est déjà parti !', 'The train has already left!')}</h2>
              <p>{t('Tu peux regarder la partie en spectateur, ou créer ta propre partie.', 'You can watch as a spectator, or create your own game.')}</p>
              <div style={{ display: 'grid', gap: 10 }}>
                <button className="btn block" onClick={() => setSpectate(true)}>
                  👀 {t('Regarder', 'Watch')}
                </button>
                <button className="btn ghost block" onClick={() => navigate('/')}>
                  {t('Créer une partie', 'Create a game')}
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

