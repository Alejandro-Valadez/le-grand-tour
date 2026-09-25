import type { EventCard, QuizCard, SpeakCard, TableCard } from './types.js';

// ─────────────────────────────────────────────────────────────
// ✒️  PARTICIPES PASSÉS
// ─────────────────────────────────────────────────────────────

const pp = (inf: string, a: string, w: string[], x: string): QuizCard => ({
  id: `pp-${inf}`,
  cat: 'pp',
  ask: 'Participe passé',
  q: `Quel est le participe passé de **${inf}** ?`,
  a,
  w,
  x,
});

const ppPhrase = (id: string, q: string, a: string, w: string[], x: string): QuizCard => ({
  id: `pps-${id}`,
  cat: 'pp',
  ask: 'Complète la phrase',
  q,
  a,
  w,
  x,
});

const ppInf = (part: string, a: string, w: string[], x: string): QuizCard => ({
  id: `ppi-${part}`,
  cat: 'pp',
  ask: 'Retrouve l’infinitif',
  q: `« **${part}** » est le participe passé de quel verbe ?`,
  a,
  w,
  x,
});

export const PP_CARDS: QuizCard[] = [
  pp('apprendre', 'appris', ['apprendu', 'apprit', 'apprendé'], 'Les verbes en -prendre → -pris : prendre → pris, apprendre → appris, comprendre → compris.'),
  pp('prendre', 'pris', ['prendu', 'prit', 'prendé'], 'Prendre → pris. « J’ai pris le train. »'),
  pp('comprendre', 'compris', ['comprendu', 'comprit', 'comprendé'], 'Comprendre → compris. « Tu as compris ? »'),
  pp('mettre', 'mis', ['mettu', 'mit', 'metté'], 'Mettre → mis. Même famille : promettre → promis, permettre → permis.'),
  pp('promettre', 'promis', ['promettu', 'promit', 'prometté'], 'Promettre → promis. « Il a promis de venir. »'),
  pp('faire', 'fait', ['faité', 'fais', 'fit'], 'Faire → fait. « Qu’est-ce que tu as fait ce week-end ? »'),
  pp('dire', 'dit', ['disé', 'dis', 'diré'], 'Dire → dit. « Elle m’a dit bonjour. »'),
  pp('écrire', 'écrit', ['écrivé', 'écri', 'écrivu'], 'Écrire → écrit. Même chose pour décrire → décrit.'),
  pp('lire', 'lu', ['lit', 'lisé', 'liré'], 'Lire → lu. « J’ai lu Le Petit Prince. »'),
  pp('voir', 'vu', ['voyé', 'vit', 'voiré'], 'Voir → vu. « Nous avons vu la tour Eiffel. »'),
  pp('boire', 'bu', ['boivé', 'buvé', 'boit'], 'Boire → bu. « Nous avons bu du lait. »'),
  pp('croire', 'cru', ['croyé', 'croit', 'crué'], 'Croire → cru. « Je ne l’ai pas cru ! »'),
  pp('devoir', 'dû', ['devé', 'du', 'dut'], 'Devoir → dû (avec un accent circonflexe au masculin singulier, pour ne pas confondre avec « du »).'),
  pp('pouvoir', 'pu', ['pouvu', 'pouvé', 'put'], 'Pouvoir → pu. « Je n’ai pas pu venir. »'),
  pp('vouloir', 'voulu', ['voulé', 'voulit', 'voulut'], 'Vouloir → voulu. « Il a voulu partir. »'),
  pp('savoir', 'su', ['savé', 'savu', 'sut'], 'Savoir → su. « Je l’ai su trop tard. »'),
  pp('avoir', 'eu', ['avé', 'avu', 'eut'], 'Avoir → eu. « J’ai eu peur ! »'),
  pp('être', 'été', ['êté', 'étu', 'eté'], 'Être → été (auxiliaire avoir !) : « J’ai été malade. »'),
  pp('recevoir', 'reçu', ['recevé', 'recu', 'recevu'], 'Recevoir → reçu (avec une cédille).'),
  pp('venir', 'venu', ['vené', 'venit', 'vint'], 'Venir → venu. Avec être : « Elle est venue. »'),
  pp('devenir', 'devenu', ['devené', 'devint', 'devenit'], 'Devenir → devenu. C’est le D de DR & MRS VANDERTRAMP.'),
  pp('tenir', 'tenu', ['tené', 'tint', 'tenit'], 'Tenir → tenu. Même famille : obtenir → obtenu.'),
  pp('naître', 'né', ['naît', 'naissu', 'naquit'], 'Naître → né. « Je suis né(e) en 2010. »'),
  pp('mourir', 'mort', ['mouru', 'mouri', 'mouré'], 'Mourir → mort. « Il est mort en 1885. »'),
  pp('ouvrir', 'ouvert', ['ouvri', 'ouvré', 'ouvru'], 'Ouvrir → ouvert. Même famille : offrir → offert, découvrir → découvert.'),
  pp('offrir', 'offert', ['offri', 'offré', 'offru'], 'Offrir → offert. « Ils ont offert des prix. »'),
  pp('découvrir', 'découvert', ['découvri', 'découvré', 'découvru'], 'Découvrir → découvert.'),
  pp('courir', 'couru', ['couri', 'couré', 'courut'], 'Courir → couru. « J’ai couru un marathon. »'),
  pp('connaître', 'connu', ['connaît', 'connaissé', 'connut'], 'Connaître → connu. Même famille : reconnaître → reconnu.'),
  pp('vivre', 'vécu', ['vivé', 'vivu', 'vit'], 'Vivre → vécu. « Elle a vécu à Paris. »'),
  pp('suivre', 'suivi', ['suivu', 'suivé', 'suit'], 'Suivre → suivi. « Nous avons suivi le guide. »'),
  pp('conduire', 'conduit', ['conduisé', 'conduiré', 'conduu'], 'Conduire → conduit. Même famille : construire → construit, traduire → traduit.'),
  pp('peindre', 'peint', ['peindu', 'peigné', 'peindé'], 'Peindre → peint. Les verbes en -indre → -int : craindre → craint, rejoindre → rejoint.'),
  pp('rire', 'ri', ['rit', 'rié', 'riu'], 'Rire → ri. « On a beaucoup ri. »'),
  pp('pleuvoir', 'plu', ['pleuvu', 'pleuvé', 'plut'], 'Pleuvoir → plu. « Il a plu toute la nuit. »'),
  pp('falloir', 'fallu', ['fallé', 'faillu', 'fallut'], 'Falloir → fallu. « Il a fallu partir. »'),
  pp('s’asseoir', 'assis', ['asseyé', 'asseoiru', 'assoyé'], 'S’asseoir → assis. « Elle s’est assise. »'),
  pp('partir', 'parti', ['partu', 'parté', 'partit'], 'Partir → parti. Les verbes comme partir, sortir, dormir → -i.'),
  pp('attendre', 'attendu', ['attendi', 'attendé', 'attendit'], 'Les verbes en -re réguliers → -u : attendre → attendu, vendre → vendu.'),
  pp('perdre', 'perdu', ['perdi', 'perdé', 'perdit'], 'Perdre → perdu (verbe régulier en -re).'),
  pp('choisir', 'choisi', ['choisu', 'choisé', 'choisit'], 'Les verbes réguliers en -ir → -i : finir → fini, choisir → choisi.'),
  pp('battre', 'battu', ['batti', 'batté', 'battit'], 'Battre → battu.'),

  ppPhrase('nuit', 'Elle a **___** ce livre toute la nuit. (lire)', 'lu', ['lit', 'lisé', 'lue'], 'Lire → lu. Pas d’accord avec le sujet quand l’auxiliaire est avoir.'),
  ppPhrase('lettres', 'Tu as **___** les lettres de Margot ? (recevoir)', 'reçu', ['recevu', 'recevé', 'reçus'], 'Recevoir → reçu. Avec avoir, le participe ne s’accorde pas avec un COD placé après.'),
  ppPhrase('biscuits', 'Vous avez **___** combien de biscuits ? (prendre)', 'pris', ['prendu', 'pri', 'prendé'], 'Prendre → pris.'),
  ppPhrase('gateau', 'Tu as **___** un gâteau pour ta mère ? (faire)', 'fait', ['faire', 'faité', 'fais'], 'Faire → fait.'),
  ppPhrase('oiseaux', 'Henri et Léo ont **___** des oiseaux rares. (voir)', 'vu', ['vus', 'voyé', 'vit'], 'Voir → vu. Avec avoir, pas d’accord avec le sujet « Henri et Léo ».'),
  ppPhrase('chemise', 'Mon ami et moi avons **___** la même chemise. (mettre)', 'mis', ['mettu', 'mise', 'mettés'], 'Mettre → mis.'),
  ppPhrase('devoirs', 'Nous avons **___** beaucoup de devoirs. (avoir)', 'eu', ['avu', 'eus', 'avé'], 'Avoir → eu. « J’ai eu, tu as eu, nous avons eu… »'),
  ppPhrase('pluie', 'Il a **___** plus l’année dernière. (pleuvoir)', 'plu', ['pleuvu', 'pleut', 'pleuvé'], 'Pleuvoir → plu. Attention : plaire → plu aussi !'),
  ppPhrase('resultats', 'Les filles ont **___** les résultats hier. (apprendre)', 'appris', ['apprendu', 'apprises', 'apprendé'], 'Apprendre → appris. Pas d’accord avec le sujet (auxiliaire avoir).'),
  ppPhrase('dit', 'Qu’est-ce que tu as **___** à Lara ? (dire)', 'dit', ['dis', 'disé', 'dite'], 'Dire → dit.'),

  ppInf('su', 'savoir', ['suer', 'suivre', 'sortir'], '« Su » vient de savoir : j’ai su.'),
  ppInf('eu', 'avoir', ['être', 'aller', 'user'], '« Eu » vient de avoir : j’ai eu.'),
  ppInf('été', 'être', ['avoir', 'étudier', 'aller'], '« Été » vient de être : j’ai été.'),
  ppInf('né', 'naître', ['nager', 'nettoyer', 'nier'], '« Né » vient de naître : je suis né(e).'),
  ppInf('vécu', 'vivre', ['voir', 'venir', 'vaincre'], '« Vécu » vient de vivre : j’ai vécu.'),
  ppInf('bu', 'boire', ['battre', 'bouger', 'bâtir'], '« Bu » vient de boire : j’ai bu.'),
  ppInf('dû', 'devoir', ['dire', 'donner', 'durer'], '« Dû » vient de devoir : j’ai dû partir.'),
  ppInf('cru', 'croire', ['crier', 'croître', 'créer'], '« Cru » vient de croire : je l’ai cru.'),
  ppInf('mis', 'mettre', ['miser', 'mentir', 'manger'], '« Mis » vient de mettre : j’ai mis.'),
  ppInf('pu', 'pouvoir', ['plaire', 'punir', 'peindre'], '« Pu » vient de pouvoir : je n’ai pas pu.'),
];

