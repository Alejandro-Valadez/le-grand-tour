import type { EventCard, QuizCard, SpeakCard, TableCard } from './types.js';

// Chaque carte a une traduction anglaise (`en`) pour le bouton « 👀 English ».
// Les options de réponse ne sont jamais traduites : c'est le français qu'on teste !

// ─────────────────────────────────────────────────────────────
// ✒️  PARTICIPES PASSÉS
// ─────────────────────────────────────────────────────────────

const pp = (inf: string, a: string, w: string[], x: string, xEn: string): QuizCard => ({
  id: `pp-${inf}`,
  cat: 'pp',
  ask: 'Participe passé',
  q: `Quel est le participe passé de **${inf}** ?`,
  a,
  w,
  x,
  en: { ask: 'Past participle', q: `What is the past participle of **${inf}**?`, x: xEn },
});

const ppPhrase = (id: string, q: string, a: string, w: string[], x: string, qEn: string, xEn: string): QuizCard => ({
  id: `pps-${id}`,
  cat: 'pp',
  ask: 'Complète la phrase',
  q,
  a,
  w,
  x,
  en: { ask: 'Complete the sentence', q: qEn, x: xEn },
});

const ppInf = (part: string, a: string, w: string[], x: string, xEn: string): QuizCard => ({
  id: `ppi-${part}`,
  cat: 'pp',
  ask: 'Retrouve l’infinitif',
  q: `« **${part}** » est le participe passé de quel verbe ?`,
  a,
  w,
  x,
  en: { ask: 'Find the infinitive', q: `« **${part}** » is the past participle of which verb?`, x: xEn },
});

