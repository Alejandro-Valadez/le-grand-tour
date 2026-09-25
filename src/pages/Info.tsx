import type { ReactNode } from 'react';
import { KINDS } from '../../shared/board';
import { ETRE_CARDS, EVENT_CARDS, PP_CARDS, SPEAK_CARDS, TABLE_CARDS, TEMPS_CARDS, VOCAB_CARDS } from '../../shared/cards';
import { COMBAT, FAST, POINTS, SPRINT, T } from '../../shared/engine';
import type { SpaceKind } from '../../shared/types';
import { PhraseChips } from '../components/Overlays';
import { FlagUK, Logo, MODE_INFO } from '../components/ui';
import { canSpeak } from '../fx';
import { navigate } from '../hooks';
import { useT } from '../peek';

function DocShell({ kicker, title, intro, children }: { kicker: ReactNode; title: ReactNode; intro: ReactNode; children: ReactNode }) {
  const t = useT();
  return (
    <div>
      <header className="home-bar">
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
        <nav className="home-links">
          <button className="btn small ghost" onClick={() => navigate('/regles')}>
            📜 {t('Règles', 'Rules')}
          </button>
          <button className="btn small ghost" onClick={() => navigate('/aide')}>
            🏠 {t('Aide', 'Help')}
          </button>
        </nav>
      </header>
      <main className="doc">
        <div className="doc-hero">
          <span className="kicker">{kicker}</span>
          <h1>{title}</h1>
          <p style={{ fontSize: '1.15rem', margin: 0 }}>{intro}</p>
        </div>
        {children}
        <div style={{ marginTop: 26, textAlign: 'center' }}>
          <button className="btn rouge" onClick={() => navigate('/')}>
            {t('Jouer maintenant 🚄', 'Play now 🚄')}
          </button>
        </div>
      </main>
      <footer className="footer" style={{ marginTop: 30 }}>
        <p>{t('Conçu par Alejandro & Krithik · Français III avec M. Marshall · IMSA', 'Made by Alejandro & Krithik · French III with M. Marshall · IMSA')}</p>
      </footer>
    </div>
  );
}

const H2 = ({ n, children }: { n: ReactNode; children: ReactNode }) => (
  <h2>
    <span className="num">{n}</span> {children}
  </h2>
);