// ─────────────────────────────────────────────────────────────
// 🏠  LA MAISON D'ÊTRE — DR & MRS VANDERTRAMP
// ─────────────────────────────────────────────────────────────

const etre = (id: string, q: string, a: string, w: string[], x: string, ask = 'Être ou avoir ?'): QuizCard => ({
  id: `etre-${id}`,
  cat: 'etre',
  ask,
  q,
  a,
  w,
  x,
});

export const ETRE_CARDS: QuizCard[] = [
  etre('marie', 'Hier, Marie **___** au marché. (aller)', 'est allée', ['a allé', 'est allé', 'a allée'], 'Aller → auxiliaire être. Marie = féminin singulier → allée.'),
  etre('frere', 'Mon frère et moi, nous **___** en retard. (arriver)', 'sommes arrivés', ['avons arrivé', 'sommes arrivé', 'sommes arrivées'], 'Arriver → être. « Mon frère et moi » = masculin pluriel → arrivés.'),
  etre('filles', 'Les filles **___** à huit heures. (partir)', 'sont parties', ['ont parti', 'sont partis', 'sont partie'], 'Partir → être. Les filles = féminin pluriel → parties.'),
  etre('grandpere', 'Mon grand-père **___** en 1950. (naître)', 'est né', ['a né', 'est née', 'a naît'], 'Naître → être. Grand-père = masculin singulier → né.'),
  etre('hugo', 'Victor Hugo **___** en 1885. (mourir)', 'est mort', ['a mouru', 'est mouru', 'a mort'], 'Mourir → être, participe irrégulier : mort.'),
  etre('paul', 'Paul : « Je **___** dans l’escalier ! » (tomber)', 'suis tombé', ['ai tombé', 'suis tombée', 'ai tombée'], 'Tomber → être. Paul = masculin → tombé.'),
  etre('elles', 'Elles **___** chez elles tout le week-end. (rester)', 'sont restées', ['ont resté', 'sont restés', 'sont resté'], 'Rester → être. Elles = féminin pluriel → restées.'),
  etre('chloe', 'Chloé, tu **___** du train à Lyon ? (descendre)', 'es descendue', ['as descendu', 'es descendu', 'as descendue'], 'Descendre (sans COD) → être. Chloé = féminin → descendue.'),
  etre('monsieur', 'Monsieur, vous **___** sans frapper ! (entrer)', 'êtes entré', ['avez entré', 'êtes entrés', 'êtes entrée'], 'Entrer → être. « Vous » de politesse pour un seul homme → entré (singulier).'),
  etre('ils', 'Ils **___** de vacances hier soir. (revenir)', 'sont revenus', ['ont revenu', 'sont revenu', 'sont revenues'], 'Revenir → être. Ils = masculin pluriel → revenus.'),
  etre('soeur', 'Ma sœur **___** médecin. (devenir)', 'est devenue', ['a devenu', 'est devenu', 'a devenue'], 'Devenir → être. Ma sœur = féminin → devenue.'),
  etre('lea-chambre', 'Léa **___** dans sa chambre. (monter)', 'est montée', ['a monté', 'est monté', 'a montée'], 'Monter sans COD → être. Léa = féminin → montée.'),
  etre('lea-valises', 'Léa **___** les valises au grenier. (monter)', 'a monté', ['est montée', 'est monté', 'a montée'], 'Piège ! Avec un COD (« les valises »), monter prend l’auxiliaire avoir. Pas d’accord.'),
  etre('emma', 'Emma et Julie : « Nous **___** avec nos amis. » (sortir)', 'sommes sorties', ['avons sorti', 'sommes sortis', 'sommes sortie'], 'Sortir sans COD → être. Emma et Julie = féminin pluriel → sorties.'),
  etre('poubelle', 'Ce matin, j’**___** la poubelle. (sortir)', 'ai sorti', ['suis sorti', 'suis sortie', 'ai sortie'], 'Piège ! Avec un COD (« la poubelle »), sortir prend avoir.'),
  etre('enfants', 'Les enfants **___** à minuit. (rentrer)', 'sont rentrés', ['ont rentré', 'sont rentré', 'sont rentrées'], 'Rentrer → être. Les enfants = masculin pluriel → rentrés.'),
  etre('reveil', 'Elle **___** à sept heures. (se réveiller)', 's’est réveillée', ['a réveillé', 's’est réveillé', 's’a réveillée'], 'Les verbes pronominaux prennent toujours être. Elle → réveillée.'),
  etre('promenade', 'Lucas et moi, nous **___** au parc. (se promener)', 'nous sommes promenés', ['nous avons promené', 'nous sommes promené', 'nous sommes promenées'], 'Verbe pronominal → être. Lucas et moi = masculin pluriel → promenés.'),
  etre('coucher', 'Ils **___** tard hier soir. (se coucher)', 'se sont couchés', ['se sont couché', 'ont couché', 'se ont couchés'], 'Verbe pronominal → être. Ils → couchés.'),
  etre('train', 'Le train **___** par Lyon. (passer)', 'est passé', ['a passé', 'est passée', 'a passée'], '« Passer par » un lieu → être. Le train = masculin → passé.'),
  etre('bretagne', 'Nous **___** trois semaines en Bretagne. (passer)', 'avons passé', ['sommes passés', 'sommes passé', 'avons passés'], 'Piège ! « Passer du temps » a un COD (trois semaines) → avoir.'),
  etre('marc', 'Marc, tu **___** en France l’année dernière ? (retourner)', 'es retourné', ['as retourné', 'es retournée', 'as retournée'], 'Retourner (sans COD) → être. Marc = masculin → retourné.'),
  etre('fete', 'Elles **___** à la fête. (venir)', 'sont venues', ['ont venu', 'sont venus', 'sont venue'], 'Venir → être. Elles → venues.'),
  etre('cinema', 'Marie et Paul **___** au cinéma. (aller)', 'sont allés', ['sont allées', 'ont allé', 'sont allé'], 'Groupe mixte = masculin pluriel → allés.'),
  etre('lettre', 'La lettre **___** hier. (arriver)', 'est arrivée', ['a arrivé', 'est arrivé', 'a arrivée'], 'Arriver → être. La lettre = féminin → arrivée.'),
  etre('parents', 'Mes parents **___** sans moi ! (partir)', 'sont partis', ['ont parti', 'sont parti', 'sont parties'], 'Partir → être. Mes parents = masculin pluriel → partis.'),
  etre('sophie', 'Sophie : « Hier, je **___** au lit toute la journée. » (rester)', 'suis restée', ['ai resté', 'suis resté', 'ai restée'], 'Rester → être. Sophie = féminin → restée.'),
  etre('mara', 'Mara et Anisha **___** en 2010. (naître)', 'sont nées', ['ont né', 'sont nés', 'sont née'], 'Naître → être. Mara et Anisha = féminin pluriel → nées.'),
  etre('mains', 'Elle s’est **___** les mains. (laver)', 'lavé', ['lavée', 'lavés', 'lavées'], 'Piège ! Le COD « les mains » est placé après le verbe → pas d’accord.', 'Accord ou pas ?'),
  etre('v', 'Dans DR & MRS VANDERTRAMP, que veut dire le **V** ?', 'venir', ['voir', 'vouloir', 'vivre'], 'V = Venir. Les autres (voir, vouloir, vivre) prennent avoir.', 'VANDERTRAMP'),
  etre('n', 'Dans DR & MRS VANDERTRAMP, que veut dire le **N** ?', 'naître', ['nager', 'nettoyer', 'noter'], 'N = Naître : « je suis né(e) ».', 'VANDERTRAMP'),
  etre('t', 'Dans DR & MRS VANDERTRAMP, que veut dire le **T** ?', 'tomber', ['tenir', 'travailler', 'trouver'], 'T = Tomber : « je suis tombé(e) ».', 'VANDERTRAMP'),
  etre('lequel', 'Lequel de ces verbes prend l’auxiliaire **être** ?', 'arriver', ['manger', 'finir', 'prendre'], 'Arriver fait partie de DR & MRS VANDERTRAMP.', 'VANDERTRAMP'),
  etre('lequel-avoir', 'Lequel de ces verbes prend l’auxiliaire **avoir** ?', 'dormir', ['partir', 'tomber', 'rester'], 'Dormir prend avoir : « j’ai dormi ». Partir, tomber et rester prennent être.', 'VANDERTRAMP'),
  etre('lequel-2', 'Lequel de ces verbes prend l’auxiliaire **être** ?', 'devenir', ['vivre', 'courir', 'voir'], 'Devenir = le D de DR & MRS VANDERTRAMP.', 'VANDERTRAMP'),
];