export const PP_CARDS: QuizCard[] = [
  pp('apprendre', 'appris', ['apprendu', 'apprit', 'apprendé'], 'Les verbes en -prendre → -pris : prendre → pris, apprendre → appris, comprendre → compris.', 'Verbs ending in -prendre → -pris: prendre → pris, apprendre → appris, comprendre → compris.'),
  pp('prendre', 'pris', ['prendu', 'prit', 'prendé'], 'Prendre → pris. « J’ai pris le train. »', 'Prendre → pris. « J’ai pris le train. » = I took the train.'),
  pp('comprendre', 'compris', ['comprendu', 'comprit', 'comprendé'], 'Comprendre → compris. « Tu as compris ? »', 'Comprendre → compris. « Tu as compris ? » = Did you understand?'),
  pp('mettre', 'mis', ['mettu', 'mit', 'metté'], 'Mettre → mis. Même famille : promettre → promis, permettre → permis.', 'Mettre → mis. Same family: promettre → promis, permettre → permis.'),
  pp('promettre', 'promis', ['promettu', 'promit', 'prometté'], 'Promettre → promis. « Il a promis de venir. »', 'Promettre → promis. « Il a promis de venir. » = He promised to come.'),
  pp('faire', 'fait', ['faité', 'fais', 'fit'], 'Faire → fait. « Qu’est-ce que tu as fait ce week-end ? »', 'Faire → fait. « Qu’est-ce que tu as fait ce week-end ? » = What did you do this weekend?'),
  pp('dire', 'dit', ['disé', 'dis', 'diré'], 'Dire → dit. « Elle m’a dit bonjour. »', 'Dire → dit. « Elle m’a dit bonjour. » = She said hello to me.'),
  pp('écrire', 'écrit', ['écrivé', 'écri', 'écrivu'], 'Écrire → écrit. Même chose pour décrire → décrit.', 'Écrire → écrit. Same for décrire → décrit.'),
  pp('lire', 'lu', ['lit', 'lisé', 'liré'], 'Lire → lu. « J’ai lu Le Petit Prince. »', 'Lire → lu. « J’ai lu Le Petit Prince. » = I read The Little Prince.'),
  pp('voir', 'vu', ['voyé', 'vit', 'voiré'], 'Voir → vu. « Nous avons vu la tour Eiffel. »', 'Voir → vu. « Nous avons vu la tour Eiffel. » = We saw the Eiffel Tower.'),
  pp('boire', 'bu', ['boivé', 'buvé', 'boit'], 'Boire → bu. « Nous avons bu du lait. »', 'Boire → bu. « Nous avons bu du lait. » = We drank milk.'),
  pp('croire', 'cru', ['croyé', 'croit', 'crué'], 'Croire → cru. « Je ne l’ai pas cru ! »', 'Croire → cru. « Je ne l’ai pas cru ! » = I didn’t believe him!'),
  pp('devoir', 'dû', ['devé', 'du', 'dut'], 'Devoir → dû (avec un accent circonflexe au masculin singulier, pour ne pas confondre avec « du »).', 'Devoir → dû (with a circumflex in the masculine singular, so it isn’t confused with « du »).'),
  pp('pouvoir', 'pu', ['pouvu', 'pouvé', 'put'], 'Pouvoir → pu. « Je n’ai pas pu venir. »', 'Pouvoir → pu. « Je n’ai pas pu venir. » = I couldn’t come.'),
  pp('vouloir', 'voulu', ['voulé', 'voulit', 'voulut'], 'Vouloir → voulu. « Il a voulu partir. »', 'Vouloir → voulu. « Il a voulu partir. » = He wanted to leave.'),
  pp('savoir', 'su', ['savé', 'savu', 'sut'], 'Savoir → su. « Je l’ai su trop tard. »', 'Savoir → su. « Je l’ai su trop tard. » = I found out too late.'),
  pp('avoir', 'eu', ['avé', 'avu', 'eut'], 'Avoir → eu. « J’ai eu peur ! »', 'Avoir → eu. « J’ai eu peur ! » = I was scared!'),
  pp('être', 'été', ['êté', 'étu', 'eté'], 'Être → été (auxiliaire avoir !) : « J’ai été malade. »', 'Être → été (with the helper verb avoir!): « J’ai été malade. » = I was sick.'),
  pp('recevoir', 'reçu', ['recevé', 'recu', 'recevu'], 'Recevoir → reçu (avec une cédille).', 'Recevoir → reçu (with a cedilla).'),
  pp('venir', 'venu', ['vené', 'venit', 'vint'], 'Venir → venu. Avec être : « Elle est venue. »', 'Venir → venu. With être: « Elle est venue. » = She came.'),
  pp('devenir', 'devenu', ['devené', 'devint', 'devenit'], 'Devenir → devenu. C’est le D de DR & MRS VANDERTRAMP.', 'Devenir → devenu. It’s the D in DR & MRS VANDERTRAMP.'),
  pp('tenir', 'tenu', ['tené', 'tint', 'tenit'], 'Tenir → tenu. Même famille : obtenir → obtenu.', 'Tenir → tenu. Same family: obtenir → obtenu.'),
  pp('naître', 'né', ['naît', 'naissu', 'naquit'], 'Naître → né. « Je suis né(e) en 2010. »', 'Naître → né. « Je suis né(e) en 2010. » = I was born in 2010.'),
  pp('mourir', 'mort', ['mouru', 'mouri', 'mouré'], 'Mourir → mort. « Il est mort en 1885. »', 'Mourir → mort. « Il est mort en 1885. » = He died in 1885.'),
  pp('ouvrir', 'ouvert', ['ouvri', 'ouvré', 'ouvru'], 'Ouvrir → ouvert. Même famille : offrir → offert, découvrir → découvert.', 'Ouvrir → ouvert. Same family: offrir → offert, découvrir → découvert.'),
  pp('offrir', 'offert', ['offri', 'offré', 'offru'], 'Offrir → offert. « Ils ont offert des prix. »', 'Offrir → offert. « Ils ont offert des prix. » = They offered prizes.'),
  pp('découvrir', 'découvert', ['découvri', 'découvré', 'découvru'], 'Découvrir → découvert.', 'Découvrir → découvert.'),
  pp('courir', 'couru', ['couri', 'couré', 'courut'], 'Courir → couru. « J’ai couru un marathon. »', 'Courir → couru. « J’ai couru un marathon. » = I ran a marathon.'),
  pp('connaître', 'connu', ['connaît', 'connaissé', 'connut'], 'Connaître → connu. Même famille : reconnaître → reconnu.', 'Connaître → connu. Same family: reconnaître → reconnu.'),
  pp('vivre', 'vécu', ['vivé', 'vivu', 'vit'], 'Vivre → vécu. « Elle a vécu à Paris. »', 'Vivre → vécu. « Elle a vécu à Paris. » = She lived in Paris.'),
  pp('suivre', 'suivi', ['suivu', 'suivé', 'suit'], 'Suivre → suivi. « Nous avons suivi le guide. »', 'Suivre → suivi. « Nous avons suivi le guide. » = We followed the guide.'),
  pp('conduire', 'conduit', ['conduisé', 'conduiré', 'conduu'], 'Conduire → conduit. Même famille : construire → construit, traduire → traduit.', 'Conduire → conduit. Same family: construire → construit, traduire → traduit.'),
  pp('peindre', 'peint', ['peindu', 'peigné', 'peindé'], 'Peindre → peint. Les verbes en -indre → -int : craindre → craint, rejoindre → rejoint.', 'Peindre → peint. Verbs ending in -indre → -int: craindre → craint, rejoindre → rejoint.'),
  pp('rire', 'ri', ['rit', 'rié', 'riu'], 'Rire → ri. « On a beaucoup ri. »', 'Rire → ri. « On a beaucoup ri. » = We laughed a lot.'),
  pp('pleuvoir', 'plu', ['pleuvu', 'pleuvé', 'plut'], 'Pleuvoir → plu. « Il a plu toute la nuit. »', 'Pleuvoir → plu. « Il a plu toute la nuit. » = It rained all night.'),
  pp('falloir', 'fallu', ['fallé', 'faillu', 'fallut'], 'Falloir → fallu. « Il a fallu partir. »', 'Falloir → fallu. « Il a fallu partir. » = We had to leave.'),
  pp('s’asseoir', 'assis', ['asseyé', 'asseoiru', 'assoyé'], 'S’asseoir → assis. « Elle s’est assise. »', 'S’asseoir → assis. « Elle s’est assise. » = She sat down.'),
  pp('partir', 'parti', ['partu', 'parté', 'partit'], 'Partir → parti. Les verbes comme partir, sortir, dormir → -i.', 'Partir → parti. Verbs like partir, sortir, dormir → -i.'),
  pp('attendre', 'attendu', ['attendi', 'attendé', 'attendit'], 'Les verbes en -re réguliers → -u : attendre → attendu, vendre → vendu.', 'Regular -re verbs → -u: attendre → attendu, vendre → vendu.'),
  pp('perdre', 'perdu', ['perdi', 'perdé', 'perdit'], 'Perdre → perdu (verbe régulier en -re).', 'Perdre → perdu (a regular -re verb).'),
  pp('choisir', 'choisi', ['choisu', 'choisé', 'choisit'], 'Les verbes réguliers en -ir → -i : finir → fini, choisir → choisi.', 'Regular -ir verbs → -i: finir → fini, choisir → choisi.'),
  pp('battre', 'battu', ['batti', 'batté', 'battit'], 'Battre → battu.', 'Battre → battu.'),

  ppPhrase('nuit', 'Elle a **___** ce livre toute la nuit. (lire)', 'lu', ['lit', 'lisé', 'lue'], 'Lire → lu. Pas d’accord avec le sujet quand l’auxiliaire est avoir.', 'She **___** this book all night long. (lire = to read)', 'Lire → lu. No agreement with the subject when the helper verb is avoir.'),
  ppPhrase('lettres', 'Tu as **___** les lettres de Margot ? (recevoir)', 'reçu', ['recevu', 'recevé', 'reçus'], 'Recevoir → reçu. Avec avoir, le participe ne s’accorde pas avec un COD placé après.', 'Did you **___** Margot’s letters? (recevoir = to receive)', 'Recevoir → reçu. With avoir, the participle doesn’t agree with a direct object that comes after it.'),
  ppPhrase('biscuits', 'Vous avez **___** combien de biscuits ? (prendre)', 'pris', ['prendu', 'pri', 'prendé'], 'Prendre → pris.', 'How many cookies did you **___**? (prendre = to take)', 'Prendre → pris.'),
  ppPhrase('gateau', 'Tu as **___** un gâteau pour ta mère ? (faire)', 'fait', ['faire', 'faité', 'fais'], 'Faire → fait.', 'Did you **___** a cake for your mother? (faire = to make)', 'Faire → fait.'),
  ppPhrase('oiseaux', 'Henri et Léo ont **___** des oiseaux rares. (voir)', 'vu', ['vus', 'voyé', 'vit'], 'Voir → vu. Avec avoir, pas d’accord avec le sujet « Henri et Léo ».', 'Henri and Léo **___** some rare birds. (voir = to see)', 'Voir → vu. With avoir, no agreement with the subject « Henri et Léo ».'),
  ppPhrase('chemise', 'Mon ami et moi avons **___** la même chemise. (mettre)', 'mis', ['mettu', 'mise', 'mettés'], 'Mettre → mis.', 'My friend and I **___** on the same shirt. (mettre = to put on)', 'Mettre → mis.'),
  ppPhrase('devoirs', 'Nous avons **___** beaucoup de devoirs. (avoir)', 'eu', ['avu', 'eus', 'avé'], 'Avoir → eu. « J’ai eu, tu as eu, nous avons eu… »', 'We **___** a lot of homework. (avoir = to have)', 'Avoir → eu. « J’ai eu, tu as eu, nous avons eu… »'),
  ppPhrase('pluie', 'Il a **___** plus l’année dernière. (pleuvoir)', 'plu', ['pleuvu', 'pleut', 'pleuvé'], 'Pleuvoir → plu. Attention : plaire → plu aussi !', 'It **___** more last year. (pleuvoir = to rain)', 'Pleuvoir → plu. Careful: plaire → plu too!'),
  ppPhrase('resultats', 'Les filles ont **___** les résultats hier. (apprendre)', 'appris', ['apprendu', 'apprises', 'apprendé'], 'Apprendre → appris. Pas d’accord avec le sujet (auxiliaire avoir).', 'The girls **___** the results yesterday. (apprendre = to learn)', 'Apprendre → appris. No agreement with the subject (helper verb avoir).'),
  ppPhrase('dit', 'Qu’est-ce que tu as **___** à Lara ? (dire)', 'dit', ['dis', 'disé', 'dite'], 'Dire → dit.', 'What did you **___** to Lara? (dire = to say)', 'Dire → dit.'),

  ppInf('su', 'savoir', ['suer', 'suivre', 'sortir'], '« Su » vient de savoir : j’ai su.', '« Su » comes from savoir (to know): j’ai su.'),
  ppInf('eu', 'avoir', ['être', 'aller', 'user'], '« Eu » vient de avoir : j’ai eu.', '« Eu » comes from avoir (to have): j’ai eu.'),
  ppInf('été', 'être', ['avoir', 'étudier', 'aller'], '« Été » vient de être : j’ai été.', '« Été » comes from être (to be): j’ai été.'),
  ppInf('né', 'naître', ['nager', 'nettoyer', 'nier'], '« Né » vient de naître : je suis né(e).', '« Né » comes from naître (to be born): je suis né(e).'),
  ppInf('vécu', 'vivre', ['voir', 'venir', 'vaincre'], '« Vécu » vient de vivre : j’ai vécu.', '« Vécu » comes from vivre (to live): j’ai vécu.'),
  ppInf('bu', 'boire', ['battre', 'bouger', 'bâtir'], '« Bu » vient de boire : j’ai bu.', '« Bu » comes from boire (to drink): j’ai bu.'),
  ppInf('dû', 'devoir', ['dire', 'donner', 'durer'], '« Dû » vient de devoir : j’ai dû partir.', '« Dû » comes from devoir (to have to): j’ai dû partir.'),
  ppInf('cru', 'croire', ['crier', 'croître', 'créer'], '« Cru » vient de croire : je l’ai cru.', '« Cru » comes from croire (to believe): je l’ai cru.'),
  ppInf('mis', 'mettre', ['miser', 'mentir', 'manger'], '« Mis » vient de mettre : j’ai mis.', '« Mis » comes from mettre (to put): j’ai mis.'),
  ppInf('pu', 'pouvoir', ['plaire', 'punir', 'peindre'], '« Pu » vient de pouvoir : je n’ai pas pu.', '« Pu » comes from pouvoir (to be able to): je n’ai pas pu.'),
];