export function Rules() {
  const t = useT();
  const total = PP_CARDS.length + ETRE_CARDS.length + TEMPS_CARDS.length + VOCAB_CARDS.length + SPEAK_CARDS.length + TABLE_CARDS.length + EVENT_CARDS.length;
  const CASES: { k: SpaceKind; fr: string; en: string; pts: [string, string] }[] = [
    { k: 'pp', fr: 'Trouve le bon participe passé (apprendre → appris), ou retrouve l’infinitif.', en: 'Find the right past participle (apprendre → appris), or find the infinitive.', pts: [`+${POINTS.quiz} 🥐`, `+${POINTS.quiz} 🥐`] },
    { k: 'etre', fr: 'DR & MRS VANDERTRAMP : être ou avoir ? Attention à l’accord !', en: 'DR & MRS VANDERTRAMP: être or avoir? Watch the agreement!', pts: [`+${POINTS.quiz} 🥐`, `+${POINTS.quiz} 🥐`] },
    { k: 'temps', fr: 'Passé composé ou imparfait ? Cherche les mots-signaux.', en: 'Passé composé or imparfait? Look for the signal words.', pts: [`+${POINTS.quiz} 🥐`, `+${POINTS.quiz} 🥐`] },
    { k: 'vocab', fr: 'Expressions, nombres, faux amis… et cartes d’écoute 🔊.', en: 'Expressions, numbers, false friends… and listening cards 🔊.', pts: [`+${POINTS.quiz} 🥐`, `+${POINTS.quiz} 🥐`] },
    { k: 'parle', fr: 'Parle sur le sujet (45 s, ou 20 s en partie éclair). Les autres votent « Bravo ! » ou « Pas encore ».', en: 'Talk about the topic (45 s, or 20 s in a speed round). The others vote “Bravo!” or “Not yet”.', pts: [`+1 🥐 par bravo (max ${POINTS.speakMax})`, `+1 🥐 per bravo (max ${POINTS.speakMax})`] },
    { k: 'table', fr: 'Tout le monde répond à tour de rôle, puis chacun vote pour la meilleure réponse (pas la sienne !).', en: 'Everyone answers in turn, then everyone votes for the best answer (not their own!).', pts: [`+${POINTS.table} 🥐 au gagnant`, `+${POINTS.table} 🥐 to the winner`] },
    { k: 'duel', fr: 'Choisis un adversaire. Même question pour vous deux : le plus rapide gagne !', en: 'Pick an opponent. Same question for both of you: the fastest wins!', pts: [`+${POINTS.duel} 🥐`, `+${POINTS.duel} 🥐`] },
    { k: 'chance', fr: 'Une carte surprise : grève, anniversaire, pique-nique, amende…', en: 'A surprise card: strike, birthday, picnic, fine…', pts: ['?', '?'] },
    { k: 'gare', fr: 'Prends le TGV : tu files directement jusqu’à la gare suivante.', en: 'Take the TGV: zoom straight to the next station.', pts: ['6 cases !', '6 spaces!'] },
    { k: 'depart', fr: 'Chaque fois que tu passes par le Départ, tu as fait un tour de France complet.', en: 'Every time you pass Start, you’ve made a full lap of France.', pts: [`+${POINTS.lap} 🥐`, `+${POINTS.lap} 🥐`] },
  ];
  const golden = t(
    <>
      Pendant toute la partie, on parle <b>uniquement français</b> — même pour dire « c’est à toi » ou « bien joué ». Utilisez le bouton <b>💬 Phrases</b> si vous ne savez pas comment le dire.
    </>,
    <>
      During the whole game, you speak <b>only French</b> — even to say “your turn” or “nice job”. Use the <b>💬 Phrases</b> button if you don’t know how to say it.
    </>,
  );
  return (
    <DocShell kicker={t('Mode d’emploi', 'How it works')} title={t('Règles du jeu', 'Game rules')} intro={t('Tout ce qu’il faut savoir avant de monter à bord. Lisez les règles ensemble… en français, bien sûr !', 'Everything you need to know before getting on board. Read the rules together… in French, of course!')}>
      <section>
        <H2 n="1">{t('Trois modes de jeu', 'Three game modes')}</H2>
        <div className="mode-grid">
          {(['plateau', 'combat', 'sprint'] as const).map((m) => (
            <div key={m} className={`mode-tile ${m}`}>
              <span className="mode-ico">{MODE_INFO[m].icon}</span>
              <h3>{t(MODE_INFO[m].fr.name, MODE_INFO[m].en.name)}</h3>
              <span className="kicker">{t(MODE_INFO[m].fr.tag, MODE_INFO[m].en.tag)}</span>
              <p>{t(MODE_INFO[m].fr.desc, MODE_INFO[m].en.desc)}</p>
            </div>
          ))}
        </div>
        <p>
          {t(
            <>
              L’<b>hôte</b> crée une partie, choisit le mode et la durée — de <b>1 minute</b> (partie éclair) à 20 minutes. Les autres joueurs scannent le <b>code QR</b> ou tapent le <b>code à 4 lettres</b>. De 2 à 6 joueurs.
            </>,
            <>
              The <b>host</b> creates a game and picks the mode and length — from <b>1 minute</b> (speed round) to 20 minutes. The other players scan the <b>QR code</b> or type the <b>4-letter code</b>. 2 to 6 players.
            </>,
          )}
        </p>
      </section>

      <section>
        <H2 n="2">🗺️ {t('Le Grand Tour (plateau)', 'The Grand Tour (board)')}</H2>
        <p>
          {t(
            <>
              Faites le tour de France sur l’Hexagone, répondez aux cartes et parlez français pour gagner des <b>croissants 🥐</b>. Le plus de croissants à la fin gagne. Il y a <b>{total} cartes</b> en tout.
            </>,
            <>
              Travel around France on the Hexagon, answer the cards and speak French to win <b>croissants 🥐</b>. Most croissants at the end wins. There are <b>{total} cards</b> in all.
            </>,
          )}
        </p>
        <ol>
          <li>{t(`Lance le dé (tu as ${T.roll / 1000} s, ou ${FAST.roll / 1000} s en partie éclair) et avance ton pion.`, `Roll the die (you have ${T.roll / 1000} s, or ${FAST.roll / 1000} s in a speed round) and move your piece.`)}</li>
          <li>{t('Fais ce que dit la case où tu arrives (voir le tableau).', 'Do what the space you land on says (see the table).')}</li>
          <li>
            {t(
              <>
                Pour les cartes à choix multiples, <b>lis la question à voix haute</b> et dis ta réponse avant de toucher l’écran.
              </>,
              <>
                For multiple-choice cards, <b>read the question out loud</b> and say your answer before you tap the screen.
              </>,
            )}
          </li>
          <li>
            {t(
              <>
                Mauvaise réponse ? <b>Vol !</b> Le premier des autres joueurs qui trouve gagne {POINTS.steal} 🥐.
              </>,
              <>
                Wrong answer? <b>Steal!</b> The first other player to get it wins {POINTS.steal} 🥐.
              </>,
            )}
          </li>
          <li>{t('Quand le temps est écoulé, on finit le tour en cours (en partie éclair, on s’arrête pile à 00:00).', 'When time runs out, you finish the current turn (in a speed round, the game stops right at 00:00).')}</li>
        </ol>
        <table>
          <thead>
            <tr>
              <th>{t('Case', 'Space')}</th>
              <th>{t('Que faire ?', 'What to do')}</th>
              <th>{t('Gain', 'Points')}</th>
            </tr>
          </thead>
          <tbody>
            {CASES.map((c) => (
              <tr key={c.k}>
                <td>
                  <b>
                    {KINDS[c.k].icon} {t(KINDS[c.k].label, KINDS[c.k].en.label)}
                  </b>
                </td>
                <td>{t(c.fr, c.en)}</td>
                <td className="pts">{t(c.pts[0], c.pts[1])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <H2 n="3">🥊 {t('Combat', 'Fight')}</H2>
        <ul>
          <li>{t(`Chaque joueur commence avec ${COMBAT.hp} PV (points de vie). Tout le monde répond en même temps, sur son téléphone.`, `Each player starts with ${COMBAT.hp} HP (health points). Everyone answers at the same time, on their own phone.`)}</li>
          <li>{t(`Bonne réponse : tu frappes ton adversaire (${COMBAT.base} dégâts). Chaque bonne réponse de suite ajoute un combo (+${COMBAT.comboStep}, jusqu’à ×${COMBAT.comboMax}) et répondre en moins de 3 s ajoute +${COMBAT.speedBonus}.`, `Right answer: you hit your opponent (${COMBAT.base} damage). Each right answer in a row adds to your combo (+${COMBAT.comboStep}, up to ×${COMBAT.comboMax}), and answering in under 3 s adds +${COMBAT.speedBonus}.`)}</li>
          <li>{t(`Mauvaise réponse : tu perds ${COMBAT.missDmg} PV, ton combo tombe à zéro et tu es étourdi(e) ${COMBAT.stunMs / 1000} s — lis bien l’explication !`, `Wrong answer: you lose ${COMBAT.missDmg} HP, your combo drops to zero and you’re stunned for ${COMBAT.stunMs / 1000} s — read the explanation!`)}</li>
          <li>{t('À 3 joueurs ou plus, touche la barre de vie d’un adversaire pour le viser 🎯 (sinon, tu frappes celui qui a le plus de PV).', 'With 3+ players, tap an opponent’s health bar to target them 🎯 (otherwise you hit whoever has the most HP).')}</li>
          <li>{t('À 0 PV : K.O. ! Le dernier debout gagne — ou celui qui a le plus de PV à la fin du temps (1, 2 ou 3 minutes).', 'At 0 HP: K.O.! The last one standing wins — or whoever has the most HP when time runs out (1, 2 or 3 minutes).')}</li>
          <li>{t('Pendant le combat, criez vos attaques en français : « Prends ça ! », « En garde ! », « Aïe ! »', 'During the fight, shout your attacks in French: « Prends ça ! », « En garde ! », « Aïe ! »')}</li>
        </ul>
      </section>

      <section>
        <H2 n="4">⚡ {t('Sprint', 'Sprint')}</H2>
        <ul>
          <li>{t(`Tout le monde reçoit la même question en même temps. Tu as ${SPRINT.question / 1000} secondes et un seul essai.`, `Everyone gets the same question at the same time. You have ${SPRINT.question / 1000} seconds and one try.`)}</li>
          <li>{t(`Le premier qui trouve gagne ${SPRINT.first} points ; les autres bonnes réponses gagnent ${SPRINT.other} point.`, `The first correct answer wins ${SPRINT.first} points; other correct answers win ${SPRINT.other} point.`)}</li>
          <li>{t('Après chaque question, la bonne réponse et l’explication s’affichent : lisez-les ensemble !', 'After each question, the right answer and the explanation appear: read them together!')}</li>
          <li>{t('Le plus de points à la fin (1, 2 ou 5 minutes) gagne.', 'Most points at the end (1, 2 or 5 minutes) wins.')}</li>
        </ul>
      </section>

      <section className="golden">
        <h2>
          <span className="num" style={{ background: '#fff', color: 'var(--rouge)' }}>
            ★
          </span>{' '}
          {t('La règle d’or : on parle français !', 'The golden rule: speak French!')}
        </h2>
        <p>{golden}</p>
        <p>
          {t(
            <>
              Quelqu’un a parlé anglais ? Appuie sur{' '}
              <b>
                <FlagUK size={16} /> Anglais !
              </b>{' '}
              et choisis le joueur. Les autres votent : si la majorité dit « Coupable ! », il perd <b>{POINTS.english} 🥐</b> (ou 10 PV en combat). On peut accuser une fois toutes les {T.accuseCooldown / 1000} secondes. Soyez justes !
            </>,
            <>
              Did someone speak English? Press{' '}
              <b>
                <FlagUK size={16} /> Anglais !
              </b>{' '}
              and pick the player. The others vote: if the majority says “Guilty!”, they lose <b>{POINTS.english} 🥐</b> (or 10 HP in a fight). You can accuse once every {T.accuseCooldown / 1000} seconds. Be fair!
            </>,
          )}
        </p>
        <p>
          {t(
            <>
              Bloqué(e) ? Maintiens le bouton <b>👀 English</b> pour lire l’écran en anglais. Lâche-le pour revenir au français. (Les réponses restent en français — pas de triche !) Lire en anglais, c’est permis ; <b>parler</b> anglais, non !
            </>,
            <>
              Stuck? Hold the <b>👀 English</b> button to read the screen in English. Let go to switch back to French. (The answer choices stay in French — no cheating!) Reading English is allowed; <b>speaking</b> English isn’t!
            </>,
          )}
        </p>
      </section>

      <section>
        <H2 n="5">{t('Le fair-play', 'Fair play')}</H2>
        <ul>
          <li>{t('Pas de dictionnaire ni de traducteur pendant les questions !', 'No dictionary or translator during the questions!')}</li>
          <li>{t('On ne souffle pas la réponse… sauf pendant le vol, où c’est chacun pour soi.', 'Don’t whisper the answer… except during a steal, where it’s every player for themselves.')}</li>
          <li>{t('Votez honnêtement : un « Bravo » veut dire « Tu as parlé français tout le temps, avec le bon temps ».', 'Vote honestly: a “Bravo” means “You spoke French the whole time, with the right tense”.')}</li>
          <li>{t('Sur un projecteur, ouvrez le mode projecteur (dans le menu ☰) pour que toute la classe voie la partie.', 'On a projector, open projector mode (in the ☰ menu) so the whole class can see the game.')}</li>
          <li>
            {t('Pour finir, chacun dit une chose qu’il a apprise :', 'To finish, everyone says one thing they learned:')} <i lang="fr">« Aujourd’hui, j’ai appris que… »</i>
          </li>
        </ul>
      </section>
    </DocShell>
  );
}

const VANDERTRAMP: [string, string, string, string][] = [
  ['D', 'devenir', 'devenu', 'to become'],
  ['R', 'revenir', 'revenu', 'to come back'],
  ['M', 'monter', 'monté', 'to go up'],
  ['R', 'rester', 'resté', 'to stay'],
  ['S', 'sortir', 'sorti', 'to go out'],
  ['V', 'venir', 'venu', 'to come'],
  ['A', 'aller', 'allé', 'to go'],
  ['N', 'naître', 'né', 'to be born'],
  ['D', 'descendre', 'descendu', 'to go down'],
  ['E', 'entrer', 'entré', 'to enter'],
  ['R', 'rentrer', 'rentré', 'to go home'],
  ['T', 'tomber', 'tombé', 'to fall'],
  ['R', 'retourner', 'retourné', 'to return'],
  ['A', 'arriver', 'arrivé', 'to arrive'],
  ['M', 'mourir', 'mort', 'to die'],
  ['P', 'partir', 'parti', 'to leave'],
];

const IRREG: [string, string, string][] = [
  ['en -u', 'ending in -u', 'avoir → eu · boire → bu · connaître → connu · courir → couru · croire → cru · devoir → dû · falloir → fallu · lire → lu · plaire → plu · pleuvoir → plu · pouvoir → pu · recevoir → reçu · savoir → su · tenir → tenu · venir → venu · vivre → vécu · voir → vu · vouloir → voulu'],
  ['en -is', 'ending in -is', 'apprendre → appris · comprendre → compris · mettre → mis · prendre → pris · promettre → promis · s’asseoir → assis'],
  ['en -it', 'ending in -it', 'conduire → conduit · construire → construit · dire → dit · écrire → écrit · faire → fait'],
  ['en -ert', 'ending in -ert', 'couvrir → couvert · découvrir → découvert · offrir → offert · ouvrir → ouvert · souffrir → souffert'],
  ['en -int', 'ending in -int', 'craindre → craint · peindre → peint · rejoindre → rejoint'],
  ['à part', 'others', 'être → été · naître → né · mourir → mort · rire → ri · suivre → suivi'],
];

export function Aide() {
  const t = useT();
  return (
    <DocShell kicker={t('Pour réviser', 'Review')} title={t('Aide-mémoire', 'Cheat sheet')} intro={t('Les règles de grammaire du Grand Tour, sur une seule page. Révise avant de jouer !', 'The Grand Tour’s grammar rules on a single page. Review before you play!')}>
      <section>
        <h2>🏠 {t('La maison d’être', 'The house of être')}</h2>
        <p>
          {t(
            <>
              Ces verbes (surtout des verbes de mouvement) forment le passé composé avec <b>être</b>. Retiens-les avec <b>DR &amp; MRS VANDERTRAMP</b> :
            </>,
            <>
              These verbs (mostly verbs of motion) form the passé composé with <b>être</b>. Remember them with <b>DR &amp; MRS VANDERTRAMP</b>:
            </>,
          )}
        </p>
        <div className="maison">
          <div className="maison-roof">
            <span>DR &amp; MRS VANDERTRAMP</span>
          </div>
          <div className="maison-body">
            {VANDERTRAMP.map(([l, v, pp, en], i) => (
              <div key={i}>
                <b>{l}</b>
                {v}
                <small>→ {t(pp, `${pp} (${en})`)}</small>
              </div>
            ))}
          </div>
        </div>
        <p>
          {t(
            <>
              <b>+ tous les verbes pronominaux</b> : se lever, se coucher, s’habiller, se promener… (<i>je me suis levé(e)</i>).
            </>,
            <>
              <b>+ all reflexive verbs</b>: se lever, se coucher, s’habiller, se promener… (<i>je me suis levé(e)</i> = I got up).
            </>,
          )}
        </p>
        <p>
          {t(
            <>
              <b>+ passer</b> quand on passe par un lieu : <i>le train est passé par Lyon</i>.
            </>,
            <>
              <b>+ passer</b> when you go through a place: <i>le train est passé par Lyon</i> (the train went through Lyon).
            </>,
          )}
        </p>
      </section>

      <section>
        <h2>✅ {t('L’accord du participe passé', 'Past participle agreement')}</h2>
        <div className="two-col">
          <div className="col-box">
            <h3>{t('Avec être', 'With être')}</h3>
            <p style={{ margin: 0 }}>
              {t('Le participe s’accorde avec le', 'The participle agrees with the')} <b>{t('sujet', 'subject')}</b> :<br />
              Il est allé · Elle est allée
              <br />
              Ils sont partis · Elles sont parties
              <br />
              Marie et Paul sont allés <span className="muted">{t('(groupe mixte → masculin)', '(mixed group → masculine)')}</span>
            </p>
          </div>
          <div className="col-box">
            <h3>{t('Avec avoir', 'With avoir')}</h3>
            <p style={{ margin: 0 }}>
              {t('Pas d’accord avec le sujet :', 'No agreement with the subject:')}
              <br />
              Elle a mangé · Elles ont lu
            </p>
          </div>
        </div>
        <p>
          {t(
            <>
              <b>Piège !</b> Monter, descendre, sortir, rentrer, retourner et passer prennent <b>avoir</b> quand il y a un complément d’objet direct : <i>Léa est montée</i> mais <i>Léa a monté les valises</i>. <i>Je suis sorti</i> mais <i>j’ai sorti la poubelle</i>.
            </>,
            <>
              <b>Trap!</b> Monter, descendre, sortir, rentrer, retourner and passer take <b>avoir</b> when they have a direct object: <i>Léa est montée</i> (Léa went up) but <i>Léa a monté les valises</i> (Léa carried the suitcases up). <i>Je suis sorti</i> (I went out) but <i>j’ai sorti la poubelle</i> (I took out the trash).
            </>,
          )}
        </p>
      </section>

      <section>
        <h2>⏳ {t('Passé composé ou imparfait ?', 'Passé composé or imparfait?')}</h2>
        <div className="two-col">
          <div className="col-box">
            <h3>{t('Imparfait', 'Imparfait')}</h3>
            <ul>
              <li>{t('Description (personnes, lieux, météo, heure, âge)', 'Description (people, places, weather, time, age)')}</li>
              <li>{t('Habitude, action répétée', 'Habit, repeated action')}</li>
              <li>{t('Action en cours (le décor)', 'Action in progress (the background)')}</li>
              <li>{t('Sentiments, états d’esprit', 'Feelings, states of mind')}</li>
            </ul>
            <p style={{ margin: 0 }}>
              <b>{t('Mots-signaux :', 'Signal words:')}</b> d’habitude, souvent, tous les jours, chaque été, autrefois, quand j’étais petit(e), pendant que…
            </p>
          </div>
          <div className="col-box">
            <h3>{t('Passé composé', 'Passé composé')}</h3>
            <ul>
              <li>{t('Action précise, terminée', 'A specific, completed action')}</li>
              <li>{t('Suite d’actions (d’abord, ensuite, puis)', 'A sequence of actions (first, next, then)')}</li>
              <li>{t('Action qui interrompt une autre', 'An action that interrupts another')}</li>
              <li>{t('Durée limitée (pendant trois ans)', 'A limited period (for three years)')}</li>
            </ul>
            <p style={{ margin: 0 }}>
              <b>{t('Mots-signaux :', 'Signal words:')}</b> soudain, tout à coup, un jour, hier, une fois, samedi dernier, ce matin…
            </p>
          </div>
        </div>
        <p>
          {t(
            <>
              <b>Ensemble :</b> <i>Je lisais</i> (imparfait : le décor) <i>quand le téléphone a sonné</i> (passé composé : l’événement).
            </>,
            <>
              <b>Together:</b> <i>Je lisais</i> (imparfait: the background — I was reading) <i>quand le téléphone a sonné</i> (passé composé: the event — when the phone rang).
            </>,
          )}
        </p>
      </section>

      <section>
        <h2>✒️ {t('Les participes passés', 'Past participles')}</h2>
        <p>
          <b>{t('Réguliers :', 'Regular:')}</b> -er → <b>-é</b> (parler → parlé) · -ir → <b>-i</b> (finir → fini) · -re → <b>-u</b> (vendre → vendu)
        </p>
        <table>
          <tbody>
            {IRREG.map(([fr, en, list]) => (
              <tr key={fr}>
                <th style={{ whiteSpace: 'nowrap' }}>{t(fr, en)}</th>
                <td lang="fr">{list}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>📘 {t('Former l’imparfait', 'Forming the imparfait')}</h2>
        <p>
          {t(
            <>
              Prends le radical de <b>nous</b> au présent, enlève <b>-ons</b>, puis ajoute : <b>-ais, -ais, -ait, -ions, -iez, -aient</b>.
            </>,
            <>
              Take the present-tense <b>nous</b> form, remove <b>-ons</b>, then add: <b>-ais, -ais, -ait, -ions, -iez, -aient</b>.
            </>,
          )}
        </p>
        <p>
          nous <b>finiss</b>ons → je finissais · nous <b>av</b>ons → j’avais · nous <b>fais</b>ons → je faisais
          <br />
          <b>{t('Exception :', 'Exception:')}</b> être → <b>ét-</b> (j’étais, nous étions).
        </p>
      </section>

      <section>
        <h2>💬 {t('Phrases utiles pour jouer', 'Useful phrases for playing')}</h2>
        {canSpeak() && <p className="muted">{t('Touche une phrase pour l’entendre.', 'Tap a phrase to hear it in French.')}</p>}
        <PhraseChips />
      </section>
    </DocShell>
  );
}