// ─────────────────────────────────────────────────────────────
// ⏳  PASSÉ COMPOSÉ OU IMPARFAIT ?
// ─────────────────────────────────────────────────────────────

const tps = (id: string, q: string, a: string, w: string[], x: string, ask = 'PC ou imparfait ?'): QuizCard => ({
  id: `tps-${id}`,
  cat: 'temps',
  ask,
  q,
  a,
  w,
  x,
});

export const TEMPS_CARDS: QuizCard[] = [
  tps('foot', 'Quand j’étais petit, je **___** au foot tous les samedis. (jouer)', 'jouais', ['ai joué', 'jouerai'], '« Tous les samedis » = une habitude dans le passé → imparfait.'),
  tps('telephone', 'Soudain, le téléphone **___**. (sonner)', 'a sonné', ['sonnait', 'sonne'], '« Soudain » = une action ponctuelle, soudaine → passé composé.'),
  tps('beau', 'Il **___** beau et les oiseaux chantaient. (faire)', 'faisait', ['a fait', 'fera'], 'La météo et le décor = description → imparfait.'),
  tps('frere', 'Je lisais quand mon frère **___**. (entrer)', 'est entré', ['entrait', 'a entré'], 'Une action (entrer) interrompt une action en cours (je lisais) → passé composé.'),
  tps('film', 'Hier soir, nous **___** un film, puis nous sommes allés au lit. (regarder)', 'avons regardé', ['regardions', 'regardons'], 'Une suite d’actions terminées (d’abord… puis…) → passé composé.'),
  tps('gentille', 'Ma grand-mère **___** très gentille. (être)', 'était', ['a été', 'est été'], 'Description d’une personne → imparfait.'),
  tps('paris', 'Thomas : « L’année dernière, je **___** à Paris une fois. » (aller)', 'suis allé', ['allais', 'ai allé'], '« Une fois » = une action unique et terminée → passé composé (avec être !).'),
  tps('diner', 'Pendant que maman **___** le dîner, papa lisait le journal. (préparer)', 'préparait', ['a préparé', 'prépare'], '« Pendant que » + deux actions en cours en même temps → imparfait.'),
  tps('minuit', 'Il **___** minuit quand nous sommes rentrés. (être)', 'était', ['a été', 'est'], 'L’heure = le contexte → imparfait.'),
  tps('bruit', 'Tout à coup, j’**___** un bruit. (entendre)', 'ai entendu', ['entendais', 'entends'], '« Tout à coup » = action soudaine → passé composé.'),
  tps('bus', 'D’habitude, elle **___** le bus pour aller à l’école. (prendre)', 'prenait', ['a pris', 'prend'], '« D’habitude » = habitude → imparfait.'),
  tps('pone', 'Un jour, Old Pone **___** en courant ! (partir)', 'est parti', ['partait', 'a parti'], '« Un jour » = un événement précis → passé composé (partir prend être).'),
  tps('chien', 'Quand j’avais douze ans, j’**___** un chien. (avoir)', 'avais', ['ai eu', 'aurai'], 'Un état qui dure, sans limite précise → imparfait.'),
  tps('chicago', 'Nous **___** à Chicago pendant trois ans, puis nous avons déménagé. (habiter)', 'avons habité', ['habitions', 'habitons'], 'Piège ! « Pendant trois ans » = une durée limitée et terminée → passé composé.'),
  tps('lever', 'Hugo : « Samedi dernier, je **___** à 10 h, puis j’ai mangé. » (se lever)', 'me suis levé', ['me levais', 'me lève'], 'Une action précise dans une suite d’actions → passé composé.'),
  tps('grandsparents', 'Chaque été, nous **___** visite à nos grands-parents. (rendre)', 'rendions', ['avons rendu', 'rendons'], '« Chaque été » = répétition → imparfait.'),
  tps('neige', 'Il **___** quand je suis sorti. (neiger)', 'neigeait', ['a neigé', 'neige'], 'La météo = le décor de l’histoire → imparfait.'),
  tps('aurora', 'En 2020, ma famille **___** à Aurora. (déménager)', 'a déménagé', ['déménageait', 'déménage'], 'Un événement unique, à une date précise → passé composé.'),
  tps('guitare', 'Je **___** dormir, mais mon frère jouait de la guitare. (vouloir)', 'voulais', ['ai voulu', 'veux'], 'Un désir, un état d’esprit dans le passé → imparfait.'),
  tps('ski', 'Quand il était jeune, mon père **___** du ski tous les hivers. (faire)', 'faisait', ['a fait', 'fait'], '« Tous les hivers » = habitude → imparfait.'),
  tps('devoirs', 'Ce matin, j’**___** mes devoirs à la maison ! (oublier)', 'ai oublié', ['oubliais', 'oublie'], 'Une action précise et terminée ce matin → passé composé.'),
  tps('maison', 'La maison **___** grande et elle avait un jardin. (être)', 'était', ['a été', 'est été'], 'Description d’un lieu → imparfait.'),
  tps('alarme', 'Nous dormions quand l’alarme **___**. (sonner)', 'a sonné', ['sonnait', 'sonne'], 'L’alarme interrompt une action en cours → passé composé.'),
  tps('danser', 'Quand je suis arrivé, mes amis **___** déjà. (danser)', 'dansaient', ['ont dansé', 'dansent'], 'Une action déjà en cours → imparfait.'),
  tps('prince', 'Le Petit Prince **___** sur une toute petite planète. (vivre)', 'vivait', ['a vécu', 'vit'], 'Description, situation de départ de l’histoire → imparfait.'),
  tps('bete', 'Chaque soir, la Bête **___** à Belle : « Voulez-vous être ma femme ? » (demander)', 'demandait', ['a demandé', 'demande'], '« Chaque soir » = une action répétée → imparfait.'),
  tps('signal-imp', 'Quelle expression annonce souvent l’**imparfait** ?', 'd’habitude', ['soudain', 'tout à coup', 'un jour'], 'D’habitude, souvent, tous les jours, quand j’étais petit… → imparfait.', 'Mots-signaux'),
  tps('signal-pc', 'Quelle expression annonce souvent le **passé composé** ?', 'soudain', ['souvent', 'tous les jours', 'd’habitude'], 'Soudain, tout à coup, un jour, hier, une fois… → passé composé.', 'Mots-signaux'),
  tps('signal-imp2', 'Quelle expression annonce souvent l’**imparfait** ?', 'autrefois', ['hier soir', 'une fois', 'tout à coup'], 'Autrefois = « dans le temps », habitude → imparfait.', 'Mots-signaux'),
];