// ─────────────────────────────────────────────────────────────
// 🏠  LA MAISON D'ÊTRE — DR & MRS VANDERTRAMP
// ─────────────────────────────────────────────────────────────

type Ask = [fr: string, en: string];
const ETRE_ASK: Ask = ['Être ou avoir ?', 'Être or avoir?'];
const VDT: Ask = ['VANDERTRAMP', 'VANDERTRAMP'];

const etre = (id: string, q: string, a: string, w: string[], x: string, qEn: string, xEn: string, ask: Ask = ETRE_ASK): QuizCard => ({
  id: `etre-${id}`,
  cat: 'etre',
  ask: ask[0],
  q,
  a,
  w,
  x,
  en: { ask: ask[1], q: qEn, x: xEn },
});

export const ETRE_CARDS: QuizCard[] = [
  etre('marie', 'Hier, Marie **___** au marché. (aller)', 'est allée', ['a allé', 'est allé', 'a allée'], 'Aller → auxiliaire être. Marie = féminin singulier → allée.', 'Yesterday, Marie **___** to the market. (aller = to go)', 'Aller → helper verb être. Marie = feminine singular → allée.'),
  etre('frere', 'Mon frère et moi, nous **___** en retard. (arriver)', 'sommes arrivés', ['avons arrivé', 'sommes arrivé', 'sommes arrivées'], 'Arriver → être. « Mon frère et moi » = masculin pluriel → arrivés.', 'My brother and I **___** late. (arriver = to arrive)', 'Arriver → être. « Mon frère et moi » = masculine plural → arrivés.'),
  etre('filles', 'Les filles **___** à huit heures. (partir)', 'sont parties', ['ont parti', 'sont partis', 'sont partie'], 'Partir → être. Les filles = féminin pluriel → parties.', 'The girls **___** at eight o’clock. (partir = to leave)', 'Partir → être. Les filles = feminine plural → parties.'),
  etre('grandpere', 'Mon grand-père **___** en 1950. (naître)', 'est né', ['a né', 'est née', 'a naît'], 'Naître → être. Grand-père = masculin singulier → né.', 'My grandfather **___** in 1950. (naître = to be born)', 'Naître → être. Grand-père = masculine singular → né.'),
  etre('hugo', 'Victor Hugo **___** en 1885. (mourir)', 'est mort', ['a mouru', 'est mouru', 'a mort'], 'Mourir → être, participe irrégulier : mort.', 'Victor Hugo **___** in 1885. (mourir = to die)', 'Mourir → être, with an irregular participle: mort.'),
  etre('paul', 'Paul : « Je **___** dans l’escalier ! » (tomber)', 'suis tombé', ['ai tombé', 'suis tombée', 'ai tombée'], 'Tomber → être. Paul = masculin → tombé.', 'Paul: « I **___** down the stairs! » (tomber = to fall)', 'Tomber → être. Paul = masculine → tombé.'),
  etre('elles', 'Elles **___** chez elles tout le week-end. (rester)', 'sont restées', ['ont resté', 'sont restés', 'sont resté'], 'Rester → être. Elles = féminin pluriel → restées.', 'They (f.) **___** at home all weekend. (rester = to stay)', 'Rester → être. Elles = feminine plural → restées.'),
  etre('chloe', 'Chloé, tu **___** du train à Lyon ? (descendre)', 'es descendue', ['as descendu', 'es descendu', 'as descendue'], 'Descendre (sans COD) → être. Chloé = féminin → descendue.', 'Chloé, did you **___** off the train in Lyon? (descendre = to get off)', 'Descendre (with no direct object) → être. Chloé = feminine → descendue.'),
  etre('monsieur', 'Monsieur, vous **___** sans frapper ! (entrer)', 'êtes entré', ['avez entré', 'êtes entrés', 'êtes entrée'], 'Entrer → être. « Vous » de politesse pour un seul homme → entré (singulier).', 'Sir, you **___** without knocking! (entrer = to come in)', 'Entrer → être. The polite « vous » for one man → entré (singular).'),
  etre('ils', 'Ils **___** de vacances hier soir. (revenir)', 'sont revenus', ['ont revenu', 'sont revenu', 'sont revenues'], 'Revenir → être. Ils = masculin pluriel → revenus.', 'They **___** from vacation last night. (revenir = to come back)', 'Revenir → être. Ils = masculine plural → revenus.'),
  etre('soeur', 'Ma sœur **___** médecin. (devenir)', 'est devenue', ['a devenu', 'est devenu', 'a devenue'], 'Devenir → être. Ma sœur = féminin → devenue.', 'My sister **___** a doctor. (devenir = to become)', 'Devenir → être. Ma sœur = feminine → devenue.'),
  etre('lea-chambre', 'Léa **___** dans sa chambre. (monter)', 'est montée', ['a monté', 'est monté', 'a montée'], 'Monter sans COD → être. Léa = féminin → montée.', 'Léa **___** up to her room. (monter = to go up)', 'Monter with no direct object → être. Léa = feminine → montée.'),
  etre('lea-valises', 'Léa **___** les valises au grenier. (monter)', 'a monté', ['est montée', 'est monté', 'a montée'], 'Piège ! Avec un COD (« les valises »), monter prend l’auxiliaire avoir. Pas d’accord.', 'Léa **___** the suitcases up to the attic. (monter = to carry up)', 'Trap! With a direct object (« les valises »), monter takes the helper verb avoir. No agreement.'),
  etre('emma', 'Emma et Julie : « Nous **___** avec nos amis. » (sortir)', 'sommes sorties', ['avons sorti', 'sommes sortis', 'sommes sortie'], 'Sortir sans COD → être. Emma et Julie = féminin pluriel → sorties.', 'Emma and Julie: « We **___** with our friends. » (sortir = to go out)', 'Sortir with no direct object → être. Emma et Julie = feminine plural → sorties.'),
  etre('poubelle', 'Ce matin, j’**___** la poubelle. (sortir)', 'ai sorti', ['suis sorti', 'suis sortie', 'ai sortie'], 'Piège ! Avec un COD (« la poubelle »), sortir prend avoir.', 'This morning, I **___** the trash. (sortir = to take out)', 'Trap! With a direct object (« la poubelle »), sortir takes avoir.'),
  etre('enfants', 'Les enfants **___** à minuit. (rentrer)', 'sont rentrés', ['ont rentré', 'sont rentré', 'sont rentrées'], 'Rentrer → être. Les enfants = masculin pluriel → rentrés.', 'The children **___** home at midnight. (rentrer = to come home)', 'Rentrer → être. Les enfants = masculine plural → rentrés.'),
  etre('reveil', 'Elle **___** à sept heures. (se réveiller)', 's’est réveillée', ['a réveillé', 's’est réveillé', 's’a réveillée'], 'Les verbes pronominaux prennent toujours être. Elle → réveillée.', 'She **___** at seven o’clock. (se réveiller = to wake up)', 'Reflexive verbs always take être. Elle → réveillée.'),
  etre('promenade', 'Lucas et moi, nous **___** au parc. (se promener)', 'nous sommes promenés', ['nous avons promené', 'nous sommes promené', 'nous sommes promenées'], 'Verbe pronominal → être. Lucas et moi = masculin pluriel → promenés.', 'Lucas and I **___** in the park. (se promener = to go for a walk)', 'Reflexive verb → être. Lucas et moi = masculine plural → promenés.'),
  etre('coucher', 'Ils **___** tard hier soir. (se coucher)', 'se sont couchés', ['se sont couché', 'ont couché', 'se ont couchés'], 'Verbe pronominal → être. Ils → couchés.', 'They **___** late last night. (se coucher = to go to bed)', 'Reflexive verb → être. Ils → couchés.'),
  etre('train', 'Le train **___** par Lyon. (passer)', 'est passé', ['a passé', 'est passée', 'a passée'], '« Passer par » un lieu → être. Le train = masculin → passé.', 'The train **___** through Lyon. (passer = to go through)', '« Passer par » a place → être. Le train = masculine → passé.'),
  etre('bretagne', 'Nous **___** trois semaines en Bretagne. (passer)', 'avons passé', ['sommes passés', 'sommes passé', 'avons passés'], 'Piège ! « Passer du temps » a un COD (trois semaines) → avoir.', 'We **___** three weeks in Brittany. (passer = to spend)', 'Trap! « Passer du temps » has a direct object (trois semaines) → avoir.'),
  etre('marc', 'Marc, tu **___** en France l’année dernière ? (retourner)', 'es retourné', ['as retourné', 'es retournée', 'as retournée'], 'Retourner (sans COD) → être. Marc = masculin → retourné.', 'Marc, did you **___** to France last year? (retourner = to go back)', 'Retourner (with no direct object) → être. Marc = masculine → retourné.'),
  etre('fete', 'Elles **___** à la fête. (venir)', 'sont venues', ['ont venu', 'sont venus', 'sont venue'], 'Venir → être. Elles → venues.', 'They (f.) **___** to the party. (venir = to come)', 'Venir → être. Elles → venues.'),
  etre('cinema', 'Marie et Paul **___** au cinéma. (aller)', 'sont allés', ['sont allées', 'ont allé', 'sont allé'], 'Groupe mixte = masculin pluriel → allés.', 'Marie and Paul **___** to the movies. (aller = to go)', 'A mixed group = masculine plural → allés.'),
  etre('lettre', 'La lettre **___** hier. (arriver)', 'est arrivée', ['a arrivé', 'est arrivé', 'a arrivée'], 'Arriver → être. La lettre = féminin → arrivée.', 'The letter **___** yesterday. (arriver = to arrive)', 'Arriver → être. La lettre = feminine → arrivée.'),
  etre('parents', 'Mes parents **___** sans moi ! (partir)', 'sont partis', ['ont parti', 'sont parti', 'sont parties'], 'Partir → être. Mes parents = masculin pluriel → partis.', 'My parents **___** without me! (partir = to leave)', 'Partir → être. Mes parents = masculine plural → partis.'),
  etre('sophie', 'Sophie : « Hier, je **___** au lit toute la journée. » (rester)', 'suis restée', ['ai resté', 'suis resté', 'ai restée'], 'Rester → être. Sophie = féminin → restée.', 'Sophie: « Yesterday, I **___** in bed all day. » (rester = to stay)', 'Rester → être. Sophie = feminine → restée.'),
  etre('mara', 'Mara et Anisha **___** en 2010. (naître)', 'sont nées', ['ont né', 'sont nés', 'sont née'], 'Naître → être. Mara et Anisha = féminin pluriel → nées.', 'Mara and Anisha **___** in 2010. (naître = to be born)', 'Naître → être. Mara et Anisha = feminine plural → nées.'),
  etre('mains', 'Elle s’est **___** les mains. (laver)', 'lavé', ['lavée', 'lavés', 'lavées'], 'Piège ! Le COD « les mains » est placé après le verbe → pas d’accord.', 'She washed her hands: « Elle s’est **___** les mains. » (laver = to wash)', 'Trap! The direct object « les mains » comes after the verb → no agreement.', ['Accord ou pas ?', 'Agreement or not?']),
  etre('v', 'Dans DR & MRS VANDERTRAMP, que veut dire le **V** ?', 'venir', ['voir', 'vouloir', 'vivre'], 'V = Venir. Les autres (voir, vouloir, vivre) prennent avoir.', 'In DR & MRS VANDERTRAMP, what does the **V** stand for?', 'V = Venir (to come). The others (voir, vouloir, vivre) take avoir.', VDT),
  etre('n', 'Dans DR & MRS VANDERTRAMP, que veut dire le **N** ?', 'naître', ['nager', 'nettoyer', 'noter'], 'N = Naître : « je suis né(e) ».', 'In DR & MRS VANDERTRAMP, what does the **N** stand for?', 'N = Naître (to be born): « je suis né(e) ».', VDT),
  etre('t', 'Dans DR & MRS VANDERTRAMP, que veut dire le **T** ?', 'tomber', ['tenir', 'travailler', 'trouver'], 'T = Tomber : « je suis tombé(e) ».', 'In DR & MRS VANDERTRAMP, what does the **T** stand for?', 'T = Tomber (to fall): « je suis tombé(e) ».', VDT),
  etre('lequel', 'Lequel de ces verbes prend l’auxiliaire **être** ?', 'arriver', ['manger', 'finir', 'prendre'], 'Arriver fait partie de DR & MRS VANDERTRAMP.', 'Which of these verbs takes the helper verb **être**?', 'Arriver is one of the DR & MRS VANDERTRAMP verbs.', VDT),
  etre('lequel-avoir', 'Lequel de ces verbes prend l’auxiliaire **avoir** ?', 'dormir', ['partir', 'tomber', 'rester'], 'Dormir prend avoir : « j’ai dormi ». Partir, tomber et rester prennent être.', 'Which of these verbs takes the helper verb **avoir**?', 'Dormir takes avoir: « j’ai dormi ». Partir, tomber and rester take être.', VDT),
  etre('lequel-2', 'Lequel de ces verbes prend l’auxiliaire **être** ?', 'devenir', ['vivre', 'courir', 'voir'], 'Devenir = le D de DR & MRS VANDERTRAMP.', 'Which of these verbs takes the helper verb **être**?', 'Devenir = the D in DR & MRS VANDERTRAMP.', VDT),
];

