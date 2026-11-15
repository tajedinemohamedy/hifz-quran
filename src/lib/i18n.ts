/* All UI text in Arabic, French and English. English defines the keys; TypeScript checks the others are complete. */
import { prefs, type Lang } from "./prefs";
import { quran, thumnNumber, thumnOfVerse } from "./quran";
import { pageRuns } from "./plan";
import { SURA_LATIN } from "./surahNames";

const en = {
  // shell
  tabToday: "Today", tabMushaf: "Mushaf", tabPractice: "Practice",
  settings: "Settings", search: "Search", start: "Start", open: "Open", next: "Next", again: "Try again", retry: "Retry", exit: "Exit",
  page: "Page {n}", juz: "Juz {n}", hizb: "Hizb {n}", thumn: "Thumn {n}", ayahs: "{n} verses", percent: "{n}%",
  pagesRange: "p. {a}–{b}", pageOne: "p. {a}", ms: "{n} ms", mbOf: "{a} of {b} MB",

  // first launch
  welcome: "Assalamu alaykum", welcomeHint: "Your Warsh mushaf to read, listen, memorize and review.",
  whereAreYou: "Where are you in your memorization?",
  startFresh: "I'm starting", startFreshHint: "Begin with page 2, after al-Fatiha",
  startSome: "I've memorized some pages", startSomeHint: "Continue from where you are",
  lastPage: "Last page you memorized", begin: "Begin",

  // today
  pagesOf: "of {n} pages", juzApprox: "about {j} juz", seeProgress: "Progress",
  streak: "{n}-day streak", streakStart: "Start today",
  tasksToday: "Today", restDay: "Consolidation day · no new page",
  taskNew: "New page {n}", taskWeek: "This week's pages", taskRecent: "Recent review", taskOld: "Long review",
  taskQuiz: "Quiz", taskQuizMeta: "20 questions on page {n}", taskQuizRest: "15 similar-phrase questions",
  reads: "Read", recites: "Recited", taskDone: "{task} · done",
  progress: "Progress", pagesKnown: "pages", ofMushaf: "of the mushaf", dayStreak: "day streak",
  hizbMap: "The 60 hizbs", hizbLegend: "Filled: memorized · outlined: in progress", last4Weeks: "Last 4 weeks", masteryScores: "Full mastery scores",

  // reader
  goTo: "Go to", listen: "Listen", memorize: "Memorize", recite: "Recite", stop: "Stop", pause: "Pause",
  nowPlaying: "Playing", paused: "Paused", loadingAudio: "Loading the recitation…",
  memorizeHint: "Tap a verse: first word, then all of it", revealNext: "Reveal next",
  bookmark: "Bookmark", bookmarkAdded: "Page {n} bookmarked", bookmarkRemoved: "Bookmark on page {n} removed",
  markWeak: "Review", unmarkWeak: "Marked", weakAdded: "Added to your review list", weakRemoved: "Removed from your review list",
  copy: "Copy", copied: "Copied", copyFailed: "Couldn't copy: your browser blocked the clipboard", similar: "Similar passages ({n})",
  audioError: "Couldn't play the recitation", audioErrorHint: "Check your connection. Some older browsers can't play this audio format.",
  reciter: "Reciter",

  // recitation check: pipeline
  stepEngine: "Engine", stepMic: "Microphone", stepListen: "Listening", activity: "Activity",
  engIdle: "Tap the microphone and recite from memory", engReady: "Ready · tap the microphone",
  engRuntime: "Loading the speech engine…", engDownload: "Downloading the speech model (once)", engCompile: "Preparing the model on your device…", engPreparing: "Starting…",
  engineReady: "Speech engine ready · it now works offline",
  failRuntime: "Couldn't load the speech engine", failDownload: "Couldn't download the speech model", failCompile: "The speech model couldn't start on this device",
  failWorker: "The speech engine stopped unexpectedly", failStep: "A recognition step failed", failTracker: "Couldn't prepare this page for recitation",
  failHint: "Check your connection and retry, or choose the model file (onnx/model-int8.onnx from HisnLabs/tajweed-v2).", chooseModel: "Choose file",
  micAsking: "Allow the microphone", micAskingHint: "Your browser is asking for permission", micDenied: "Microphone access is blocked",
  micDeniedHint: "Allow the microphone in your browser's site settings, then try again", micMissing: "No microphone found",
  micMissingHint: "Connect a microphone and try again", micError: "Couldn't open the microphone", micInsecure: "The microphone needs a secure page",
  micInsecureHint: "Open the app over https (or localhost)", micSilent: "I can't hear anything", micSilentHint: "Check that the microphone isn't muted",
  hearing: "Hearing you", waitingVoice: "Listening · recite from memory", slowDevice: "This device is slow · results may lag behind",

  // recitation check: words and results
  startReciting: "Start reciting", showText: "Show", hideText: "Hide",
  tzWords: "{a}/{b} words", tzLost: "I lost your place", tzLostHint: "Continue from the marked word", showWord: "Show word",
  tzMissing: "Missing: not recited", tzDifferent: "Different from the mushaf", tzHeard: "Heard", tzNothing: "nothing", verdict: "Result",
  tzSimilar: "You seem to have moved to a similar passage ({where}), which continues with",
  continueHere: "Continue from here", show: "Show",
  tzGreat: "Solid memorization", tzGood: "Good · review the red words", tzLow: "Repeat the page before moving on",
  summaryLine: "{judged} words · {bad} mistakes, kept for review",
  reciteDone: "Recitation checked · {pct}%", recitationCounted: "Counted as today's recitation", nothingJudged: "Nothing was recognized · recite a little longer",

  // recitation check: activity log
  logRuntime: "Loading the speech runtime", logDownload: "Downloading the model ({mb} MB)", logCached: "Model found on this device",
  logCompile: "Compiling the model", logReady: "Engine ready in {ms} ms", logModelFile: "Using the file {name}",
  logSessionRecite: "Recitation check started", logSessionFind: "Recite-to-find started", logMicAsk: "Asking for the microphone",
  logMicOn: "Microphone on · {rate} kHz", logStarted: "Listening", logStopped: "Stopped by you",
  logMissed: "Missing word «{word}»", logDifferent: "Different word at «{word}»", logSimilar: "Similar passage at «{word}»",
  logLost: "Lost the place near «{word}»", logJump: "Continuing from «{word}»", logDone: "Finished · {pct}%",
  logNothingJudged: "Nothing recognized", logFound: "{n} matching verses",

  // search & index
  searchHint: "Surah, page, 2:255 or words", surahs: "Surahs", juzs: "Juz", bookmarks: "Bookmarks", noBookmarks: "No bookmarks yet",
  versesCount: "{n} verses", moreResults: "{n} verses · showing {m}", noResults: "No results", goPage: "Go to page {n}",
  findRecite: "Recite to find", findSearching: "Searching the mushaf…", findShort: "Too short · recite a whole phrase",
  findResults: "{n} possible verses", findNone: "No matching verse · recite a little longer",

  // practice
  practiceHint: "Every question comes from the mushaf text", recentQuiz: "Recent pages", recentQuizMeta: "20 questions · {pages}",
  recentQuizEmpty: "Available once you memorize a page", chooseRange: "Other range", myMistakes: "My mistakes",
  weakCount: "{n} verses · each leaves after two right answers", weakEmpty: "Nothing yet · mistakes from quizzes and recitations come here",
  mutTab: "Similar phrases", mutMeta: "15 questions from what you know", browse: "Browse", nothingToPractice: "Nothing to practice here yet",
  byHizb: "Hizb", byPages: "Pages", wholeHizb: "Whole hizb", thumnOptional: "Thumn (optional)", fromPage: "From page", toPage: "to",
  modeFull: "Full mastery · every verse", modeMix: "20 random questions",
  askNext: "Which verse comes after this one?", askPrev: "Which verse comes before this one?", askBlank: "Which word is missing?",
  askThumn: "How does thumn {k} of hizb {h} begin?", askFinish: "Finish the verse aloud from memory, then reveal",
  reveal: "Reveal", correct: "Correct", wrongBack: "Not quite · it will come back", honest: "Compare honestly with the text:",
  gotIt: "I got it", missedIt: "I missed it", ofTotal: "{a} of {b}", repeated: "repeat",
  firstTry: "Right first time: {a} of {b}", scoreGreat: "Excellent mastery.", scoreGood: "Good. Review the verses below, then retry.",
  scoreLow: "Needs review before a new page.", toReview: "Verses to review ({n})", home: "Back to today",
  mutIntro: "{g} phrases in {o} places, found by comparing the text", mutSearch: "Search a word, e.g. البينات",
  phrases: "All · {n}", starred: "Starred · {n}", noStars: "Star a phrase to keep it here", practiceStarred: "Practice starred phrases",
  showMore: "Show more", whatFollows: "What comes next here?", allPlaces: "All places ({n})", run: "streak {n}",
  newRound: "New round", missedPhrases: "Phrases you missed",

  // settings
  general: "General", language: "Language", theme: "Appearance", themeAuto: "Auto", themeLight: "Light", themeDark: "Dark",
  plan: "Memorization plan", nextPage: "Next new page", oldPerDay: "Long review pages per day",
  sundayRest: "Sunday for consolidation", sundayRestMeta: "No new page on Sundays",
  recitation: "Recitation check", strictness: "Strictness", relaxed: "Relaxed", normal: "Normal", strict: "Strict",
  stopOnMistake: "Stop at a mistake", vibrate: "Vibrate on mistakes",
  backup: "Backup", backupHint: "Progress is saved in this browser. Copy the code to move it to another device (old app codes work too).",
  copyCode: "Copy code", restore: "Restore", pasteCode: "Paste the code here", codeCopied: "Backup code copied",
  copyManually: "Copy the code below", restored: "Progress restored", invalidCode: "That code isn't valid · make sure you copied all of it",
  undo: "Undo", restoreUndone: "Your previous progress is back", undoFailed: "Nothing to undo",
  saveFailed: "Couldn't save your progress", saveFailedHint: "Storage may be full or blocked (private browsing). Copy a backup code to be safe.",
  storageBlocked: "This browser blocks saving · your progress won't be kept",
  progressDamaged: "Your saved progress couldn't be read", progressDamagedHint: "A copy was kept aside. Restore a backup code in Settings, or start again.",
  about: "About",
  aboutText: "Text and font: King Fahd Complex (KFGQPC) Warsh v10, Warsh verse count. Recitation: Sheikh Mohamed Laghdaf, timings from the khatmah project. The recitation check runs on your device and judges words only (missing, different, similar passage), not tajweed: your teacher has the final word.",
};