// ─────────────────────────────────────────────────────────────
// 🔊  VOCABULAIRE, EXPRESSIONS, NOMBRES & ÉCOUTE
// ─────────────────────────────────────────────────────────────

const voc = (id: string, q: string, a: string, w: string[], x: string, ask = 'Vocabulaire', audio?: string): QuizCard => ({
  id: `voc-${id}`,
  cat: 'vocab',
  ask,
  q,
  a,
  w,
  x,
  ...(audio ? { audio } : {}),
});

const ecoute = (id: string, audio: string, a: string, w: string[], x: string): QuizCard =>
  voc(id, 'Écoute bien ! Qu’est-ce que tu entends ?', a, w, x, 'Écoute 🔊', audio);

export const VOCAB_CARDS: QuizCard[] = [
  ecoute('97', 'quatre-vingt-dix-sept', '97', ['87', '77', '417'], 'Quatre-vingt-dix-sept = 4 × 20 + 17 = 97.'),
  ecoute('75', 'soixante-quinze', '75', ['65', '55', '615'], 'Soixante-quinze = 60 + 15 = 75.'),
  ecoute('1984', 'mille neuf cent quatre-vingt-quatre', '1984', ['1994', '1884', '1974'], 'Mille neuf cent quatre-vingt-quatre = 1984.'),
  ecoute('71', 'soixante et onze', '71', ['61', '81', '611'], 'Soixante et onze = 60 + 11 = 71.'),
  ecoute('poisson', 'du poisson', 'du poisson', ['du poison', 'une boisson', 'un poussin'], 'Poisson [s] (fish) ≠ poison [z]. Le double « s » se prononce [s].'),
  ecoute('chevaux', 'des chevaux', 'des chevaux', ['des cheveux', 'un cheval', 'des chapeaux'], 'Chevaux (horses) ≠ cheveux (hair). Écoute bien le son [o].'),
  ecoute('dessous', 'en dessous', 'en dessous', ['au-dessus', 'en douce', 'deux sous'], 'Dessous [u] = under ; dessus [y] = on top.'),
  ecoute('sontvenus', 'Ils sont venus.', 'Ils sont venus.', ['Ils ont vu.', 'Il est venu.', 'Ils ont venu.'], '« Ils sont » [s] ≠ « ils ont » [z]. Venir prend être !'),
  ecoute('vingt-trois', 'vingt-trois', '23', ['33', '13', '83'], 'Vingt-trois = 23.'),
  voc('cafard', 'Que veut dire « **avoir le cafard** » ?', 'être triste, déprimé', ['avoir un insecte', 'avoir très faim', 'être en retard'], 'Avoir le cafard = avoir le moral à zéro.', 'Expression'),
  voc('lapin', 'Que veut dire « **poser un lapin** à quelqu’un » ?', 'ne pas venir à un rendez-vous', ['offrir un cadeau', 'faire une blague', 'cuisiner un lapin'], '« Il m’a posé un lapin ! » = il n’est pas venu.', 'Expression'),
  voc('yeux', 'Que veut dire « **coûter les yeux de la tête** » ?', 'coûter très cher', ['faire mal aux yeux', 'être gratuit', 'faire pleurer'], 'Ce téléphone coûte les yeux de la tête !', 'Expression'),
  voc('flemme', 'Que veut dire « **avoir la flemme** » ?', 'ne pas avoir envie de faire quelque chose', ['avoir de la fièvre', 'être en colère', 'avoir peur du feu'], '« J’ai la flemme de faire mes devoirs… »', 'Expression'),
  voc('cordes', 'Que veut dire « **il pleut des cordes** » ?', 'il pleut très fort', ['il fait beau', 'il y a du vent', 'il neige un peu'], 'On dit aussi : « il pleut à verse ».', 'Expression'),
  voc('pommes', 'Que veut dire « **tomber dans les pommes** » ?', 's’évanouir', ['manger des fruits', 'tomber amoureux', 'faire la cuisine'], 'Il faisait si chaud qu’elle est tombée dans les pommes.', 'Expression'),
  voc('lune', 'Que veut dire « **être dans la lune** » ?', 'être distrait, rêveur', ['être astronaute', 'être très heureux', 'dormir la nuit'], '« Tu m’écoutes ? Tu es dans la lune ! »', 'Expression'),
  voc('pieds', 'Que veut dire « **casser les pieds** à quelqu’un » ?', 'embêter, énerver quelqu’un', ['faire mal à quelqu’un', 'danser avec quelqu’un', 'marcher vite'], '« Arrête, tu me casses les pieds ! »', 'Expression'),
  voc('grasse', 'Que veut dire « **faire la grasse matinée** » ?', 'dormir tard le matin', ['manger beaucoup le matin', 'faire du sport le matin', 'se lever très tôt'], 'Le dimanche, je fais la grasse matinée.', 'Expression'),
  voc('chat', 'Que veut dire « **avoir un chat dans la gorge** » ?', 'avoir la voix enrouée', ['avoir un animal', 'avoir très soif', 'parler trop vite'], 'Excusez-moi, j’ai un chat dans la gorge…', 'Expression'),
  voc('librairie', 'Une **librairie**, c’est…', 'un magasin qui vend des livres', ['un endroit où on emprunte des livres', 'un laboratoire', 'une salle de classe'], 'Faux ami ! La librairie vend des livres ; on emprunte des livres à la bibliothèque.', 'Faux ami'),
  voc('hate', 'Tu attends les vacances avec impatience. Tu dis :', 'J’ai hâte !', ['Je suis excité !', 'Je suis pressé !', 'J’ai faim !'], '« J’ai hâte » (ou « je suis impatient(e) ») est l’expression naturelle.', 'Expression'),
  voc('dents', 'Le matin, je me brosse **___**.', 'les dents', ['mes dents', 'des dents', 'le dent'], 'Avec un verbe pronominal, on utilise l’article : je me brosse les dents.', 'La routine'),
  voc('gouter', 'Comment s’appelle le petit repas de l’après-midi ?', 'le goûter', ['le déjeuner', 'le petit-déjeuner', 'le dîner'], 'En France, les enfants prennent le goûter vers 16 h.', 'La vie quotidienne'),
  voc('vaisselle', 'Après le dîner, je fais **___** vaisselle.', 'la', ['le', 'les', 'de'], 'Faire la vaisselle = laver les assiettes.', 'La vie quotidienne'),
  voc('courses', 'Que veut dire « **faire les courses** » ?', 'acheter à manger au magasin', ['courir un marathon', 'aller en cours', 'faire du vélo'], '« Je fais les courses au supermarché. »', 'La vie quotidienne'),
  voc('table', 'Que veut dire « **mettre la table** » ?', 'préparer la table pour le repas', ['acheter une table', 'nettoyer la table', 's’asseoir à table'], 'On met les assiettes, les verres et les couverts.', 'La vie quotidienne'),
  voc('contraire', 'Quel est le contraire de « **se lever** » ?', 'se coucher', ['se réveiller', 's’habiller', 'se laver'], 'Le matin je me lève ; le soir je me couche.', 'La routine'),
  voc('rentree', 'On dit « **Bonne rentrée !** »…', 'au début de l’année scolaire', ['au Nouvel An', 'à un anniversaire', 'avant de dormir'], 'La rentrée = le retour à l’école en septembre.', 'La vie quotidienne'),
  voc('chaud', 'Il fait 35 degrés. Tu dis :', 'J’ai chaud !', ['Je suis chaud !', 'Je fais chaud !', 'Il est chaud !'], 'Pour une sensation : avoir chaud, avoir froid.', 'Expression'),
  voc('sommeil', 'Il est minuit… J’**___** sommeil.', 'ai', ['suis', 'fais', 'vais'], 'Avoir sommeil, avoir faim, avoir soif, avoir peur…', 'Expression'),
  voc('80', 'Comment écrit-on **80** ?', 'quatre-vingts', ['quatre-vingt', 'quatre-dix', 'huit-dix'], '80 = quatre-vingts (avec un « s » car rien ne suit).', 'Les nombres'),
  voc('81', 'Comment écrit-on **81** ?', 'quatre-vingt-un', ['quatre-vingts-un', 'quatre-vingt-et-un', 'huit-dix-un'], '81 = quatre-vingt-un : pas de « s » ni de « et ».', 'Les nombres'),
  voc('90', 'Combien font **soixante-dix + vingt** ?', 'quatre-vingt-dix', ['soixante-trente', 'cent', 'quatre-vingts'], '70 + 20 = 90 = quatre-vingt-dix.', 'Les nombres'),
  voc('nerveuse', 'Quel est le féminin de « **nerveux** » ?', 'nerveuse', ['nerveuxe', 'nervieuse', 'nerveuses'], '-eux → -euse : heureux → heureuse, nerveux → nerveuse.', 'Grammaire'),
];

