import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { T } from '../../shared/engine';
import type { Player, Room } from '../../shared/types';
import { buzz, canSpeak, isMuted, setMuted, sfx, speakFrench } from '../fx';
import { navigate, serverNow } from '../hooks';
import type { Act } from './Dock';
import { Av, FlagFR, FlagUK, PHRASES, Sheet, TimeBar } from './ui';

const byId = (room: Room, id?: string) => room.players.find((p) => p.id === id);

// ─── « Anglais ! » ──────────────────────────────────────────

export function AccusePicker({ room, me, act, onClose }: { room: Room; me: Player; act: Act; onClose: () => void }) {
  const wait = Math.max(0, Math.ceil((me.accuseReadyAt - serverNow()) / 1000));
  return (
    <Sheet onClose={onClose} label="Accuser un joueur">
      <div className="sheet-head">
        <h2>
          <FlagUK size={26} /> Anglais ?!
        </h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      </div>
      <p>
        Quelqu’un a parlé anglais ? Accuse-le ! Les autres joueurs votent. Si la majorité est d’accord, il perd <b>1 🥐</b>.
      </p>
      {wait > 0 ? (
        <p className="error">Tu dois attendre encore {wait} s avant d’accuser quelqu’un.</p>
      ) : room.accusation ? (
        <p className="error">Un vote est déjà en cours !</p>
      ) : (
        <div className="picks">
          {room.players
            .filter((p) => p.id !== me.id)
            .map((p) => (
              <button
                key={p.id}
                className="pick"
                onClick={async () => {
                  if (await act({ type: 'accuse', target: p.id })) onClose();
                }}
              >
                <Av p={p} />
                {p.name}
              </button>
            ))}
        </div>
      )}
      <p className="muted" style={{ marginBottom: 0 }}>
        Attention : une accusation toutes les {T.accuseCooldown / 1000} secondes maximum. Sois juste !
      </p>
    </Sheet>
  );
}