// ─────────────────────────────────────────────────────────────
// ⏳  PASSÉ COMPOSÉ OU IMPARFAIT ?
// ─────────────────────────────────────────────────────────────

const TPS_ASK: Ask = ['PC ou imparfait ?', 'Passé composé or imparfait?'];
const SIGNAL: Ask = ['Mots-signaux', 'Signal words'];

const tps = (id: string, q: string, a: string, w: string[], x: string, qEn: string, xEn: string, ask: Ask = TPS_ASK): QuizCard => ({
  id: `tps-${id}`,
  cat: 'temps',
  ask: ask[0],
  q,
  a,
  w,
  x,
  en: { ask: ask[1], q: qEn, x: xEn },
});

export const TEMPS_CARDS: QuizCard[] = [
  tps('foot', 'Quand j’étais petit, je **___** au foot tous les samedis. (jouer)', 'jouais', ['ai joué', 'jouerai'], '« Tous les samedis » = une habitude dans le passé → imparfait.', 'When I was little, I **___** soccer every Saturday. (jouer = to play)', '« Tous les samedis » (every Saturday) = a habit in the past → imparfait.'),
  tps('telephone', 'Soudain, le téléphone **___**. (sonner)', 'a sonné', ['sonnait', 'sonne'], '« Soudain » = une action ponctuelle, soudaine → passé composé.', 'Suddenly, the phone **___**. (sonner = to ring)', '« Soudain » (suddenly) = a sudden, one-time action → passé composé.'),
  tps('beau', 'Il **___** beau et les oiseaux chantaient. (faire)', 'faisait', ['a fait', 'fera'], 'La météo et le décor = description → imparfait.', 'The weather **___** nice and the birds were singing. (faire beau = to be nice out)', 'Weather and setting = description → imparfait.'),
  tps('frere', 'Je lisais quand mon frère **___**. (entrer)', 'est entré', ['entrait', 'a entré'], 'Une action (entrer) interrompt une action en cours (je lisais) → passé composé.', 'I was reading when my brother **___**. (entrer = to come in)', 'An action (entrer) interrupts an action in progress (je lisais) → passé composé.'),
  tps('film', 'Hier soir, nous **___** un film, puis nous sommes allés au lit. (regarder)', 'avons regardé', ['regardions', 'regardons'], 'Une suite d’actions terminées (d’abord… puis…) → passé composé.', 'Last night, we **___** a movie, then we went to bed. (regarder = to watch)', 'A sequence of completed actions (first… then…) → passé composé.'),
  tps('gentille', 'Ma grand-mère **___** très gentille. (être)', 'était', ['a été', 'est été'], 'Description d’une personne → imparfait.', 'My grandmother **___** very kind. (être = to be)', 'Describing a person → imparfait.'),
  tps('paris', 'Thomas : « L’année dernière, je **___** à Paris une fois. » (aller)', 'suis allé', ['allais', 'ai allé'], '« Une fois » = une action unique et terminée → passé composé (avec être !).', 'Thomas: « Last year, I **___** to Paris once. » (aller = to go)', '« Une fois » (once) = a single, completed action → passé composé (with être!).'),
  tps('diner', 'Pendant que maman **___** le dîner, papa lisait le journal. (préparer)', 'préparait', ['a préparé', 'prépare'], '« Pendant que » + deux actions en cours en même temps → imparfait.', 'While Mom **___** dinner, Dad was reading the newspaper. (préparer = to make)', '« Pendant que » (while) + two actions in progress at the same time → imparfait.'),
  tps('minuit', 'Il **___** minuit quand nous sommes rentrés. (être)', 'était', ['a été', 'est'], 'L’heure = le contexte → imparfait.', 'It **___** midnight when we got home. (être = to be)', 'The time of day = context → imparfait.'),
  tps('bruit', 'Tout à coup, j’**___** un bruit. (entendre)', 'ai entendu', ['entendais', 'entends'], '« Tout à coup » = action soudaine → passé composé.', 'All of a sudden, I **___** a noise. (entendre = to hear)', '« Tout à coup » (all of a sudden) = a sudden action → passé composé.'),
  tps('bus', 'D’habitude, elle **___** le bus pour aller à l’école. (prendre)', 'prenait', ['a pris', 'prend'], '« D’habitude » = habitude → imparfait.', 'Usually, she **___** the bus to school. (prendre = to take)', '« D’habitude » (usually) = a habit → imparfait.'),
  tps('pone', 'Un jour, Old Pone **___** en courant ! (partir)', 'est parti', ['partait', 'a parti'], '« Un jour » = un événement précis → passé composé (partir prend être).', 'One day, Old Pone **___** at a run! (partir = to take off)', '« Un jour » (one day) = a specific event → passé composé (partir takes être).'),
  tps('chien', 'Quand j’avais douze ans, j’**___** un chien. (avoir)', 'avais', ['ai eu', 'aurai'], 'Un état qui dure, sans limite précise → imparfait.', 'When I was twelve, I **___** a dog. (avoir = to have)', 'An ongoing state with no precise limit → imparfait.'),
  tps('chicago', 'Nous **___** à Chicago pendant trois ans, puis nous avons déménagé. (habiter)', 'avons habité', ['habitions', 'habitons'], 'Piège ! « Pendant trois ans » = une durée limitée et terminée → passé composé.', 'We **___** in Chicago for three years, then we moved. (habiter = to live)', 'Trap! « Pendant trois ans » (for three years) = a limited, finished period → passé composé.'),
  tps('lever', 'Hugo : « Samedi dernier, je **___** à 10 h, puis j’ai mangé. » (se lever)', 'me suis levé', ['me levais', 'me lève'], 'Une action précise dans une suite d’actions → passé composé.', 'Hugo: « Last Saturday, I **___** at 10, then I ate. » (se lever = to get up)', 'A specific action in a sequence of actions → passé composé.'),
  tps('grandsparents', 'Chaque été, nous **___** visite à nos grands-parents. (rendre)', 'rendions', ['avons rendu', 'rendons'], '« Chaque été » = répétition → imparfait.', 'Every summer, we **___** our grandparents. (rendre visite = to visit)', '« Chaque été » (every summer) = repetition → imparfait.'),
  tps('neige', 'Il **___** quand je suis sorti. (neiger)', 'neigeait', ['a neigé', 'neige'], 'La météo = le décor de l’histoire → imparfait.', 'It **___** when I went out. (neiger = to snow)', 'Weather = the background of the story → imparfait.'),
  tps('aurora', 'En 2020, ma famille **___** à Aurora. (déménager)', 'a déménagé', ['déménageait', 'déménage'], 'Un événement unique, à une date précise → passé composé.', 'In 2020, my family **___** to Aurora. (déménager = to move)', 'A single event on a specific date → passé composé.'),
  tps('guitare', 'Je **___** dormir, mais mon frère jouait de la guitare. (vouloir)', 'voulais', ['ai voulu', 'veux'], 'Un désir, un état d’esprit dans le passé → imparfait.', 'I **___** to sleep, but my brother was playing the guitar. (vouloir = to want)', 'A wish or a state of mind in the past → imparfait.'),
  tps('ski', 'Quand il était jeune, mon père **___** du ski tous les hivers. (faire)', 'faisait', ['a fait', 'fait'], '« Tous les hivers » = habitude → imparfait.', 'When he was young, my father **___** every winter. (faire du ski = to ski)', '« Tous les hivers » (every winter) = a habit → imparfait.'),
  tps('devoirs', 'Ce matin, j’**___** mes devoirs à la maison ! (oublier)', 'ai oublié', ['oubliais', 'oublie'], 'Une action précise et terminée ce matin → passé composé.', 'This morning, I **___** my homework at home! (oublier = to forget)', 'A specific action, completed this morning → passé composé.'),
  tps('maison', 'La maison **___** grande et elle avait un jardin. (être)', 'était', ['a été', 'est été'], 'Description d’un lieu → imparfait.', 'The house **___** big and it had a garden. (être = to be)', 'Describing a place → imparfait.'),
  tps('alarme', 'Nous dormions quand l’alarme **___**. (sonner)', 'a sonné', ['sonnait', 'sonne'], 'L’alarme interrompt une action en cours → passé composé.', 'We were sleeping when the alarm **___**. (sonner = to go off)', 'The alarm interrupts an action in progress → passé composé.'),
  tps('danser', 'Quand je suis arrivé, mes amis **___** déjà. (danser)', 'dansaient', ['ont dansé', 'dansent'], 'Une action déjà en cours → imparfait.', 'When I arrived, my friends **___** already. (danser = to dance)', 'An action already in progress → imparfait.'),
  tps('prince', 'Le Petit Prince **___** sur une toute petite planète. (vivre)', 'vivait', ['a vécu', 'vit'], 'Description, situation de départ de l’histoire → imparfait.', 'The Little Prince **___** on a tiny planet. (vivre = to live)', 'Description, the starting situation of the story → imparfait.'),
  tps('bete', 'Chaque soir, la Bête **___** à Belle : « Voulez-vous être ma femme ? » (demander)', 'demandait', ['a demandé', 'demande'], '« Chaque soir » = une action répétée → imparfait.', 'Every evening, the Beast **___** Belle: « Will you be my wife? » (demander = to ask)', '« Chaque soir » (every evening) = a repeated action → imparfait.'),
  tps('signal-imp', 'Quelle expression annonce souvent l’**imparfait** ?', 'd’habitude', ['soudain', 'tout à coup', 'un jour'], 'D’habitude, souvent, tous les jours, quand j’étais petit… → imparfait.', 'Which expression often signals the **imparfait**?', 'D’habitude, souvent, tous les jours, quand j’étais petit… (usually, often, every day, when I was little) → imparfait.', SIGNAL),
  tps('signal-pc', 'Quelle expression annonce souvent le **passé composé** ?', 'soudain', ['souvent', 'tous les jours', 'd’habitude'], 'Soudain, tout à coup, un jour, hier, une fois… → passé composé.', 'Which expression often signals the **passé composé**?', 'Soudain, tout à coup, un jour, hier, une fois… (suddenly, all of a sudden, one day, yesterday, once) → passé composé.', SIGNAL),
  tps('signal-imp2', 'Quelle expression annonce souvent l’**imparfait** ?', 'autrefois', ['hier soir', 'une fois', 'tout à coup'], 'Autrefois = « dans le temps », habitude → imparfait.', 'Which expression often signals the **imparfait**?', 'Autrefois = « in the old days », a habit → imparfait.', SIGNAL),
];