// ─────────────────────────────────────────────────────────────
// 🎤  À TOI DE PARLER !  (les autres votent)
// ─────────────────────────────────────────────────────────────

const sp = (id: string, prompt: string, focus: string, seconds = 45): SpeakCard => ({ id: `sp-${id}`, prompt, focus, seconds });

export const SPEAK_CARDS: SpeakCard[] = [
  sp('weekend', 'Raconte ton week-end dernier. Donne au moins trois actions.', 'Passé composé'),
  sp('chambre', 'Décris ta chambre quand tu avais dix ans.', 'Imparfait'),
  sp('peur', 'Raconte une fois où tu as eu très peur.', 'Passé composé + imparfait'),
  sp('etes', 'Qu’est-ce que tu faisais tous les étés quand tu étais petit(e) ?', 'Imparfait'),
  sp('hier', 'Raconte ta journée d’hier, du réveil au coucher.', 'Verbes pronominaux au passé composé'),
  sp('repas', 'Décris le meilleur repas de ton été : où, avec qui, et qu’est-ce que tu as mangé ?', 'Passé composé + imparfait'),
  sp('reunion', 'C’est ta réunion de dix ans à l’IMSA ! Raconte ce que tu faisais à l’IMSA.', 'Imparfait'),
  sp('voyage', 'Raconte un voyage. Où es-tu allé(e) ? Quand es-tu parti(e) et rentré(e) ?', 'Verbes avec être (aller, partir, arriver…)'),
  sp('chaperon', 'Raconte l’histoire du Petit Chaperon rouge en cinq phrases.', 'Passé composé + imparfait'),
  sp('futur', 'Qu’est-ce que tu vas faire ce week-end ?', 'Futur proche (aller + infinitif)'),
  sp('ami', 'Décris ton meilleur ami ou ta meilleure amie d’enfance. Comment était cette personne ? Qu’est-ce que vous faisiez ensemble ?', 'Imparfait'),
  sp('retard', 'Raconte une fois où tu es arrivé(e) en retard. Qu’est-ce qui s’est passé ?', 'Passé composé + imparfait'),
  sp('vandertramp', 'Invente une petite histoire avec cinq verbes de DR & MRS VANDERTRAMP.', 'Passé composé avec être'),
  sp('routine', 'Quelle était ta routine le matin l’année dernière ? Et ce matin, qu’est-ce que tu as fait ?', 'Imparfait vs passé composé'),
  sp('pirejour', 'Raconte ton pire jour à l’école.', 'Passé composé + imparfait'),
  sp('touriste', 'Tu es touriste à Paris. Raconte ce que tu as vu et fait hier.', 'Passé composé'),
  sp('ville', 'Décris ta ville natale quand tu étais petit(e). Qu’est-ce qui a changé ?', 'Imparfait + passé composé'),
  sp('recette', 'Explique une recette que tu as déjà préparée : d’abord, ensuite, enfin…', 'Passé composé'),
  sp('animal', 'Hier, un animal est entré dans notre salle de classe ! Raconte.', 'Passé composé + imparfait'),
  sp('questions', 'Pose trois questions au passé composé au joueur à ta gauche, qui doit répondre en français !', 'Questions au passé composé', 60),
  sp('filmdevine', 'Décris un film que tu as vu, sans dire son titre. Les autres devinent !', 'Passé composé + imparfait', 60),
  sp('anniv', 'Raconte ton meilleur anniversaire. Quel âge avais-tu ? Qu’est-ce que tu as fait ?', 'Passé composé + imparfait'),
  sp('20h', 'Qu’est-ce que tu faisais hier à 20 h ? Et ensuite, qu’est-ce qui s’est passé ?', 'Imparfait puis passé composé'),
  sp('gagne', 'Tu as gagné un voyage en France ! Qu’est-ce que tu vas faire là-bas ?', 'Futur proche'),
  sp('prince', 'Tu as rencontré le Petit Prince hier. Raconte votre conversation.', 'Passé composé + imparfait'),
];

