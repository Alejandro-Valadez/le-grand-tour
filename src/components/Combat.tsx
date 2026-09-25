// 🥊 Mode Combat : chaque bonne réponse frappe un adversaire. Barres de vie façon jeu de combat.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { COMBAT, damageFor } from '../../shared/engine';
import type { Fighter, Player, Room } from '../../shared/types';
import { buzz, sfx } from '../fx';
import { serverNow } from '../hooks';
import { useT } from '../peek';
import type { Act } from './Dock';
import { Explain, Options, QuizFace } from './Dock';
import { Av, Say } from './ui';

interface Props {
  room: Room;
  me: Player | null;
  act: Act;
  busy: boolean;
}

/** Renvoie un compteur qui change à chaque nouveau coup reçu (pour secouer la barre). */
function useFreshHit(f: Fighter | undefined) {
  const [shake, setShake] = useState(0);
  const seen = useRef(f?.lastHit?.id ?? -1);
  useEffect(() => {
    const h = f?.lastHit;
    if (!h || h.id === seen.current) return;
    seen.current = h.id;
    if (serverNow() - h.at < 2500) setShake((n) => n + 1);
  }, [f?.lastHit]);
  return shake;
}

function HpBar({ room, p, f, me, target, onPick, side }: { room: Room; p: Player; f: Fighter; me: Player | null; target: boolean; onPick?: () => void; side: 'left' | 'right' | 'row' }) {
  const t = useT();
  const shake = useFreshHit(f);
  const pct = Math.max(0, (f.hp / COMBAT.hp) * 100);
  const low = pct <= 25;
  const hit = f.lastHit;
  const hitter = hit ? room.players.find((q) => q.id === hit.by) : null;
  const ko = f.koAt > 0;
  return (
    <motion.button
      type="button"
      className={`fbar ${side}${target ? ' target' : ''}${ko ? ' ko' : ''}${p.id === me?.id ? ' mine' : ''}`}
      style={{ ['--pc' as string]: p.color }}
      onClick={onPick}
      disabled={!onPick}
      animate={shake ? { x: [0, -8, 7, -5, 3, 0] } : undefined}
      transition={{ duration: 0.35 }}
      key={`bar-${p.id}-${shake}`}
      aria-label={`${p.name} : ${f.hp} PV`}
    >
      <div className="fbar-head">
        <Av p={p} />
        <span className="nm">
          {p.name}
          {p.id === me?.id && <span className="me">{t('toi', 'you')}</span>}
        </span>
        {target && <span className="crosshair">🎯</span>}
      </div>
      <div className={`hp${low ? ' low' : ''}`}>
        <motion.i className="trail" animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.35 }} />
        <motion.i className="fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.15 }} />
      </div>
      <div className="fbar-foot">
        {f.combo >= 2 && !ko && <span className="combo-chip">🔥 ×{f.combo}</span>}
        <span className="muted">
          {f.hits} ✓ · {f.misses} ✗{f.kos ? ` · ${f.kos} K.O.` : ''}
        </span>
        <span className="hpnum">{ko ? 'K.O.' : `${f.hp} ${t('PV', 'HP')}`}</span>
      </div>
      <AnimatePresence>
        {shake > 0 && hit && serverNow() - hit.at < 1500 && (
          <motion.span
            key={hit.id}
            className={`dmg-pop${hit.by === p.id ? ' self' : ''}`}
            initial={{ y: 0, opacity: 1, scale: 0.6 }}
            animate={{ y: -34, opacity: 0, scale: 1.3 }}
            transition={{ duration: 1.1 }}
          >
            −{hit.dmg}
            {hitter && hitter.id !== p.id ? ` ${hitter.avatar}` : ''}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function Countdown({ startsAt }: { startsAt: number }) {
  const t = useT();
  const left = startsAt - serverNow();
  const n = Math.ceil(left / 1000);
  const label = n >= 4 ? t('ROUND 1', 'ROUND 1') : n >= 1 ? String(n) : t('COMBATTEZ !', 'FIGHT!');
  return (
    <div className="fight-intro">
      <motion.div key={label} initial={{ scale: 2.4, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }}>
        {label}
      </motion.div>
    </div>
  );
}

function MyFight({ room, me, act, busy, f }: Props & { me: Player; f: Fighter }) {
  const t = useT();
  const now = serverNow();
  const [pop, setPop] = useState<{ id: number; ok: boolean; dmg: number } | null>(null);
  const seen = useRef(f.lastResult?.id ?? -1);

  useEffect(() => {
    const r = f.lastResult;
    if (!r || r.id === seen.current) return;
    seen.current = r.id;
    setPop({ id: r.id, ok: r.ok, dmg: r.dmg });
    if (r.ok) sfx.stamp();
    else {
      sfx.bad();
      buzz(120);
    }
    const tm = setTimeout(() => setPop((p) => (p?.id === r.id ? null : p)), 900);
    return () => clearTimeout(tm);
  }, [f.lastResult]);

  // Coup reçu d'un adversaire : flash rouge + vibration.
  const hitSeen = useRef(f.lastHit?.id ?? -1);
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    const h = f.lastHit;
    if (!h || h.id === hitSeen.current) return;
    hitSeen.current = h.id;
    if (h.by !== me.id && serverNow() - h.at < 2500) {
      setFlash((n) => n + 1);
      buzz([60, 40, 60]);
    }
  }, [f.lastHit, me.id]);

  if (f.koAt) {
    return (
      <div className="ko-panel">
        <div className="ko-word">K.O.</div>
        <p>{t('Tu es au tapis ! Regarde la fin du combat…', 'You’re down! Watch the end of the fight…')}</p>
        <Say>
          <q lang="fr">Bien joué… La prochaine fois, je gagne !</q>
          {t(null, <span className="gloss"> — Well played… Next time, I win!</span>)}
        </Say>
      </div>
    );
  }

  const stunned = now < f.stunUntil;
  const last = f.lastResult;
  const next = damageFor(f.combo, false);
  return (
    <div className="fight-card">
      <AnimatePresence>
        {flash > 0 && <motion.div key={flash} className="hit-flash" initial={{ opacity: 0.55 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} />}
      </AnimatePresence>
      <div className="fight-meta">
        <span className={`combo-meter${f.combo >= 3 ? ' hot' : ''}`}>
          {f.combo >= COMBAT.comboMax ? t('🔥 SUPER COMBO', '🔥 SUPER COMBO') : `${t('Combo', 'Combo')} ×${f.combo}`}
        </span>
        <span className="muted">
          {t('Prochain coup', 'Next hit')} : <b>{next}</b>–<b>{next + COMBAT.speedBonus}</b>
        </span>
      </div>
      <div className="fight-q" key={f.q.id + f.qAt}>
        <QuizFace card={f.q}>
          <Options card={f.q} disabled={busy || stunned} onPick={(i) => act({ type: 'fight', choice: i })} />
        </QuizFace>
        {stunned && last && !last.ok && (
          <motion.div className="stun" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="stun-title">💫 {t('Étourdi(e) !', 'Stunned!')}</div>
            <p>
              {t('La bonne réponse :', 'The right answer:')} <b lang="fr">{last.card.options[last.card.answer]}</b>
            </p>
            <Explain card={last.card} />
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {pop && (
          <motion.div
            key={pop.id}
            className={`pow${pop.ok ? '' : ' miss'}`}
            initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: -6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 14 }}
          >
            {pop.ok ? t(`POW ! −${pop.dmg}`, `POW! −${pop.dmg}`) : t(`RATÉ ! −${pop.dmg} PV`, `MISS! −${pop.dmg} HP`)}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="muted fight-tip">
        {t('Réponds vite : +4 dégâts si tu réponds en moins de 3 s. Une erreur = −5 PV et 1,5 s d’étourdissement.', 'Answer fast: +4 damage if you answer in under 3 s. A mistake = −5 HP and 1.5 s stunned.')}
      </p>
    </div>
  );
}

export function CombatView({ room, me, act, busy }: Props) {
  const t = useT();
  const c = room.combat;
  if (!c) return null;
  const now = serverNow();
  const fighters = room.players.filter((p) => c.fighters[p.id]);
  const mine = me ? c.fighters[me.id] : undefined;
  const two = fighters.length === 2;
  const myTarget = me && mine ? targetFor(room, me.id) : null;
  const canPick = !!me && !!mine && !mine.koAt && fighters.length > 2;

  const bar = (p: Player, side: 'left' | 'right' | 'row') => (
    <HpBar
      key={p.id}
      room={room}
      p={p}
      f={c.fighters[p.id]}
      me={me}
      side={side}
      target={myTarget === p.id}
      onPick={canPick && p.id !== me?.id && !c.fighters[p.id].koAt ? () => act({ type: 'target', target: p.id }) : undefined}
    />
  );

  return (
    <div className="arena">
      <div className={`fbars${two ? ' vs-mode' : ''}`}>
        {two ? (
          <>
            {bar(fighters[0], 'left')}
            <div className="vs">VS</div>
            {bar(fighters[1], 'right')}
          </>
        ) : (
          fighters.map((p) => bar(p, 'row'))
        )}
      </div>
      {canPick && <p className="target-hint">{t('Touche un adversaire pour le viser 🎯', 'Tap an opponent to target them 🎯')}</p>}
      <div className="arena-main">
        {now < c.startsAt ? (
          <Countdown startsAt={c.startsAt} />
        ) : me && mine ? (
          <MyFight room={room} me={me} act={act} busy={busy} f={mine} />
        ) : (
          <div className="ko-panel">
            <div className="ko-word" style={{ fontSize: '3rem' }}>
              🥊
            </div>
            <p>{t('Tu regardes le combat. Qui restera debout ?', 'You’re watching the fight. Who will be left standing?')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Même logique de cible que le serveur (pour afficher le 🎯). */
function targetFor(room: Room, pid: string): string | null {
  const fs = room.combat!.fighters;
  const me = fs[pid];
  if (me.target && me.target !== pid && fs[me.target]?.koAt === 0) return me.target;
  const opp = room.players.map((p) => p.id).filter((id) => id !== pid && fs[id] && fs[id].koAt === 0);
  if (!opp.length) return null;
  return opp.sort((a, b) => fs[b].hp - fs[a].hp)[0];
}