export type Key = keyof typeof en;
type Dict = Record<Key, string>;

const fr: Dict = {
  tabToday: "Aujourd'hui", tabMushaf: "Mushaf", tabPractice: "Entraînement",
  settings: "Réglages", search: "Rechercher", start: "Commencer", open: "Ouvrir", next: "Suivant", again: "Recommencer", retry: "Réessayer", exit: "Quitter",
  page: "Page {n}", juz: "Juz {n}", hizb: "Hizb {n}", thumn: "Thumn {n}", ayahs: "{n} versets", percent: "{n} %",
  pagesRange: "p. {a}–{b}", pageOne: "p. {a}", ms: "{n} ms", mbOf: "{a} sur {b} Mo",

  welcome: "Assalamu alaykum", welcomeHint: "Votre mushaf Warsh pour lire, écouter, mémoriser et réviser.",
  whereAreYou: "Où en êtes-vous dans votre mémorisation ?",
  startFresh: "Je commence", startFreshHint: "Débuter à la page 2, après al-Fatiha",
  startSome: "J'ai déjà mémorisé des pages", startSomeHint: "Reprendre là où vous êtes",
  lastPage: "Dernière page mémorisée", begin: "Commencer",

  pagesOf: "sur {n} pages", juzApprox: "environ {j} juz", seeProgress: "Progression",
  streak: "{n} jours d'affilée", streakStart: "Commencez aujourd'hui",
  tasksToday: "Aujourd'hui", restDay: "Jour de consolidation · pas de nouvelle page",
  taskNew: "Nouvelle page {n}", taskWeek: "Pages de la semaine", taskRecent: "Révision récente", taskOld: "Révision ancienne",
  taskQuiz: "Quiz", taskQuizMeta: "20 questions sur la page {n}", taskQuizRest: "15 questions d'expressions similaires",
  reads: "Lu", recites: "Récité", taskDone: "{task} · fait",
  progress: "Progression", pagesKnown: "pages", ofMushaf: "du mushaf", dayStreak: "jours d'affilée",
  hizbMap: "Les 60 hizbs", hizbLegend: "Plein : mémorisé · contour : en cours", last4Weeks: "4 dernières semaines", masteryScores: "Scores de maîtrise complète",

  goTo: "Aller à", listen: "Écouter", memorize: "Mémoriser", recite: "Réciter", stop: "Arrêter", pause: "Pause",
  nowPlaying: "Lecture", paused: "En pause", loadingAudio: "Chargement de la récitation…",
  memorizeHint: "Touchez un verset : le premier mot, puis tout", revealNext: "Révéler la suite",
  bookmark: "Marque-page", bookmarkAdded: "Page {n} marquée", bookmarkRemoved: "Marque-page de la page {n} retiré",
  markWeak: "À revoir", unmarkWeak: "Marqué", weakAdded: "Ajouté à vos révisions", weakRemoved: "Retiré de vos révisions",
  copy: "Copier", copied: "Copié", copyFailed: "Copie impossible : le navigateur a bloqué le presse-papiers", similar: "Passages similaires ({n})",
  audioError: "Impossible de lire la récitation", audioErrorHint: "Vérifiez la connexion. Certains anciens navigateurs ne lisent pas ce format audio.",
  reciter: "Récitateur",

  stepEngine: "Moteur", stepMic: "Micro", stepListen: "Écoute", activity: "Activité",
  engIdle: "Touchez le micro et récitez de mémoire", engReady: "Prêt · touchez le micro",
  engRuntime: "Chargement du moteur vocal…", engDownload: "Téléchargement du modèle vocal (une fois)", engCompile: "Préparation du modèle sur l'appareil…", engPreparing: "Démarrage…",
  engineReady: "Moteur vocal prêt · il fonctionne désormais hors ligne",
  failRuntime: "Impossible de charger le moteur vocal", failDownload: "Impossible de télécharger le modèle vocal", failCompile: "Le modèle vocal ne peut pas démarrer sur cet appareil",
  failWorker: "Le moteur vocal s'est arrêté", failStep: "Une étape de reconnaissance a échoué", failTracker: "Impossible de préparer cette page pour la récitation",
  failHint: "Vérifiez la connexion et réessayez, ou choisissez le fichier du modèle (onnx/model-int8.onnx de HisnLabs/tajweed-v2).", chooseModel: "Choisir le fichier",
  micAsking: "Autorisez le micro", micAskingHint: "Le navigateur demande la permission", micDenied: "L'accès au micro est bloqué",
  micDeniedHint: "Autorisez le micro dans les réglages du site, puis réessayez", micMissing: "Aucun micro trouvé",
  micMissingHint: "Branchez un micro et réessayez", micError: "Impossible d'ouvrir le micro", micInsecure: "Le micro exige une page sécurisée",
  micInsecureHint: "Ouvrez l'app en https (ou localhost)", micSilent: "Je n'entends rien", micSilentHint: "Vérifiez que le micro n'est pas coupé",
  hearing: "Je vous entends", waitingVoice: "À l'écoute · récitez de mémoire", slowDevice: "Appareil lent · les résultats peuvent avoir du retard",

  startReciting: "Commencer la récitation", showText: "Afficher", hideText: "Masquer",
  tzWords: "{a}/{b} mots", tzLost: "Je ne retrouve pas votre position", tzLostHint: "Reprenez au mot indiqué", showWord: "Afficher le mot",
  tzMissing: "Manquant : non récité", tzDifferent: "Différent du mushaf", tzHeard: "Entendu", tzNothing: "rien", verdict: "Résultat",
  tzSimilar: "Vous semblez être passé à un passage similaire ({where}), qui continue par",
  continueHere: "Reprendre ici", show: "Afficher",
  tzGreat: "Mémorisation solide", tzGood: "Bien · revoyez les mots en rouge", tzLow: "Reprenez la page avant d'avancer",
  summaryLine: "{judged} mots · {bad} erreurs, gardées pour révision",
  reciteDone: "Récitation vérifiée · {pct} %", recitationCounted: "Comptée comme récitation du jour", nothingJudged: "Rien n'a été reconnu · récitez un peu plus",

  logRuntime: "Chargement du moteur", logDownload: "Téléchargement du modèle ({mb} Mo)", logCached: "Modèle trouvé sur l'appareil",
  logCompile: "Compilation du modèle", logReady: "Moteur prêt en {ms} ms", logModelFile: "Utilisation du fichier {name}",
  logSessionRecite: "Vérification de récitation lancée", logSessionFind: "Recherche par récitation lancée", logMicAsk: "Demande du micro",
  logMicOn: "Micro actif · {rate} kHz", logStarted: "À l'écoute", logStopped: "Arrêté par vous",
  logMissed: "Mot manquant «{word}»", logDifferent: "Mot différent à «{word}»", logSimilar: "Passage similaire à «{word}»",
  logLost: "Position perdue vers «{word}»", logJump: "Reprise à «{word}»", logDone: "Terminé · {pct} %",
  logNothingJudged: "Rien reconnu", logFound: "{n} versets correspondants",

  searchHint: "Sourate, page, 2:255 ou mots", surahs: "Sourates", juzs: "Juz", bookmarks: "Marque-pages", noBookmarks: "Aucun marque-page",
  versesCount: "{n} versets", moreResults: "{n} versets · {m} affichés", noResults: "Aucun résultat", goPage: "Aller à la page {n}",
  findRecite: "Réciter pour trouver", findSearching: "Recherche dans le mushaf…", findShort: "Trop court · récitez une phrase entière",
  findResults: "{n} versets possibles", findNone: "Aucun verset trouvé · récitez un peu plus",

  practiceHint: "Chaque question vient du texte du mushaf", recentQuiz: "Pages récentes", recentQuizMeta: "20 questions · {pages}",
  recentQuizEmpty: "Disponible dès votre première page mémorisée", chooseRange: "Autre étendue", myMistakes: "Mes erreurs",
  weakCount: "{n} versets · chacun sort après deux bonnes réponses", weakEmpty: "Rien pour l'instant · les erreurs des quiz et récitations arrivent ici",
  mutTab: "Expressions similaires", mutMeta: "15 questions sur vos acquis", browse: "Parcourir", nothingToPractice: "Rien à pratiquer ici pour l'instant",
  byHizb: "Hizb", byPages: "Pages", wholeHizb: "Hizb entier", thumnOptional: "Thumn (facultatif)", fromPage: "De la page", toPage: "à",
  modeFull: "Maîtrise complète · chaque verset", modeMix: "20 questions aléatoires",
  askNext: "Quel verset vient après celui-ci ?", askPrev: "Quel verset vient avant celui-ci ?", askBlank: "Quel mot manque ?",
  askThumn: "Comment commence le thumn {k} du hizb {h} ?", askFinish: "Complétez le verset à voix haute, puis révélez",
  reveal: "Révéler", correct: "Juste", wrongBack: "Pas tout à fait · la question reviendra", honest: "Comparez honnêtement avec le texte :",
  gotIt: "Réussi", missedIt: "Raté", ofTotal: "{a} sur {b}", repeated: "reprise",
  firstTry: "Juste du premier coup : {a} sur {b}", scoreGreat: "Excellente maîtrise.", scoreGood: "Bien. Revoyez les versets ci-dessous puis recommencez.",
  scoreLow: "À revoir avant une nouvelle page.", toReview: "Versets à revoir ({n})", home: "Retour à aujourd'hui",
  mutIntro: "{g} expressions en {o} endroits, trouvées en comparant le texte", mutSearch: "Chercher un mot, ex. البينات",
  phrases: "Toutes · {n}", starred: "Favoris · {n}", noStars: "Ajoutez une expression en favori pour la garder ici", practiceStarred: "S'entraîner sur les favoris",
  showMore: "Afficher plus", whatFollows: "Que vient-il ensuite ici ?", allPlaces: "Tous les endroits ({n})", run: "série {n}",
  newRound: "Nouvelle partie", missedPhrases: "Expressions ratées",

  general: "Général", language: "Langue", theme: "Apparence", themeAuto: "Auto", themeLight: "Clair", themeDark: "Sombre",
  plan: "Plan de mémorisation", nextPage: "Prochaine nouvelle page", oldPerDay: "Pages de révision ancienne par jour",
  sundayRest: "Dimanche de consolidation", sundayRestMeta: "Pas de nouvelle page le dimanche",
  recitation: "Vérification de récitation", strictness: "Exigence", relaxed: "Souple", normal: "Normale", strict: "Stricte",
  stopOnMistake: "S'arrêter à une erreur", vibrate: "Vibrer en cas d'erreur",
  backup: "Sauvegarde", backupHint: "La progression est enregistrée dans ce navigateur. Copiez le code pour la transférer (les codes de l'ancienne app fonctionnent aussi).",
  copyCode: "Copier le code", restore: "Restaurer", pasteCode: "Collez le code ici", codeCopied: "Code de sauvegarde copié",
  copyManually: "Copiez le code ci-dessous", restored: "Progression restaurée", invalidCode: "Code invalide · vérifiez qu'il est complet",
  undo: "Annuler", restoreUndone: "Votre progression précédente est revenue", undoFailed: "Rien à annuler",
  saveFailed: "Impossible d'enregistrer votre progression", saveFailedHint: "Le stockage est peut-être plein ou bloqué (navigation privée). Copiez un code de sauvegarde par sécurité.",
  storageBlocked: "Ce navigateur bloque l'enregistrement · votre progression ne sera pas gardée",
  progressDamaged: "Votre progression enregistrée est illisible", progressDamagedHint: "Une copie a été mise de côté. Restaurez un code de sauvegarde dans Réglages, ou recommencez.",
  about: "À propos",
  aboutText: "Texte et police : Complexe du Roi Fahd (KFGQPC) Warsh v10, numérotation de Warsh. Récitation : Cheikh Mohamed Laghdaf, minutage du projet khatmah. La vérification fonctionne sur l'appareil et juge les mots seulement (manquant, différent, passage similaire), pas le tajwid : votre enseignant a le dernier mot.",
};