// ─────────────────────────────────────────────────────────────
// 🔊  VOCABULAIRE, EXPRESSIONS, NOMBRES & ÉCOUTE
// ─────────────────────────────────────────────────────────────

const EXPR: Ask = ['Expression', 'Expression'];
const QUOT: Ask = ['La vie quotidienne', 'Daily life'];
const ROUT: Ask = ['La routine', 'Daily routine'];
const NUM: Ask = ['Les nombres', 'Numbers'];

const voc = (id: string, q: string, a: string, w: string[], x: string, qEn: string, xEn: string, ask: Ask = ['Vocabulaire', 'Vocabulary'], audio?: string): QuizCard => ({
  id: `voc-${id}`,
  cat: 'vocab',
  ask: ask[0],
  q,
  a,
  w,
  x,
  ...(audio ? { audio } : {}),
  en: { ask: ask[1], q: qEn, x: xEn },
});

const ecoute = (id: string, audio: string, a: string, w: string[], x: string, xEn: string): QuizCard =>
  voc(id, 'Écoute bien ! Qu’est-ce que tu entends ?', a, w, x, 'Listen carefully! What do you hear?', xEn, ['Écoute 🔊', 'Listening 🔊'], audio);

const meaning = (expr: string) => `What does « **${expr}** » mean?`;