export function AccusationModal({ room, me, act, busy }: { room: Room; me: Player | null; act: Act; busy: boolean }) {
  const a = room.accusation;
  const buzzed = useRef<number>(-1);
  useEffect(() => {
    if (a && buzzed.current !== a.id) {
      buzzed.current = a.id;
      sfx.whistle();
      buzz([80, 60, 80]);
    }
  }, [a]);
  if (!a) return null;
  const by = byId(room, a.by);
  const target = byId(room, a.target);
  if (!by || !target) return null;
  const isTarget = me?.id === a.target;
  const isAccuser = me?.id === a.by;
  const myVote = me ? a.votes[me.id] : undefined;
  const voters = room.players.filter((p) => p.id !== a.target);

  return (
    <Sheet label="Accusation">
      <div className="accuse-card">
        <div className="flags">
          <FlagUK size={40} /> ❓ <FlagFR size={40} />
        </div>
        <h2>{isTarget ? 'On t’accuse !' : `${target.name} a parlé anglais ?`}</h2>
        <p>
          <b>{by.name}</b> accuse <b>{target.name}</b> d’avoir parlé anglais.
        </p>
        <div style={{ textAlign: 'left' }}>
          <TimeBar deadline={a.deadline} total={T.accuse} />
        </div>
        {isTarget ? (
          <p className="say" style={{ justifyContent: 'center' }}>
            Défends-toi… en français ! <q>Ce n’est pas vrai ! J’ai parlé français !</q>
          </p>
        ) : isAccuser ? (
          <p className="muted">Les autres votent…</p>
        ) : me ? (
          <div className="vote-row">
            <button className={`btn ${myVote === true ? 'rouge' : 'ghost'}`} disabled={busy} onClick={() => act({ type: 'accuseVote', yes: true })}>
              Coupable !
            </button>
            <button className={`btn ${myVote === false ? 'vert' : 'ghost'}`} disabled={busy} onClick={() => act({ type: 'accuseVote', yes: false })}>
              Innocent(e)
            </button>
          </div>
        ) : null}
        <div className="voters" style={{ justifyContent: 'center' }}>
          {voters.map((p) => (
            <span key={p.id} className={`voter${p.id in a.votes ? ' done' : ''}`}>
              {p.avatar} {p.name} {p.id in a.votes ? '✓' : '…'}
            </span>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export function VerdictStamp({ room }: { room: Room }) {
  const v = room.lastVerdict;
  const [show, setShow] = useState<typeof v>(null);
  const seen = useRef(v?.id ?? -1);
  useEffect(() => {
    if (!v || v.id === seen.current) return;
    seen.current = v.id;
    if (serverNow() - v.at > 5000) return;
    setShow(v);
    sfx.stamp();
    if (v.guilty) sfx.bad();
    const t = setTimeout(() => setShow(null), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v?.id]);
  const target = show ? byId(room, show.target) : null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="verdict" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="stamp-big"
            style={{ color: show.guilty ? 'var(--no)' : 'var(--ok)' }}
            initial={{ scale: 3, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16 }}
          >
            {show.guilty ? 'Coupable !' : 'Innocent !'}
            <small>
              {target?.name} {show.guilty ? '−1 🥐' : 'a bien parlé français ✅'}
            </small>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Phrases utiles ─────────────────────────────────────────

export function PhrasesSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} label="Phrases utiles">
      <div className="sheet-head">
        <h2>💬 Phrases utiles</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      </div>
      <p className="muted">{canSpeak() ? 'Touche une phrase pour l’entendre. Puis dis-la à voix haute !' : 'Utilise ces phrases pendant le jeu !'}</p>
      <div className="phrases">
        {PHRASES.map((p) => (
          <button key={p} className="phrase" onClick={() => speakFrench(p, 0.9)}>
            {p}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

// ─── Menu ───────────────────────────────────────────────────

export function MenuSheet({
  room,
  me,
  act,
  onClose,
  onPhrases,
  onLeave,
}: {
  room: Room;
  me: Player | null;
  act: Act;
  onClose: () => void;
  onPhrases: () => void;
  onLeave: () => void;
}) {
  const [mute, setMute] = useState(isMuted());
  const [confirmEnd, setConfirmEnd] = useState(false);
  const isHost = me?.id === room.hostId;
  return (
    <Sheet onClose={onClose} label="Menu">
      <div className="sheet-head">
        <h2>Menu</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      </div>
      <div className="menu-list">
        <button className="btn ghost block" onClick={onPhrases}>
          💬 Phrases utiles
        </button>
        <a className="btn ghost block" href="/regles" target="_blank" rel="noreferrer">
          📜 Règles du jeu
        </a>
        <a className="btn ghost block" href="/aide" target="_blank" rel="noreferrer">
          🏠 Aide-mémoire
        </a>
        <a className="btn ghost block" href={`/tv/${room.code}`} target="_blank" rel="noreferrer">
          📺 Mode projecteur
        </a>
        <button
          className="btn ghost block"
          onClick={() => {
            setMuted(!mute);
            setMute(!mute);
          }}
        >
          {mute ? '🔇 Son coupé' : '🔊 Son activé'}
        </button>
        {isHost && room.status === 'playing' && (
          <>
            <div className="section-title">Hôte</div>
            {room.players
              .filter((p) => p.id !== me?.id)
              .map((p) => (
                <div key={p.id} className="seat" style={{ ['--pc' as string]: p.color }}>
                  <span className="av">{p.avatar}</span>
                  <span className="nm">{p.name}</span>
                  <button className="btn small ghost" style={{ marginLeft: 'auto' }} onClick={() => act({ type: 'kick', target: p.id })}>
                    Retirer
                  </button>
                </div>
              ))}
            {confirmEnd ? (
              <button
                className="btn rouge block"
                onClick={async () => {
                  await act({ type: 'endNow' });
                  onClose();
                }}
              >
                Oui, terminer maintenant
              </button>
            ) : (
              <button className="btn rouge block" onClick={() => setConfirmEnd(true)}>
                🏁 Terminer la partie
              </button>
            )}
          </>
        )}
        <div className="section-title">Partie {room.code}</div>
        <button className="btn ghost block" onClick={onLeave}>
          🚪 Quitter (cet appareil)
        </button>
        <button className="btn ghost block" onClick={() => navigate('/')}>
          🏡 Accueil
        </button>
      </div>
    </Sheet>
  );
}