const ar: Dict = {
  tabToday: "اليوم", tabMushaf: "المصحف", tabPractice: "التمرين",
  settings: "الإعدادات", search: "بحث", start: "ابدأ", open: "افتح", next: "التالي", again: "أعد", retry: "أعد المحاولة", exit: "خروج",
  page: "الصفحة {n}", juz: "الجزء {n}", hizb: "الحزب {n}", thumn: "الثمن {n}", ayahs: "{n} آية", percent: "{n}٪",
  pagesRange: "ص {a}–{b}", pageOne: "ص {a}", ms: "{n} م.ث", mbOf: "{a} من {b} م.ب",

  welcome: "السلام عليكم", welcomeHint: "مصحفك برواية ورش: اقرأ، واستمع، واحفظ، وراجع.",
  whereAreYou: "أين وصلت في حفظك؟",
  startFresh: "أبدأ الحفظ", startFreshHint: "من الصفحة ٢ بعد الفاتحة",
  startSome: "حفظت بعض الصفحات", startSomeHint: "أكمل من حيث وصلت",
  lastPage: "آخر صفحة حفظتها", begin: "ابدأ",

  pagesOf: "من {n} صفحة", juzApprox: "نحو {j} جزء", seeProgress: "تقدّمي",
  streak: "{n} أيام متتالية", streakStart: "ابدأ اليوم",
  tasksToday: "مهام اليوم", restDay: "يوم التثبيت · لا حفظ جديد",
  taskNew: "الحفظ الجديد · ص {n}", taskWeek: "صفحات الأسبوع", taskRecent: "المراجعة القريبة", taskOld: "المراجعة البعيدة",
  taskQuiz: "الاختبار", taskQuizMeta: "٢٠ سؤالًا على الصفحة {n}", taskQuizRest: "١٥ سؤالًا في المتشابهات",
  reads: "قراءة", recites: "تسميع", taskDone: "{task} · تمّ",
  progress: "تقدّمي", pagesKnown: "صفحة", ofMushaf: "من المصحف", dayStreak: "أيام متتالية",
  hizbMap: "الأحزاب الستون", hizbLegend: "ممتلئ: محفوظ · محدّد: تحفظه الآن", last4Weeks: "آخر ٤ أسابيع", masteryScores: "نتائج الإتقان الكامل",

  goTo: "انتقل إلى", listen: "استمع", memorize: "احفظ", recite: "سمّع", stop: "إيقاف", pause: "إيقاف مؤقت",
  nowPlaying: "تُتلى الآن", paused: "متوقفة", loadingAudio: "أحمّل التلاوة…",
  memorizeHint: "اضغط على آية: أول كلمة، ثم كاملة", revealNext: "اكشف التالية",
  bookmark: "علامة", bookmarkAdded: "وُضعت علامة على الصفحة {n}", bookmarkRemoved: "أُزيلت علامة الصفحة {n}",
  markWeak: "للمراجعة", unmarkWeak: "مُعلَّمة", weakAdded: "أُضيفت إلى مراجعتك", weakRemoved: "أُزيلت من مراجعتك",
  copy: "نسخ", copied: "نُسخ", copyFailed: "تعذّر النسخ: المتصفح منع الحافظة", similar: "متشابهاتها ({n})",
  audioError: "تعذّر تشغيل التلاوة", audioErrorHint: "تحقق من الاتصال. بعض المتصفحات القديمة لا تشغّل هذه الصيغة.",
  reciter: "القارئ",

  stepEngine: "المحرّك", stepMic: "الميكروفون", stepListen: "الاستماع", activity: "النشاط",
  engIdle: "اضغط الميكروفون وسمّع من حفظك", engReady: "جاهز · اضغط الميكروفون",
  engRuntime: "أحمّل محرّك التعرّف…", engDownload: "أحمّل نموذج التعرّف (مرة واحدة)", engCompile: "أجهّز النموذج على جهازك…", engPreparing: "أبدأ…",
  engineReady: "محرّك التعرّف جاهز · يعمل الآن دون اتصال",
  failRuntime: "تعذّر تحميل محرّك التعرّف", failDownload: "تعذّر تحميل نموذج التعرّف", failCompile: "لم يعمل النموذج على هذا الجهاز",
  failWorker: "توقّف محرّك التعرّف فجأة", failStep: "فشلت خطوة من التعرّف", failTracker: "تعذّر تجهيز هذه الصفحة للتسميع",
  failHint: "تحقق من الاتصال وأعد المحاولة، أو اختر ملف النموذج (onnx/model-int8.onnx من HisnLabs/tajweed-v2).", chooseModel: "اختر الملف",
  micAsking: "اسمح بالميكروفون", micAskingHint: "المتصفح يطلب الإذن", micDenied: "الوصول إلى الميكروفون ممنوع",
  micDeniedHint: "اسمح بالميكروفون من إعدادات الموقع في المتصفح ثم أعد المحاولة", micMissing: "لا يوجد ميكروفون",
  micMissingHint: "صِل ميكروفونًا وأعد المحاولة", micError: "تعذّر فتح الميكروفون", micInsecure: "الميكروفون يحتاج صفحة آمنة",
  micInsecureHint: "افتح التطبيق عبر https (أو localhost)", micSilent: "لا أسمع شيئًا", micSilentHint: "تأكد أن الميكروفون غير مكتوم",
  hearing: "أسمعك", waitingVoice: "أستمع · سمّع من حفظك", slowDevice: "الجهاز بطيء · قد تتأخر النتائج",

  startReciting: "ابدأ التسميع", showText: "أظهر", hideText: "أخفِ",
  tzWords: "{a}/{b} كلمة", tzLost: "لم أتعرّف على موضعك", tzLostHint: "أكمل من الكلمة المحدّدة", showWord: "أظهر الكلمة",
  tzMissing: "ناقصة: لم تُقرأ", tzDifferent: "مختلفة عمّا في المصحف", tzHeard: "ما سمعه التطبيق", tzNothing: "لا شيء", verdict: "الحكم",
  tzSimilar: "يبدو أنك انتقلت إلى موضع متشابه ({where})، حيث تأتي",
  continueHere: "أكمل من هنا", show: "أظهرها",
  tzGreat: "حفظ متقن", tzGood: "جيد · راجع الكلمات الحمراء", tzLow: "أعد الصفحة قبل الانتقال",
  summaryLine: "{judged} كلمة · {bad} خطأ، حُفظت للمراجعة",
  reciteDone: "تمّ التسميع · {pct}٪", recitationCounted: "حُسب تسميعًا لهذا اليوم", nothingJudged: "لم أتعرّف على شيء · سمّع مدة أطول",

  logRuntime: "أحمّل محرّك التشغيل", logDownload: "أحمّل النموذج ({mb} م.ب)", logCached: "النموذج موجود على الجهاز",
  logCompile: "أجهّز النموذج", logReady: "المحرّك جاهز في {ms} م.ث", logModelFile: "أستعمل الملف {name}",
  logSessionRecite: "بدأ التسميع", logSessionFind: "بدأ البحث بالقراءة", logMicAsk: "أطلب الميكروفون",
  logMicOn: "الميكروفون يعمل · {rate} ك.هرتز", logStarted: "أستمع", logStopped: "أوقفتَه",
  logMissed: "كلمة ناقصة «{word}»", logDifferent: "كلمة مختلفة عند «{word}»", logSimilar: "موضع متشابه عند «{word}»",
  logLost: "ضاع الموضع قرب «{word}»", logJump: "أكمل من «{word}»", logDone: "انتهى · {pct}٪",
  logNothingJudged: "لم أتعرّف على شيء", logFound: "{n} آيات مطابقة",

  searchHint: "سورة، صفحة، ٢:٢٥٥ أو كلمات", surahs: "السور", juzs: "الأجزاء", bookmarks: "العلامات", noBookmarks: "لا علامات بعد",
  versesCount: "{n} آية", moreResults: "{n} آية · يظهر {m}", noResults: "لا نتائج", goPage: "اذهب إلى الصفحة {n}",
  findRecite: "اقرأ لتجد الآية", findSearching: "أبحث في المصحف…", findShort: "قصير جدًا · اقرأ جملة كاملة",
  findResults: "{n} آيات محتملة", findNone: "لم أجد آية مطابقة · اقرأ مدة أطول",

  practiceHint: "كل سؤال يُبنى من نص المصحف", recentQuiz: "الصفحات الأخيرة", recentQuizMeta: "٢٠ سؤالًا · {pages}",
  recentQuizEmpty: "يتاح بعد حفظ أول صفحة", chooseRange: "نطاق آخر", myMistakes: "أخطائي",
  weakCount: "{n} آيات · تخرج الآية بعد إجابتين صحيحتين", weakEmpty: "لا شيء بعد · أخطاء الاختبار والتسميع تظهر هنا",
  mutTab: "المتشابهات", mutMeta: "١٥ سؤالًا مما حفظت", browse: "تصفّح", nothingToPractice: "لا شيء للتمرين هنا بعد",
  byHizb: "حزب", byPages: "صفحات", wholeHizb: "الحزب كاملًا", thumnOptional: "الثمن (اختياري)", fromPage: "من الصفحة", toPage: "إلى",
  modeFull: "إتقان كامل · كل آية", modeMix: "٢٠ سؤالًا عشوائيًّا",
  askNext: "ما الآية التي تأتي بعد هذه؟", askPrev: "ما الآية التي تأتي قبل هذه؟", askBlank: "ما الكلمة الناقصة؟",
  askThumn: "بماذا يبدأ الثمن {k} من الحزب {h}؟", askFinish: "أكمل الآية من حفظك بصوت مسموع، ثم اكشف",
  reveal: "اكشف", correct: "صحيح", wrongBack: "ليس تمامًا · سيعود هذا السؤال", honest: "قارن تسميعك بالنص بصدق:",
  gotIt: "أصبت", missedIt: "أخطأت", ofTotal: "{a} من {b}", repeated: "معاد",
  firstTry: "صحيح من أول محاولة: {a} من {b}", scoreGreat: "إتقان ممتاز.", scoreGood: "جيد. راجع الآيات أدناه ثم أعد.",
  scoreLow: "يحتاج مراجعة قبل حفظ صفحة جديدة.", toReview: "آيات تحتاج مراجعة ({n})", home: "العودة إلى اليوم",
  mutIntro: "{g} عبارة في {o} موضعًا، استُخرجت بمقارنة النص", mutSearch: "ابحث بكلمة، مثل: البينات",
  phrases: "الكل · {n}", starred: "المفضّلة · {n}", noStars: "ضع نجمة على عبارة لتحفظها هنا", practiceStarred: "تمرّن على المفضّلة",
  showMore: "اعرض المزيد", whatFollows: "ماذا يأتي بعدها في هذا الموضع؟", allPlaces: "كل المواضع ({n})", run: "متتالية {n}",
  newRound: "جولة جديدة", missedPhrases: "العبارات التي أخطأت فيها",

  general: "عام", language: "اللغة", theme: "المظهر", themeAuto: "تلقائي", themeLight: "فاتح", themeDark: "داكن",
  plan: "خطة الحفظ", nextPage: "الصفحة الجديدة التالية", oldPerDay: "صفحات المراجعة البعيدة يوميًّا",
  sundayRest: "الأحد للتثبيت", sundayRestMeta: "لا صفحة جديدة يوم الأحد",
  recitation: "التسميع بالصوت", strictness: "الصرامة", relaxed: "متساهل", normal: "عادي", strict: "صارم",
  stopOnMistake: "توقّف عند الخطأ", vibrate: "اهتزاز عند الخطأ",
  backup: "النسخ الاحتياطي", backupHint: "تقدّمك محفوظ في هذا المتصفح. انسخ الرمز لتنقله إلى جهاز آخر (رموز التطبيق السابق تعمل أيضًا).",
  copyCode: "انسخ الرمز", restore: "استرجع", pasteCode: "الصق الرمز هنا", codeCopied: "نُسخ رمز النسخة",
  copyManually: "انسخ الرمز أدناه", restored: "استُرجع تقدّمك", invalidCode: "الرمز غير صالح · تأكد أنك نسخته كاملًا",
  undo: "تراجع", restoreUndone: "عاد تقدّمك السابق", undoFailed: "لا شيء للتراجع عنه",
  saveFailed: "تعذّر حفظ تقدّمك", saveFailedHint: "قد تكون الذاكرة ممتلئة أو محظورة (التصفح الخاص). انسخ رمز النسخة احتياطًا.",
  storageBlocked: "هذا المتصفح يمنع الحفظ · لن يُحفظ تقدّمك",
  progressDamaged: "تعذّرت قراءة تقدّمك المحفوظ", progressDamagedHint: "حُفظت نسخة جانبًا. استرجع رمز نسخة من الإعدادات، أو ابدأ من جديد.",
  about: "عن التطبيق",
  aboutText: "النص والخط: مجمع الملك فهد لطباعة المصحف الشريف، رواية ورش الإصدار ١٠، بعدّ ورش. التلاوة: الشيخ محمد لغظف، والتوقيت من مشروع khatmah. التسميع يعمل على جهازك ويحكم على الكلمات فقط (الناقصة، والمختلفة، والانتقال إلى متشابه) لا على التجويد: صحّح مع شيخك.",
};