// ─────────────────────────────────────────────────────────────
// ☕  TOUR DE TABLE  (tout le monde répond, on vote)
// ─────────────────────────────────────────────────────────────

const tb = (id: string, prompt: string, focus: string): TableCard => ({ id: `tb-${id}`, prompt, focus });

export const TABLE_CARDS: TableCard[] = [
  tb('dessin', 'Quel était ton dessin animé préféré quand tu étais petit(e) ? Pourquoi ?', 'Imparfait'),
  tb('matin', 'Qu’est-ce que tu as mangé ce matin ?', 'Passé composé'),
  tb('bizarre', 'Quelle est la chose la plus bizarre que tu as faite cet été ? (Tu peux mentir — les autres devinent !)', 'Passé composé'),
  tb('metier', 'Quand tu étais petit(e), qu’est-ce que tu voulais devenir ?', 'Imparfait'),
  tb('voyage', 'Raconte en deux phrases le meilleur voyage que tu as fait.', 'Passé composé + imparfait'),
  tb('chaine', 'Histoire à la chaîne ! Chacun ajoute une phrase : « Il était une fois un élève de l’IMSA qui… »', 'Passé composé + imparfait'),
  tb('dernierfilm', 'Quel est le dernier film que tu as vu ? Il était comment ?', 'Passé composé + imparfait'),
  tb('samedi', 'Qu’est-ce que tu faisais le samedi matin quand tu avais huit ans ?', 'Imparfait'),
  tb('debat', 'Débat ! Les vacances d’été sont-elles trop longues ou trop courtes ? Pourquoi ?', 'Donner son opinion'),
  tb('achat', 'Quelle est la meilleure chose que tu as achetée cette année ?', 'Passé composé'),
  tb('verites', 'Deux vérités et un mensonge — au passé composé ! Les autres devinent le mensonge.', 'Passé composé'),
  tb('jouet', 'Quel était ton jouet préféré ? Décris-le.', 'Imparfait'),
  tb('apres', 'Qu’est-ce que tu vas faire après l’IMSA ?', 'Futur proche'),
  tb('chaine2', 'Histoire à la chaîne ! « Hier soir, pendant que je dormais… »', 'Imparfait + passé composé'),
  tb('rire', 'Raconte une fois où tu as ri très fort.', 'Passé composé + imparfait'),
  tb('prof', 'Qui était ton prof préféré à l’école primaire ? Décris cette personne.', 'Imparfait'),
];

