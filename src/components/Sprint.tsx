// ⚡ Mode Sprint : tout le monde reçoit la même question ; le premier qui trouve gagne 3 points.
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { SPRINT } from '../../shared/engine';
import type { Player, Room } from '../../shared/types';
import { sfx } from '../fx';
import { serverNow } from '../hooks';
import { useT } from '../peek';
import type { Act } from './Dock';
import { Explain, Options, QuizFace } from './Dock';
import { Av, Say, Ticket, TimeBar } from './ui';

export function SprintView({ room, me, act, busy }: { room: Room; me: Player | null; act: Act; busy: boolean }) {
  const t = useT();
  const s = room.sprint;
  const revealed = s?.revealUntil ?? 0;
  const seenReveal = useRef(0);
  useEffect(() => {
    if (!s || !revealed || seenReveal.current === s.round) return;
    seenReveal.current = s.round;
    const mine = me ? s.answers[me.id] : undefined;
    if (mine?.ok) sfx.good();
    else sfx.bad();
  }, [revealed, s, me]);
  if (!s) return null;

  const now = serverNow();
  const ranked = [...room.players].sort((a, b) => b.score - a.score);
  const mine = me ? s.answers[me.id] : undefined;
  const first = room.players.find((p) => p.id === s.firstId);
  const answered = Object.keys(s.answers).length;

  if (now < s.startsAt) {
    const n = Math.ceil((s.startsAt - now) / 1000);
    return (
      <div className="sprint">
        <div className="fight-intro sprint-intro">
          <motion.div key={n} initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {n >= 4 ? '⚡' : n >= 1 ? n : t('PARTEZ !', 'GO!')}
          </motion.div>
        </div>
      </div>
    );
  }

  const wrong = revealed ? Object.values(s.answers).filter((a) => !a.ok).map((a) => a.choice) : [];
  return (
    <div className="sprint">
      <div className="sprint-board">
        {ranked.map((p, i) => {
          const a = s.answers[p.id];
          return (
            <div key={p.id} className={`sprint-row${p.id === me?.id ? ' mine' : ''}`} style={{ ['--pc' as string]: p.color }}>
              <span className="pos">{i + 1}</span>
              <Av p={p} />
              <span className="nm">{p.name}</span>
              <span className="state">{a ? (revealed ? (a.ok ? `✓ +${a.pts}` : '✗') : '✋') : '…'}</span>
              <span className="pts">{p.score}</span>
            </div>
          );
        })}
      </div>

      <Ticket kind={s.q.cat} seed={`${s.q.id}-${s.round}`} title={t(`⚡ Question ${s.round}`, `⚡ Question ${s.round}`)} stamp={revealed ? (first ? { ok: true, text: `⚡ ${first.name}` } : { ok: false, text: t('Personne', 'Nobody') }) : null}>
        <QuizFace card={s.q}>
          {!revealed && <TimeBar deadline={s.deadline} total={SPRINT.question} />}
          <Options
            key={s.round}
            card={s.q}
            disabled={!me || !!mine || !!revealed || busy}
            picked={mine && !revealed ? mine.choice : null}
            reveal={revealed ? { answer: s.q.answer, wrong } : undefined}
            onPick={(i) => act({ type: 'sprintAnswer', choice: i })}
          />
          {revealed ? <Explain card={s.q} /> : null}
        </QuizFace>
      </Ticket>

      {revealed ? (
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          {t(`Question suivante dans ${Math.max(0, Math.ceil((revealed - now) / 1000))} s`, `Next question in ${Math.max(0, Math.ceil((revealed - now) / 1000))} s`)}
        </p>
      ) : (
        <Say label={mine ? t('Envoyé', 'Sent') : undefined}>
          {mine ? t(`Réponse envoyée ! ${answered}/${room.players.length} ont répondu.`, `Answer sent! ${answered}/${room.players.length} have answered.`) : t('Le premier qui trouve gagne 3 points, les autres 1 point.', 'First correct answer wins 3 points, the others 1 point.')}
        </Say>
      )}
    </div>
  );
}
