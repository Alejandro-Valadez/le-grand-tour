import type { ReactNode } from 'react';
import { KINDS } from '../../shared/board';
import { ETRE_CARDS, EVENT_CARDS, PP_CARDS, SPEAK_CARDS, TABLE_CARDS, TEMPS_CARDS, VOCAB_CARDS } from '../../shared/cards';
import { POINTS, T } from '../../shared/engine';
import type { SpaceKind } from '../../shared/types';
import { FlagUK, Logo, PHRASES } from '../components/ui';
import { canSpeak, speakFrench } from '../fx';
import { navigate } from '../hooks';

function DocShell({ kicker, title, intro, children }: { kicker: string; title: string; intro: ReactNode; children: ReactNode }) {
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
            📜 Règles
          </button>
          <button className="btn small ghost" onClick={() => navigate('/aide')}>
            🏠 Aide
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
            Jouer maintenant 🚄
          </button>
        </div>
      </main>
      <footer className="footer" style={{ marginTop: 30 }}>
        <p>Conçu par Alejandro &amp; Krithik · Français III avec M. Marshall · IMSA</p>
      </footer>
    </div>
  );
}

const CASES: { k: SpaceKind; what: ReactNode; pts: string }[] = [
  { k: 'pp', what: 'Trouve le bon participe passé (apprendre → appris), ou retrouve l’infinitif.', pts: `+${POINTS.quiz} 🥐` },
  { k: 'etre', what: 'DR & MRS VANDERTRAMP : être ou avoir ? Attention à l’accord !', pts: `+${POINTS.quiz} 🥐` },
  { k: 'temps', what: 'Passé composé ou imparfait ? Cherche les mots-signaux.', pts: `+${POINTS.quiz} 🥐` },
  { k: 'vocab', what: 'Expressions, nombres, faux amis… et cartes d’écoute 🔊.', pts: `+${POINTS.quiz} 🥐` },
  { k: 'parle', what: `Parle pendant ${SPEAK_CARDS[0].seconds} secondes sur le sujet. Les autres votent « Bravo ! » ou « Pas encore ».`, pts: `+1 🥐 par bravo (max ${POINTS.speakMax})` },
  { k: 'table', what: 'Tout le monde répond à la question, à tour de rôle. Puis chacun vote pour la meilleure réponse (pas la sienne !).', pts: `+${POINTS.table} 🥐 au gagnant` },
  { k: 'duel', what: 'Choisis un adversaire. Même question pour vous deux : le plus rapide gagne !', pts: `+${POINTS.duel} 🥐` },
  { k: 'chance', what: 'Une carte surprise : grève, anniversaire, pique-nique, amende…', pts: '?' },
  { k: 'gare', what: 'Prends le TGV : tu files directement jusqu’à la gare suivante.', pts: '6 cases !' },
  { k: 'depart', what: 'Chaque fois que tu passes par le Départ, tu as fait un tour de France complet.', pts: `+${POINTS.lap} 🥐` },
];