// ─────────────────────────────────────────────────────────────
// ✨  SURPRISES
// ─────────────────────────────────────────────────────────────

export const EVENT_CARDS: EventCard[] = [
  { id: 'ev-greve', title: 'Grève à la SNCF !', text: 'Les trains ne roulent plus. Recule de 3 cases.', effect: { kind: 'move', steps: -3 } },
  { id: 'ev-piece', title: 'Quelle chance !', text: 'Tu as trouvé 2 € par terre. Tu achètes un croissant : +1 🥐.', effect: { kind: 'score', amount: 1 } },
  { id: 'ev-avance', title: 'Le TGV est en avance !', text: 'Avance de 2 cases.', effect: { kind: 'move', steps: 2 } },
  { id: 'ev-amende', title: 'Contrôle des billets !', text: 'Tu as oublié de composter ton billet. Amende : −1 🥐.', effect: { kind: 'score', amount: -1 } },
  { id: 'ev-anniv', title: 'Joyeux anniversaire !', text: 'Tout le monde te chante « Joyeux anniversaire » et chaque joueur te donne 1 🥐.', effect: { kind: 'birthday', amount: 1 } },
  { id: 'ev-piquenique', title: 'Pique-nique au bord de la Loire', text: 'Tout le monde partage le goûter : chaque joueur gagne +1 🥐.', effect: { kind: 'everyone', amount: 1 } },
  { id: 'ev-beret', title: 'Le vent souffle…', text: 'Tu attrapes le béret du joueur en tête ! Il te donne 1 🥐.', effect: { kind: 'rob-leader', amount: 1 } },
  { id: 'ev-bouchon', title: 'Embouteillage sur le périphérique', text: 'Tu es coincé(e) dans les bouchons. Tu passes ton prochain tour.', effect: { kind: 'skip' } },
  { id: 'ev-rejoue', title: 'Correspondance parfaite !', text: 'Ton train part tout de suite. Relance le dé !', effect: { kind: 'again' } },
  { id: 'ev-boulangerie', title: 'La meilleure boulangerie de France', text: 'Le boulanger t’offre deux croissants : +2 🥐.', effect: { kind: 'score', amount: 2 } },
  { id: 'ev-pluie', title: 'Il pleut des cordes en Bretagne', text: 'Tu t’abrites dans un café. Recule d’une case.', effect: { kind: 'move', steps: -1 } },
];

export const QUIZ_DECKS = {
  pp: PP_CARDS,
  etre: ETRE_CARDS,
  temps: TEMPS_CARDS,
  vocab: VOCAB_CARDS,
} as const;
