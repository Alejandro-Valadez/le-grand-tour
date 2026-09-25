import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { timersFor } from '../../shared/engine';
import type { Player, Room } from '../../shared/types';
import { buzz, canSpeak, isMuted, setMuted, sfx, speakFrench } from '../fx';
import { navigate, serverNow } from '../hooks';
import { useT } from '../peek';
import type { Act } from './Dock';
import { Av, FlagFR, FlagUK, PHRASES, Sheet, TimeBar } from './ui';

const byId = (room: Room, id?: string) => room.players.find((p) => p.id === id);

function CloseBtn({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <button className="icon-btn" onClick={onClose} aria-label={t('Fermer', 'Close')}>
      ✕
    </button>
  );
}

// ─── « Anglais ! » ──────────────────────────────────────────

export function AccusePicker({ room, me, act, onClose }: { room: Room; me: Player; act: Act; onClose: () => void }) {
  const t = useT();
  const wait = Math.max(0, Math.ceil((me.accuseReadyAt - serverNow()) / 1000));
  const tt = timersFor(room.durationMin);
  const penalty = room.mode === 'combat' ? t('10 PV', '10 HP') : '1 🥐';
  return (
    <Sheet onClose={onClose} label={t('Accuser un joueur', 'Accuse a player')}>
      <div className="sheet-head">
        <h2>
          <FlagUK size={26} /> {t('Anglais ?!', 'English?!')}
        </h2>
        <CloseBtn onClose={onClose} />
      </div>
      <p>
        {t('Quelqu’un a parlé anglais ? Accuse-le ! Les autres joueurs votent. Si la majorité est d’accord, il perd', 'Did someone speak English? Accuse them! The other players vote. If the majority agrees, they lose')} <b>{penalty}</b>.
      </p>
      {wait > 0 ? (
        <p className="error">{t(`Tu dois attendre encore ${wait} s avant d’accuser quelqu’un.`, `You have to wait ${wait} more seconds before accusing someone.`)}</p>
      ) : room.accusation ? (
        <p className="error">{t('Un vote est déjà en cours !', 'A vote is already happening!')}</p>
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
        {t(`Attention : une accusation toutes les ${tt.accuseCooldown / 1000} secondes maximum. Sois juste !`, `Careful: one accusation every ${tt.accuseCooldown / 1000} seconds at most. Be fair!`)}
      </p>
    </Sheet>
  );
}

export function AccusationModal({ room, me, act, busy }: { room: Room; me: Player | null; act: Act; busy: boolean }) {
  const t = useT();
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
    <Sheet label={t('Accusation', 'Accusation')}>
      <div className="accuse-card">
        <div className="flags">
          <FlagUK size={40} /> ❓ <FlagFR size={40} />
        </div>
        <h2>{isTarget ? t('On t’accuse !', 'You’re accused!') : t(`${target.name} a parlé anglais ?`, `Did ${target.name} speak English?`)}</h2>
        <p>{t(`${by.name} accuse ${target.name} d’avoir parlé anglais.`, `${by.name} accuses ${target.name} of speaking English.`)}</p>
        <div style={{ textAlign: 'left' }}>
          <TimeBar deadline={a.deadline} total={timersFor(room.durationMin).accuse} />
        </div>
        {isTarget ? (
          <p className="say" style={{ justifyContent: 'center' }}>
            {t('Défends-toi… en français !', 'Defend yourself… in French!')} <q lang="fr">Ce n’est pas vrai ! J’ai parlé français !</q>
          </p>
        ) : isAccuser ? (
          <p className="muted">{t('Les autres votent…', 'The others are voting…')}</p>
        ) : me ? (
          <div className="vote-row">
            <button className={`btn ${myVote === true ? 'rouge' : 'ghost'}`} disabled={busy} onClick={() => act({ type: 'accuseVote', yes: true })}>
              {t('Coupable !', 'Guilty!')}
            </button>
            <button className={`btn ${myVote === false ? 'vert' : 'ghost'}`} disabled={busy} onClick={() => act({ type: 'accuseVote', yes: false })}>
              {t('Innocent(e)', 'Not guilty')}
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
  const t = useT();
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
    const tm = setTimeout(() => setShow(null), 2600);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v?.id]);
  const target = show ? byId(room, show.target) : null;
  const penalty = room.mode === 'combat' ? t('−10 PV', '−10 HP') : '−1 🥐';
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
            {show.guilty ? t('Coupable !', 'Guilty!') : t('Innocent !', 'Not guilty!')}
            <small>
              {target?.name} {show.guilty ? penalty : t('a bien parlé français ✅', 'really spoke French ✅')}
            </small>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Phrases utiles ─────────────────────────────────────────

export function PhraseChips() {
  const t = useT();
  return (
    <div className="phrases">
      {PHRASES.map(([fr, en]) => (
        <button key={fr} className="phrase" onClick={() => speakFrench(fr, 0.9)} lang={t('fr', 'en')}>
          {t(fr, en)}
        </button>
      ))}
    </div>
  );
}

export function PhrasesSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <Sheet onClose={onClose} label={t('Phrases utiles', 'Useful phrases')}>
      <div className="sheet-head">
        <h2>💬 {t('Phrases utiles', 'Useful phrases')}</h2>
        <CloseBtn onClose={onClose} />
      </div>
      <p className="muted">
        {canSpeak()
          ? t('Touche une phrase pour l’entendre. Puis dis-la à voix haute !', 'Tap a phrase to hear it in French. Then say it out loud!')
          : t('Utilise ces phrases pendant le jeu !', 'Use these phrases during the game!')}
      </p>
      <PhraseChips />
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
  const t = useT();
  const [mute, setMute] = useState(isMuted());
  const [confirmEnd, setConfirmEnd] = useState(false);
  const isHost = me?.id === room.hostId;
  return (
    <Sheet onClose={onClose} label="Menu">
      <div className="sheet-head">
        <h2>Menu</h2>
        <CloseBtn onClose={onClose} />
      </div>
      <div className="menu-list">
        <button className="btn ghost block" onClick={onPhrases}>
          💬 {t('Phrases utiles', 'Useful phrases')}
        </button>
        <a className="btn ghost block" href="/regles" target="_blank" rel="noreferrer">
          📜 {t('Règles du jeu', 'Game rules')}
        </a>
        <a className="btn ghost block" href="/aide" target="_blank" rel="noreferrer">
          🏠 {t('Aide-mémoire', 'Cheat sheet')}
        </a>
        <a className="btn ghost block" href={`/tv/${room.code}`} target="_blank" rel="noreferrer">
          📺 {t('Mode projecteur', 'Projector mode')}
        </a>
        <button
          className="btn ghost block"
          onClick={() => {
            setMuted(!mute);
            setMute(!mute);
          }}
        >
          {mute ? t('🔇 Son coupé', '🔇 Sound off') : t('🔊 Son activé', '🔊 Sound on')}
        </button>
        {isHost && room.status === 'playing' && (
          <>
            <div className="section-title">{t('Hôte', 'Host')}</div>
            {room.players
              .filter((p) => p.id !== me?.id)
              .map((p) => (
                <div key={p.id} className="seat" style={{ ['--pc' as string]: p.color }}>
                  <span className="av">{p.avatar}</span>
                  <span className="nm">{p.name}</span>
                  <button className="btn small ghost" style={{ marginLeft: 'auto' }} onClick={() => act({ type: 'kick', target: p.id })}>
                    {t('Retirer', 'Remove')}
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
                {t('Oui, terminer maintenant', 'Yes, end it now')}
              </button>
            ) : (
              <button className="btn rouge block" onClick={() => setConfirmEnd(true)}>
                🏁 {t('Terminer la partie', 'End the game')}
              </button>
            )}
          </>
        )}
        <div className="section-title">
          {t('Partie', 'Game')} {room.code}
        </div>
        <button className="btn ghost block" onClick={onLeave}>
          🚪 {t('Quitter (cet appareil)', 'Leave (this device)')}
        </button>
        <button className="btn ghost block" onClick={() => navigate('/')}>
          🏡 {t('Accueil', 'Home')}
        </button>
      </div>
    </Sheet>
  );
}