export function Rules() {
  const total = PP_CARDS.length + ETRE_CARDS.length + TEMPS_CARDS.length + VOCAB_CARDS.length + SPEAK_CARDS.length + TABLE_CARDS.length + EVENT_CARDS.length;
  return (
    <DocShell kicker="Mode d’emploi" title="Règles du jeu" intro="Tout ce qu’il faut savoir avant de monter à bord. Lisez les règles ensemble… en français, bien sûr !">
      <section>
        <h2>
          <span className="num">1</span> Le but du jeu
        </h2>
        <p>
          Faites le tour de France sur le plateau (l’Hexagone !), répondez aux cartes et parlez français pour gagner des <b>croissants 🥐</b>. Quand le temps est écoulé, le joueur qui a le plus de croissants gagne la partie.
        </p>
      </section>

      <section>
        <h2>
          <span className="num">2</span> Le matériel
        </h2>
        <ul>
          <li>
            Un plateau de <b>36 cases</b> en forme d’Hexagone, avec 6 gares TGV.
          </li>
          <li>Un dé virtuel et un pion par joueur.</li>
          <li>
            <b>{total} cartes</b> : {PP_CARDS.length} participes passés, {ETRE_CARDS.length} cartes « maison d’être », {TEMPS_CARDS.length} cartes « PC ou imparfait », {VOCAB_CARDS.length} cartes de vocabulaire et d’écoute, {SPEAK_CARDS.length} sujets de conversation, {TABLE_CARDS.length} tours de table et {EVENT_CARDS.length} surprises.
          </li>
          <li>Un téléphone (ou un ordinateur) par joueur. Un projecteur, si vous voulez !</li>
        </ul>
      </section>

      <section>
        <h2>
          <span className="num">3</span> La mise en place
        </h2>
        <ol>
          <li>
            L’<b>hôte</b> crée une partie et choisit la durée : 10, 15, 20 ou 30 minutes.
          </li>
          <li>
            Les autres joueurs scannent le <b>code QR</b> ou tapent le <b>code à 4 lettres</b>.
          </li>
          <li>
            De <b>2 à 6 joueurs</b> — l’idéal, c’est <b>4 joueurs</b>.
          </li>
          <li>L’hôte appuie sur « En voiture ! ». L’ordre des joueurs est tiré au sort.</li>
        </ol>
      </section>

      <section>
        <h2>
          <span className="num">4</span> Un tour de jeu
        </h2>
        <ol>
          <li>
            Lance le dé (tu as {T.roll / 1000} secondes) et avance ton pion.
          </li>
          <li>Fais ce que dit la case où tu arrives (voir le tableau).</li>
          <li>
            Pour les cartes à choix multiples, <b>lis la question à voix haute</b> et dis ta réponse avant de toucher l’écran. Tu as {T.quiz / 1000} secondes.
          </li>
          <li>
            Mauvaise réponse ? <b>Vol !</b> Les autres joueurs ont {T.steal / 1000} secondes : le premier qui trouve gagne {POINTS.steal} 🥐.
          </li>
          <li>Tout le monde lit l’explication, puis c’est au tour du joueur suivant.</li>
        </ol>
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Que faire ?</th>
              <th>Gain</th>
            </tr>
          </thead>
          <tbody>
            {CASES.map((c) => (
              <tr key={c.k}>
                <td>
                  <b>
                    {KINDS[c.k].icon} {KINDS[c.k].label}
                  </b>
                </td>
                <td>{c.what}</td>
                <td className="pts">{c.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="golden">
        <h2>
          <span className="num" style={{ background: '#fff', color: 'var(--rouge)' }}>
            ★
          </span>{' '}
          La règle d’or : on parle français !
        </h2>
        <p>
          Pendant toute la partie, on parle <b>uniquement français</b> — même pour dire « c’est à toi » ou « bien joué ». Utilisez le bouton <b>💬 Phrases</b> si vous ne savez pas comment le dire.
        </p>
        <p>
          Quelqu’un a parlé anglais ? Appuie sur <b>
            <FlagUK size={16} /> Anglais !
          </b>{' '}
          et choisis le joueur. Les autres votent : si la majorité dit « Coupable ! », il perd <b>{POINTS.english} 🥐</b>. On peut accuser une fois toutes les {T.accuseCooldown / 1000} secondes. Soyez justes !
        </p>
      </section>

      <section>
        <h2>
          <span className="num">5</span> La fin de la partie
        </h2>
        <p>
          Quand l’horloge arrive à <b>00:00</b>, on termine le tour en cours et tout le monde descend du train. Le joueur qui a le plus de croissants gagne. En cas d’égalité, la victoire est partagée.
        </p>
        <p>
          Pour finir, chaque joueur dit une chose qu’il a apprise : <i>« Aujourd’hui, j’ai appris que… »</i>
        </p>
      </section>

      <section>
        <h2>
          <span className="num">6</span> Le fair-play
        </h2>
        <ul>
          <li>Pas de dictionnaire ni de traducteur pendant les questions !</li>
          <li>On ne souffle pas la réponse… sauf pendant le vol, où c’est chacun pour soi.</li>
          <li>Votez honnêtement : un « Bravo » veut dire « Tu as parlé français tout le temps, avec le bon temps ».</li>
          <li>
            Sur un projecteur, ouvrez le <b>mode projecteur</b> (dans le menu ☰) pour que toute la classe voie le plateau.
          </li>
        </ul>
      </section>
    </DocShell>
  );
}

const VANDERTRAMP: [string, string, string][] = [
  ['D', 'devenir', 'devenu'],
  ['R', 'revenir', 'revenu'],
  ['M', 'monter', 'monté'],
  ['R', 'rester', 'resté'],
  ['S', 'sortir', 'sorti'],
  ['V', 'venir', 'venu'],
  ['A', 'aller', 'allé'],
  ['N', 'naître', 'né'],
  ['D', 'descendre', 'descendu'],
  ['E', 'entrer', 'entré'],
  ['R', 'rentrer', 'rentré'],
  ['T', 'tomber', 'tombé'],
  ['R', 'retourner', 'retourné'],
  ['A', 'arriver', 'arrivé'],
  ['M', 'mourir', 'mort'],
  ['P', 'partir', 'parti'],
];

const IRREG: [string, string][] = [
  ['en -u', 'avoir → eu · boire → bu · connaître → connu · courir → couru · croire → cru · devoir → dû · falloir → fallu · lire → lu · plaire → plu · pleuvoir → plu · pouvoir → pu · recevoir → reçu · savoir → su · tenir → tenu · venir → venu · vivre → vécu · voir → vu · vouloir → voulu'],
  ['en -is', 'apprendre → appris · comprendre → compris · mettre → mis · prendre → pris · promettre → promis · s’asseoir → assis'],
  ['en -it', 'conduire → conduit · construire → construit · dire → dit · écrire → écrit · faire → fait'],
  ['en -ert', 'couvrir → couvert · découvrir → découvert · offrir → offert · ouvrir → ouvert · souffrir → souffert'],
  ['en -int', 'craindre → craint · peindre → peint · rejoindre → rejoint'],
  ['à part', 'être → été · naître → né · mourir → mort · rire → ri · suivre → suivi'],
];

export function Aide() {
  return (
    <DocShell kicker="Pour réviser" title="Aide-mémoire" intro="Les règles de grammaire du Grand Tour, sur une seule page. Révise avant de jouer !">
      <section>
        <h2>🏠 La maison d’être</h2>
        <p>
          Ces verbes (surtout des verbes de mouvement) forment le passé composé avec <b>être</b>. Retiens-les avec <b>DR &amp; MRS VANDERTRAMP</b> :
        </p>
        <div className="maison">
          <div className="maison-roof">
            <span>DR &amp; MRS VANDERTRAMP</span>
          </div>
          <div className="maison-body">
            {VANDERTRAMP.map(([l, v, pp], i) => (
              <div key={i}>
                <b>{l}</b>
                {v}
                <small>→ {pp}</small>
              </div>
            ))}
          </div>
        </div>
        <p>
          <b>+ tous les verbes pronominaux</b> : se lever, se coucher, s’habiller, se promener… (<i>je me suis levé(e)</i>).
        </p>
        <p>
          <b>+ passer</b> quand on passe par un lieu : <i>le train est passé par Lyon</i>.
        </p>
      </section>

      <section>
        <h2>✅ L’accord du participe passé</h2>
        <div className="two-col">
          <div className="col-box">
            <h3>Avec être</h3>
            <p style={{ margin: 0 }}>
              Le participe s’accorde avec le <b>sujet</b> :<br />
              Il est allé · Elle est allée
              <br />
              Ils sont partis · Elles sont parties
              <br />
              Marie et Paul sont allés <span className="muted">(groupe mixte → masculin)</span>
            </p>
          </div>
          <div className="col-box">
            <h3>Avec avoir</h3>
            <p style={{ margin: 0 }}>
              Pas d’accord avec le sujet :<br />
              Elle a mangé · Elles ont lu
            </p>
          </div>
        </div>
        <p>
          <b>Piège !</b> Monter, descendre, sortir, rentrer, retourner et passer prennent <b>avoir</b> quand il y a un complément d’objet direct : <i>Léa est montée</i> mais <i>Léa a monté les valises</i>. <i>Je suis sorti</i> mais <i>j’ai sorti la poubelle</i>.
        </p>
      </section>

      <section>
        <h2>⏳ Passé composé ou imparfait ?</h2>
        <div className="two-col">
          <div className="col-box">
            <h3>Imparfait</h3>
            <ul>
              <li>Description (personnes, lieux, météo, heure, âge)</li>
              <li>Habitude, action répétée</li>
              <li>Action en cours (le décor)</li>
              <li>Sentiments, états d’esprit</li>
            </ul>
            <p style={{ margin: 0 }}>
              <b>Mots-signaux :</b> d’habitude, souvent, tous les jours, chaque été, autrefois, quand j’étais petit(e), pendant que…
            </p>
          </div>
          <div className="col-box">
            <h3>Passé composé</h3>
            <ul>
              <li>Action précise, terminée</li>
              <li>Suite d’actions (d’abord, ensuite, puis)</li>
              <li>Action qui interrompt une autre</li>
              <li>Durée limitée (pendant trois ans)</li>
            </ul>
            <p style={{ margin: 0 }}>
              <b>Mots-signaux :</b> soudain, tout à coup, un jour, hier, une fois, samedi dernier, ce matin…
            </p>
          </div>
        </div>
        <p>
          <b>Ensemble :</b> <i>Je lisais</i> (imparfait : le décor) <i>quand le téléphone a sonné</i> (passé composé : l’événement).
        </p>
      </section>

      <section>
        <h2>✒️ Les participes passés</h2>
        <p>
          <b>Réguliers :</b> -er → <b>-é</b> (parler → parlé) · -ir → <b>-i</b> (finir → fini) · -re → <b>-u</b> (vendre → vendu)
        </p>
        <table>
          <tbody>
            {IRREG.map(([t, list]) => (
              <tr key={t}>
                <th style={{ whiteSpace: 'nowrap' }}>{t}</th>
                <td>{list}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>📘 Former l’imparfait</h2>
        <p>
          Prends le radical de <b>nous</b> au présent, enlève <b>-ons</b>, puis ajoute : <b>-ais, -ais, -ait, -ions, -iez, -aient</b>.
        </p>
        <p>
          nous <b>finiss</b>ons → je finissais · nous <b>av</b>ons → j’avais · nous <b>fais</b>ons → je faisais
          <br />
          <b>Exception :</b> être → <b>ét-</b> (j’étais, nous étions).
        </p>
      </section>

      <section>
        <h2>💬 Phrases utiles pour jouer</h2>
        {canSpeak() && <p className="muted">Touche une phrase pour l’entendre.</p>}
        <div className="phrases">
          {PHRASES.map((p) => (
            <button key={p} className="phrase" onClick={() => speakFrench(p, 0.9)}>
              {p}
            </button>
          ))}
        </div>
      </section>
    </DocShell>
  );
}