export const VOCAB_CARDS: QuizCard[] = [
  ecoute('97', 'quatre-vingt-dix-sept', '97', ['87', '77', '417'], 'Quatre-vingt-dix-sept = 4 × 20 + 17 = 97.', 'Quatre-vingt-dix-sept = 4 × 20 + 17 = 97.'),
  ecoute('75', 'soixante-quinze', '75', ['65', '55', '615'], 'Soixante-quinze = 60 + 15 = 75.', 'Soixante-quinze = 60 + 15 = 75.'),
  ecoute('1984', 'mille neuf cent quatre-vingt-quatre', '1984', ['1994', '1884', '1974'], 'Mille neuf cent quatre-vingt-quatre = 1984.', 'Mille neuf cent quatre-vingt-quatre = 1984.'),
  ecoute('71', 'soixante et onze', '71', ['61', '81', '611'], 'Soixante et onze = 60 + 11 = 71.', 'Soixante et onze = 60 + 11 = 71.'),
  ecoute('poisson', 'du poisson', 'du poisson', ['du poison', 'une boisson', 'un poussin'], 'Poisson [s] (fish) ≠ poison [z]. Le double « s » se prononce [s].', 'Poisson [s] (fish) ≠ poison [z]. A double « s » is pronounced [s].'),
  ecoute('chevaux', 'des chevaux', 'des chevaux', ['des cheveux', 'un cheval', 'des chapeaux'], 'Chevaux (horses) ≠ cheveux (hair). Écoute bien le son [o].', 'Chevaux (horses) ≠ cheveux (hair). Listen for the [o] sound.'),
  ecoute('dessous', 'en dessous', 'en dessous', ['au-dessus', 'en douce', 'deux sous'], 'Dessous [u] = under ; dessus [y] = on top.', 'Dessous [u] = under; dessus [y] = on top.'),
  ecoute('sontvenus', 'Ils sont venus.', 'Ils sont venus.', ['Ils ont vu.', 'Il est venu.', 'Ils ont venu.'], '« Ils sont » [s] ≠ « ils ont » [z]. Venir prend être !', '« Ils sont » [s] ≠ « ils ont » [z]. Venir takes être!'),
  ecoute('vingt-trois', 'vingt-trois', '23', ['33', '13', '83'], 'Vingt-trois = 23.', 'Vingt-trois = 23.'),
  voc('cafard', 'Que veut dire « **avoir le cafard** » ?', 'être triste, déprimé', ['avoir un insecte', 'avoir très faim', 'être en retard'], 'Avoir le cafard = avoir le moral à zéro.', meaning('avoir le cafard'), 'Avoir le cafard = to feel down, to have the blues.', EXPR),
  voc('lapin', 'Que veut dire « **poser un lapin** à quelqu’un » ?', 'ne pas venir à un rendez-vous', ['offrir un cadeau', 'faire une blague', 'cuisiner un lapin'], '« Il m’a posé un lapin ! » = il n’est pas venu.', 'What does « **poser un lapin** à quelqu’un » mean?', '« Il m’a posé un lapin ! » = He stood me up!', EXPR),
  voc('yeux', 'Que veut dire « **coûter les yeux de la tête** » ?', 'coûter très cher', ['faire mal aux yeux', 'être gratuit', 'faire pleurer'], 'Ce téléphone coûte les yeux de la tête !', meaning('coûter les yeux de la tête'), '« Ce téléphone coûte les yeux de la tête ! » = This phone costs an arm and a leg!', EXPR),
  voc('flemme', 'Que veut dire « **avoir la flemme** » ?', 'ne pas avoir envie de faire quelque chose', ['avoir de la fièvre', 'être en colère', 'avoir peur du feu'], '« J’ai la flemme de faire mes devoirs… »', meaning('avoir la flemme'), '« J’ai la flemme de faire mes devoirs… » = I can’t be bothered to do my homework…', EXPR),
  voc('cordes', 'Que veut dire « **il pleut des cordes** » ?', 'il pleut très fort', ['il fait beau', 'il y a du vent', 'il neige un peu'], 'On dit aussi : « il pleut à verse ».', meaning('il pleut des cordes'), 'You can also say « il pleut à verse » = it’s pouring.', EXPR),
  voc('pommes', 'Que veut dire « **tomber dans les pommes** » ?', 's’évanouir', ['manger des fruits', 'tomber amoureux', 'faire la cuisine'], 'Il faisait si chaud qu’elle est tombée dans les pommes.', meaning('tomber dans les pommes'), '« Il faisait si chaud qu’elle est tombée dans les pommes. » = It was so hot that she fainted.', EXPR),
  voc('lune', 'Que veut dire « **être dans la lune** » ?', 'être distrait, rêveur', ['être astronaute', 'être très heureux', 'dormir la nuit'], '« Tu m’écoutes ? Tu es dans la lune ! »', meaning('être dans la lune'), '« Tu m’écoutes ? Tu es dans la lune ! » = Are you listening? Your head is in the clouds!', EXPR),
  voc('pieds', 'Que veut dire « **casser les pieds** à quelqu’un » ?', 'embêter, énerver quelqu’un', ['faire mal à quelqu’un', 'danser avec quelqu’un', 'marcher vite'], '« Arrête, tu me casses les pieds ! »', 'What does « **casser les pieds** à quelqu’un » mean?', '« Arrête, tu me casses les pieds ! » = Stop, you’re getting on my nerves!', EXPR),
  voc('grasse', 'Que veut dire « **faire la grasse matinée** » ?', 'dormir tard le matin', ['manger beaucoup le matin', 'faire du sport le matin', 'se lever très tôt'], 'Le dimanche, je fais la grasse matinée.', meaning('faire la grasse matinée'), '« Le dimanche, je fais la grasse matinée. » = On Sundays, I sleep in.', EXPR),
  voc('chat', 'Que veut dire « **avoir un chat dans la gorge** » ?', 'avoir la voix enrouée', ['avoir un animal', 'avoir très soif', 'parler trop vite'], 'Excusez-moi, j’ai un chat dans la gorge…', meaning('avoir un chat dans la gorge'), '« Excusez-moi, j’ai un chat dans la gorge… » = Excuse me, I have a frog in my throat…', EXPR),
  voc('librairie', 'Une **librairie**, c’est…', 'un magasin qui vend des livres', ['un endroit où on emprunte des livres', 'un laboratoire', 'une salle de classe'], 'Faux ami ! La librairie vend des livres ; on emprunte des livres à la bibliothèque.', 'A **librairie** is…', 'False friend! A librairie sells books (a bookstore); you borrow books at the bibliothèque (the library).', ['Faux ami', 'False friend']),
  voc('hate', 'Tu attends les vacances avec impatience. Tu dis :', 'J’ai hâte !', ['Je suis excité !', 'Je suis pressé !', 'J’ai faim !'], '« J’ai hâte » (ou « je suis impatient(e) ») est l’expression naturelle.', 'You can’t wait for vacation. You say:', '« J’ai hâte » (or « je suis impatient(e) ») is the natural way to say it.', EXPR),
  voc('dents', 'Le matin, je me brosse **___**.', 'les dents', ['mes dents', 'des dents', 'le dent'], 'Avec un verbe pronominal, on utilise l’article : je me brosse les dents.', 'In the morning, I brush my teeth: « Je me brosse **___**. »', 'With a reflexive verb, use the article: je me brosse les dents.', ROUT),
  voc('gouter', 'Comment s’appelle le petit repas de l’après-midi ?', 'le goûter', ['le déjeuner', 'le petit-déjeuner', 'le dîner'], 'En France, les enfants prennent le goûter vers 16 h.', 'What do you call the small afternoon meal?', 'In France, kids have their goûter (afternoon snack) around 4 p.m.', QUOT),
  voc('vaisselle', 'Après le dîner, je fais **___** vaisselle.', 'la', ['le', 'les', 'de'], 'Faire la vaisselle = laver les assiettes.', 'After dinner, I do the dishes: « Je fais **___** vaisselle. »', 'Faire la vaisselle = to wash the dishes.', QUOT),
  voc('courses', 'Que veut dire « **faire les courses** » ?', 'acheter à manger au magasin', ['courir un marathon', 'aller en cours', 'faire du vélo'], '« Je fais les courses au supermarché. »', meaning('faire les courses'), '« Je fais les courses au supermarché. » = I go grocery shopping at the supermarket.', QUOT),
  voc('table', 'Que veut dire « **mettre la table** » ?', 'préparer la table pour le repas', ['acheter une table', 'nettoyer la table', 's’asseoir à table'], 'On met les assiettes, les verres et les couverts.', meaning('mettre la table'), 'You set out the plates, glasses and silverware.', QUOT),
  voc('contraire', 'Quel est le contraire de « **se lever** » ?', 'se coucher', ['se réveiller', 's’habiller', 'se laver'], 'Le matin je me lève ; le soir je me couche.', 'What is the opposite of « **se lever** »?', 'In the morning I get up (je me lève); at night I go to bed (je me couche).', ROUT),
  voc('rentree', 'On dit « **Bonne rentrée !** »…', 'au début de l’année scolaire', ['au Nouvel An', 'à un anniversaire', 'avant de dormir'], 'La rentrée = le retour à l’école en septembre.', 'You say « **Bonne rentrée !** »…', 'La rentrée = going back to school in September.', QUOT),
  voc('chaud', 'Il fait 35 degrés. Tu dis :', 'J’ai chaud !', ['Je suis chaud !', 'Je fais chaud !', 'Il est chaud !'], 'Pour une sensation : avoir chaud, avoir froid.', 'It’s 35 °C (95 °F). You say:', 'For a feeling: avoir chaud (to feel hot), avoir froid (to feel cold).', EXPR),
  voc('sommeil', 'Il est minuit… J’**___** sommeil.', 'ai', ['suis', 'fais', 'vais'], 'Avoir sommeil, avoir faim, avoir soif, avoir peur…', 'It’s midnight… I’m sleepy: « J’**___** sommeil. »', 'Avoir sommeil, avoir faim, avoir soif, avoir peur… (to be sleepy, hungry, thirsty, scared)', EXPR),
  voc('80', 'Comment écrit-on **80** ?', 'quatre-vingts', ['quatre-vingt', 'quatre-dix', 'huit-dix'], '80 = quatre-vingts (avec un « s » car rien ne suit).', 'How do you write **80**?', '80 = quatre-vingts (with an « s » because nothing follows it).', NUM),
  voc('81', 'Comment écrit-on **81** ?', 'quatre-vingt-un', ['quatre-vingts-un', 'quatre-vingt-et-un', 'huit-dix-un'], '81 = quatre-vingt-un : pas de « s » ni de « et ».', 'How do you write **81**?', '81 = quatre-vingt-un: no « s » and no « et ».', NUM),
  voc('90', 'Combien font **soixante-dix + vingt** ?', 'quatre-vingt-dix', ['soixante-trente', 'cent', 'quatre-vingts'], '70 + 20 = 90 = quatre-vingt-dix.', 'What is **soixante-dix + vingt**?', '70 + 20 = 90 = quatre-vingt-dix.', NUM),
  voc('nerveuse', 'Quel est le féminin de « **nerveux** » ?', 'nerveuse', ['nerveuxe', 'nervieuse', 'nerveuses'], '-eux → -euse : heureux → heureuse, nerveux → nerveuse.', 'What is the feminine form of « **nerveux** »?', '-eux → -euse: heureux → heureuse, nerveux → nerveuse.', ['Grammaire', 'Grammar']),
];