const DICTS: Record<Lang, Dict> = { en, fr, ar };
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const dirOf = (lang: Lang): "rtl" | "ltr" => (lang === "ar" ? "rtl" : "ltr");
export const digitsFor = (lang: Lang) => (x: number | string) => (lang === "ar" ? String(x).replace(/[0-9]/g, (d) => AR_DIGITS[+d]) : String(x));

export function translator(lang: Lang) {
  const d = DICTS[lang], n = digitsFor(lang);
  const t = (k: Key, vars?: Record<string, string | number>) =>
    d[k].replace(/\{(\w+)\}/g, (_, v) => (vars && v in vars ? (typeof vars[v] === "number" ? n(vars[v]) : String(vars[v])) : ""));
  const sura = (s: number) => (lang === "ar" ? quran().names[s - 1] : SURA_LATIN[s - 1]);
  const thumnNo = (h: number, k: number) => thumnNumber(h, k).map(n).join("–");
  /** "Al-Baqara 255 · Hizb 5 · Thumn 2", optionally with the page */
  const where = (i: number, withPage = false) => {
    const [s, a, p] = quran().V[i], th = thumnOfVerse(i);
    return `${sura(s)} ${n(a)} · ${t("hizb", { n: th.h })} · ${t("thumn", { n: thumnNo(th.h, th.k) })}` + (withPage ? ` · ${t("pageOne", { a: p })}` : "");
  };
  const pages = (list: number[]) =>
    pageRuns(list).map(([a, b]) => (a === b ? t("pageOne", { a }) : t("pagesRange", { a, b }))).join(lang === "ar" ? "، " : ", ");
  return { t, n, sura, thumnNo, where, pages, lang, dir: dirOf(lang) };
}

const cache = new Map<Lang, ReturnType<typeof translator>>();
/** The current language's helpers; components re-render when the language changes. */
export function useT() {
  const lang = prefs.use((s) => s.lang);
  if (!cache.has(lang)) cache.set(lang, translator(lang));
  return cache.get(lang)!;
}