// ─────────────────────────────────────────────────────────────
// 🎤  À TOI DE PARLER !  (les autres votent)
// ─────────────────────────────────────────────────────────────

type Focus = [fr: string, en: string];
const PC: Focus = ['Passé composé', 'Passé composé'];
const IMP: Focus = ['Imparfait', 'Imparfait'];
const PCI: Focus = ['Passé composé + imparfait', 'Passé composé + imparfait'];
const FUT: Focus = ['Futur proche', 'Futur proche (aller + infinitive)'];

const sp = (id: string, prompt: string, promptEn: string, focus: Focus, seconds = 45): SpeakCard => ({
  id: `sp-${id}`,
  prompt,
  focus: focus[0],
  seconds,
  en: { prompt: promptEn, focus: focus[1] },
});

export const SPEAK_CARDS: SpeakCard[] = [
  sp('weekend', 'Raconte ton week-end dernier. Donne au moins trois actions.', 'Tell us about last weekend. Give at least three actions.', PC),
  sp('chambre', 'Décris ta chambre quand tu avais dix ans.', 'Describe your bedroom when you were ten.', IMP),
  sp('peur', 'Raconte une fois où tu as eu très peur.', 'Tell us about a time you were really scared.', PCI),
  sp('etes', 'Qu’est-ce que tu faisais tous les étés quand tu étais petit(e) ?', 'What did you do every summer when you were little?', IMP),
  sp('hier', 'Raconte ta journée d’hier, du réveil au coucher.', 'Tell us about your day yesterday, from waking up to going to bed.', ['Verbes pronominaux au passé composé', 'Reflexive verbs in the passé composé']),
  sp('repas', 'Décris le meilleur repas de ton été : où, avec qui, et qu’est-ce que tu as mangé ?', 'Describe the best meal of your summer: where, with whom, and what did you eat?', PCI),
  sp('reunion', 'C’est ta réunion de dix ans à l’IMSA ! Raconte ce que tu faisais à l’IMSA.', 'It’s your 10-year IMSA reunion! Tell us what you used to do at IMSA.', IMP),
  sp('voyage', 'Raconte un voyage. Où es-tu allé(e) ? Quand es-tu parti(e) et rentré(e) ?', 'Tell us about a trip. Where did you go? When did you leave and come back?', ['Verbes avec être (aller, partir, arriver…)', 'Verbs with être (aller, partir, arriver…)']),
  sp('chaperon', 'Raconte l’histoire du Petit Chaperon rouge en cinq phrases.', 'Tell the story of Little Red Riding Hood in five sentences.', PCI),
  sp('futur', 'Qu’est-ce que tu vas faire ce week-end ?', 'What are you going to do this weekend?', ['Futur proche (aller + infinitif)', 'Futur proche (aller + infinitive)']),
  sp('ami', 'Décris ton meilleur ami ou ta meilleure amie d’enfance. Comment était cette personne ? Qu’est-ce que vous faisiez ensemble ?', 'Describe your best childhood friend. What was this person like? What did you do together?', IMP),
  sp('retard', 'Raconte une fois où tu es arrivé(e) en retard. Qu’est-ce qui s’est passé ?', 'Tell us about a time you were late. What happened?', PCI),
  sp('vandertramp', 'Invente une petite histoire avec cinq verbes de DR & MRS VANDERTRAMP.', 'Make up a short story with five DR & MRS VANDERTRAMP verbs.', ['Passé composé avec être', 'Passé composé with être']),
  sp('routine', 'Quelle était ta routine le matin l’année dernière ? Et ce matin, qu’est-ce que tu as fait ?', 'What was your morning routine last year? And this morning, what did you do?', ['Imparfait vs passé composé', 'Imparfait vs passé composé']),
  sp('pirejour', 'Raconte ton pire jour à l’école.', 'Tell us about your worst day at school.', PCI),
  sp('touriste', 'Tu es touriste à Paris. Raconte ce que tu as vu et fait hier.', 'You’re a tourist in Paris. Tell us what you saw and did yesterday.', PC),
  sp('ville', 'Décris ta ville natale quand tu étais petit(e). Qu’est-ce qui a changé ?', 'Describe your hometown when you were little. What has changed?', ['Imparfait + passé composé', 'Imparfait + passé composé']),
  sp('recette', 'Explique une recette que tu as déjà préparée : d’abord, ensuite, enfin…', 'Explain a recipe you’ve made before: first, next, finally…', PC),
  sp('animal', 'Hier, un animal est entré dans notre salle de classe ! Raconte.', 'Yesterday, an animal came into our classroom! Tell us what happened.', PCI),
  sp('questions', 'Pose trois questions au passé composé au joueur à ta gauche, qui doit répondre en français !', 'Ask the player on your left three questions in the passé composé — they have to answer in French!', ['Questions au passé composé', 'Questions in the passé composé'], 60),
  sp('filmdevine', 'Décris un film que tu as vu, sans dire son titre. Les autres devinent !', 'Describe a movie you’ve seen without saying its title. The others guess!', PCI, 60),
  sp('anniv', 'Raconte ton meilleur anniversaire. Quel âge avais-tu ? Qu’est-ce que tu as fait ?', 'Tell us about your best birthday. How old were you? What did you do?', PCI),
  sp('20h', 'Qu’est-ce que tu faisais hier à 20 h ? Et ensuite, qu’est-ce qui s’est passé ?', 'What were you doing yesterday at 8 p.m.? And then, what happened?', ['Imparfait puis passé composé', 'Imparfait, then passé composé']),
  sp('gagne', 'Tu as gagné un voyage en France ! Qu’est-ce que tu vas faire là-bas ?', 'You won a trip to France! What are you going to do there?', FUT),
  sp('prince', 'Tu as rencontré le Petit Prince hier. Raconte votre conversation.', 'You met the Little Prince yesterday. Tell us about your conversation.', PCI),
];

// ─────────────────────────────────────────────────────────────
// ☕  TOUR DE TABLE  (tout le monde répond, on vote)
// ─────────────────────────────────────────────────────────────

const tb = (id: string, prompt: string, promptEn: string, focus: Focus): TableCard => ({
  id: `tb-${id}`,
  prompt,
  focus: focus[0],
  en: { prompt: promptEn, focus: focus[1] },
});

export const TABLE_CARDS: TableCard[] = [
  tb('dessin', 'Quel était ton dessin animé préféré quand tu étais petit(e) ? Pourquoi ?', 'What was your favorite cartoon when you were little? Why?', IMP),
  tb('matin', 'Qu’est-ce que tu as mangé ce matin ?', 'What did you eat this morning?', PC),
  tb('bizarre', 'Quelle est la chose la plus bizarre que tu as faite cet été ? (Tu peux mentir — les autres devinent !)', 'What’s the weirdest thing you did this summer? (You can lie — the others guess!)', PC),
  tb('metier', 'Quand tu étais petit(e), qu’est-ce que tu voulais devenir ?', 'When you were little, what did you want to be?', IMP),
  tb('voyage', 'Raconte en deux phrases le meilleur voyage que tu as fait.', 'In two sentences, tell us about the best trip you’ve taken.', PCI),
  tb('chaine', 'Histoire à la chaîne ! Chacun ajoute une phrase : « Il était une fois un élève de l’IMSA qui… »', 'Chain story! Everyone adds one sentence: « Once upon a time, there was an IMSA student who… »', PCI),
  tb('dernierfilm', 'Quel est le dernier film que tu as vu ? Il était comment ?', 'What’s the last movie you saw? What was it like?', PCI),
  tb('samedi', 'Qu’est-ce que tu faisais le samedi matin quand tu avais huit ans ?', 'What did you do on Saturday mornings when you were eight?', IMP),
  tb('debat', 'Débat ! Les vacances d’été sont-elles trop longues ou trop courtes ? Pourquoi ?', 'Debate! Is summer vacation too long or too short? Why?', ['Donner son opinion', 'Giving your opinion']),
  tb('achat', 'Quelle est la meilleure chose que tu as achetée cette année ?', 'What’s the best thing you bought this year?', PC),
  tb('verites', 'Deux vérités et un mensonge — au passé composé ! Les autres devinent le mensonge.', 'Two truths and a lie — in the passé composé! The others guess the lie.', PC),
  tb('jouet', 'Quel était ton jouet préféré ? Décris-le.', 'What was your favorite toy? Describe it.', IMP),
  tb('apres', 'Qu’est-ce que tu vas faire après l’IMSA ?', 'What are you going to do after IMSA?', FUT),
  tb('chaine2', 'Histoire à la chaîne ! « Hier soir, pendant que je dormais… »', 'Chain story! « Last night, while I was sleeping… »', ['Imparfait + passé composé', 'Imparfait + passé composé']),
  tb('rire', 'Raconte une fois où tu as ri très fort.', 'Tell us about a time you laughed really hard.', PCI),
  tb('prof', 'Qui était ton prof préféré à l’école primaire ? Décris cette personne.', 'Who was your favorite elementary school teacher? Describe this person.', IMP),
];

// ─────────────────────────────────────────────────────────────
// ✨  SURPRISES
// ─────────────────────────────────────────────────────────────

export const EVENT_CARDS: EventCard[] = [
  { id: 'ev-greve', title: 'Grève à la SNCF !', text: 'Les trains ne roulent plus. Recule de 3 cases.', en: { title: 'Train strike!', text: 'The trains have stopped running. Move back 3 spaces.' }, effect: { kind: 'move', steps: -3 } },
  { id: 'ev-piece', title: 'Quelle chance !', text: 'Tu as trouvé 2 € par terre. Tu achètes un croissant : +1 🥐.', en: { title: 'Lucky you!', text: 'You found €2 on the ground. You buy a croissant: +1 🥐.' }, effect: { kind: 'score', amount: 1 } },
  { id: 'ev-avance', title: 'Le TGV est en avance !', text: 'Avance de 2 cases.', en: { title: 'The TGV is early!', text: 'Move forward 2 spaces.' }, effect: { kind: 'move', steps: 2 } },
  { id: 'ev-amende', title: 'Contrôle des billets !', text: 'Tu as oublié de composter ton billet. Amende : −1 🥐.', en: { title: 'Ticket inspection!', text: 'You forgot to validate your ticket. Fine: −1 🥐.' }, effect: { kind: 'score', amount: -1 } },
  { id: 'ev-anniv', title: 'Joyeux anniversaire !', text: 'Tout le monde te chante « Joyeux anniversaire » et chaque joueur te donne 1 🥐.', en: { title: 'Happy birthday!', text: 'Everyone sings you « Joyeux anniversaire » and each player gives you 1 🥐.' }, effect: { kind: 'birthday', amount: 1 } },
  { id: 'ev-piquenique', title: 'Pique-nique au bord de la Loire', text: 'Tout le monde partage le goûter : chaque joueur gagne +1 🥐.', en: { title: 'Picnic by the Loire', text: 'Everyone shares the snack: each player gets +1 🥐.' }, effect: { kind: 'everyone', amount: 1 } },
  { id: 'ev-beret', title: 'Le vent souffle…', text: 'Tu attrapes le béret du joueur en tête ! Il te donne 1 🥐.', en: { title: 'The wind is blowing…', text: 'You grab the leader’s beret! They give you 1 🥐.' }, effect: { kind: 'rob-leader', amount: 1 } },
  { id: 'ev-bouchon', title: 'Embouteillage sur le périphérique', text: 'Tu es coincé(e) dans les bouchons. Tu passes ton prochain tour.', en: { title: 'Traffic jam on the Paris ring road', text: 'You’re stuck in traffic. You skip your next turn.' }, effect: { kind: 'skip' } },
  { id: 'ev-rejoue', title: 'Correspondance parfaite !', text: 'Ton train part tout de suite. Relance le dé !', en: { title: 'Perfect connection!', text: 'Your train leaves right away. Roll again!' }, effect: { kind: 'again' } },
  { id: 'ev-boulangerie', title: 'La meilleure boulangerie de France', text: 'Le boulanger t’offre deux croissants : +2 🥐.', en: { title: 'The best bakery in France', text: 'The baker gives you two croissants: +2 🥐.' }, effect: { kind: 'score', amount: 2 } },
  { id: 'ev-pluie', title: 'Il pleut des cordes en Bretagne', text: 'Tu t’abrites dans un café. Recule d’une case.', en: { title: 'It’s pouring in Brittany', text: 'You take shelter in a café. Move back 1 space.' }, effect: { kind: 'move', steps: -1 } },
];

export const QUIZ_DECKS = {
  pp: PP_CARDS,
  etre: ETRE_CARDS,
  temps: TEMPS_CARDS,
  vocab: VOCAB_CARDS,
} as const;
