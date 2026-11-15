/* All UI text in Arabic, French and English. English defines the keys; TypeScript checks the others are complete. */
import { prefs, type Lang } from "./prefs";
import { quran, thumnNumber, thumnOfVerse } from "./quran";
import { pageRuns } from "./plan";
import { SURA_LATIN } from "./surahNames";

const en = {
  appName: "Hifz Mushaf", riwaya: "Warsh from Nafi'",
  tabToday: "Today", tabMushaf: "Mushaf", tabPractice: "Practice",
  search: "Search", settings: "Settings", close: "Close", start: "Start", next: "Next", again: "Try again", confirm: "Confirm",
  page: "Page {n}", juz: "Juz {n}", hizb: "Hizb {n}", thumn: "Thumn {n}", ayahs: "{n} verses", percent: "{n}%",
  pagesRange: "p. {a}–{b}", pageOne: "p. {a}",

  streak: "{n}-day streak", streakStart: "Start your streak today",
  memorizedRange: "Memorized: pages 1–{n} · about {j} juz",
  pagesKnown: "pages memorized", ofMushaf: "of the mushaf", dayStreak: "day streak",
  confirmAsk: "Which page are you memorizing today?", confirmHint: "Set it once, the plan moves one page each day.",
  tasksToday: "Today's tasks", restDay: "Consolidation day · no new page",
  taskNew: "New page · {n}", taskWeek: "Consolidate this week's pages", taskWeekMeta: "Recite {pages} from memory and fix the weak spots.",
  reads: "Readings · goal 20–25", recites: "From memory · 2–3",
  read: "Read", reciteHidden: "Hidden", reciteMic: "Recite aloud",
  taskRecent: "Recent review", taskRecentMeta: "{pages} · last 7 pages, every day",
  taskOld: "Long-term review", taskOldMeta: "{pages} · rotates through older pages",
  taskQuiz: "Today's quiz", taskQuizMeta: "20 questions on page {n}", taskQuizRest: "15 mutashabihat questions on what you know",
  weakTitle: "{n} verses need care", weakMeta: "From quizzes, recitations, or marked in the mushaf", test: "Test them",
  tip: "If the recent review has many mistakes, repeat yesterday's page instead of a new one.",
  progress: "Progress", hizbMap: "The 60 hizbs", hizbLegend: "Filled: memorized · outlined: in progress", last4Weeks: "Last 4 weeks",

  modeRead: "Read", modeHint: "Hint", modeHide: "Hide", modeRecite: "Recite",
  tapReveal: "Tap a verse to reveal it", revealNext: "Reveal next",
  listen: "Listen", pause: "Pause", stop: "Stop", audioError: "Recitation unavailable: check your connection or browser",
  reciter: "Reciter", playFrom: "Listen", markWeak: "Mark weak", unmarkWeak: "Unmark", bookmark: "Bookmark", unbookmark: "Saved",
  copy: "Copy", copied: "Copied", similar: "Similar passages ({n})",

  tzReady: "Ready", tzPress: "Tap the microphone and recite from memory", tzListening: "Listening", tzWords: "{a} / {b} words", tzDone: "Recitation finished",
  tzDownloading: "Downloading the recognition model", tzOnce: "One time only · about 23 MB", tzPreparing: "Preparing the model",
  tzModelError: "Could not load the model", tzModelErrorHint: "Check your connection, or pick the model file in Settings",
  tzMicError: "Cannot access the microphone", tzMicHint: "Allow microphone access and try again (needs https)",
  tzLost: "I lost your place", tzLostHint: "Continue from the marked word", showWord: "Show word",
  tzCorrect: "{n} correct", tzWrong: "{n} mistakes", tzShowText: "Show text",
  tzMissing: "Missing word: not recited", tzDifferent: "Different from the mushaf", tzHeard: "Heard", tzNothing: "nothing",
  tzSimilar: "You seem to have moved to a similar passage ({where}), which continues with",
  continueHere: "Continue from here", show: "Show",
  tzGreat: "Solid memorization.", tzGood: "Good. Review the places below.", tzLow: "Repeat the page before moving on.",
  tzAdded: "These verses were added to your mistakes.", hints: "{n} hints",

  searchHint: "Surah, page, 2:255 or words", surahs: "Surahs", juzs: "Juz", bookmarks: "Bookmarks", noBookmarks: "No bookmarks yet",
  verses: "Verses", moreResults: "{n} verses · showing {m}", noResults: "No results", goPage: "Go to page {n}",
  findRecite: "Recite to find", findListening: "Recite a verse, then tap stop", findSearching: "Searching…",
  findNone: "No matching verse. Recite a little longer.",

  quiz: "Quiz", mutTab: "Mutashabihat",
  quizIntro: "Every question comes from the mushaf text. What you miss comes back until you master it.",
  scope: "Range", byHizb: "Hizb", byPages: "Pages", myMistakes: "Mistakes", wholeHizb: "Whole hizb", thumnOptional: "Thumn (optional)",
  fromPage: "From page", toPage: "to",
  weakCount: "{n} verses in your mistakes. A verse leaves after two correct answers.",
  weakEmpty: "Your list is empty. Verses you miss in quizzes or recitations appear here.",
  quizType: "Quiz type", modeFull: "Full mastery", modeFullMeta: "Every verse in order: finish it, next verse, thumn openings",
  modeMix: "Random · 20 questions", modeMixMeta: "Next, previous, missing word, finish the verse, thumns",
  askNext: "Which verse comes after this one?", askPrev: "Which verse comes before this one?", askBlank: "Which word is missing?",
  askThumn: "How does thumn {k} of hizb {h} begin?", askFinish: "Finish the verse aloud from memory, then reveal",
  reveal: "Reveal", correct: "Correct", wrongBack: "Wrong, it will come back", honest: "Compare honestly with the text:",
  gotIt: "I got it", missedIt: "Missed or hesitated", end: "End", ofTotal: "{a} of {b}", repeated: "repeat",
  firstTry: "Right first time: {a} of {b}", scoreGreat: "Excellent mastery.", scoreGood: "Good. Review the verses below, then retry.",
  scoreLow: "Needs review before a new page.", toReview: "Verses to review ({n})", home: "Today",

  mutIntro: "{g} similar phrases in {o} places across the mushaf, found by comparing the text.",
  play: "Play", browse: "Browse", starred: "Starred ({n})", hizbs: "Hizbs", known: "Memorized", all: "All", none: "None",
  notDone: "in progress", selected: "{n} places selected", round: "Round of {n}", starredOnly: "Starred only", best: "Best: {n}%",
  mutSearch: "Search a word, e.g. البينات", phrases: "{n} phrases", showAll: "Show all", whatFollows: "What comes next here?",
  allPlaces: "All places ({n})", run: "streak {n}", newRound: "New round", missedPhrases: "Phrases you missed",

  language: "Language", theme: "Appearance", themeAuto: "Auto", themeLight: "Light", themeDark: "Dark",
  plan: "Memorization plan", nextPage: "Next new page", oldPerDay: "Long review pages / day",
  sundayRest: "Sunday for consolidation", sundayRestMeta: "No new page on Sundays",
  recitation: "Recitation check", strictness: "Strictness", relaxed: "Relaxed", normal: "Normal", strict: "Strict",
  stopOnMistake: "Stop at a mistake", vibrate: "Vibrate on mistakes", yes: "Yes", no: "No",
  modelFile: "Model file", modelFileHint: "If the download fails, get onnx/model-int8.onnx from HisnLabs/tajweed-v2 on Hugging Face and pick it here.",
  backup: "Backup", backupHint: "Progress is saved in this browser. Copy the code to move it to another device (codes from the previous app work too).",
  copyCode: "Copy code", restore: "Restore", pasteCode: "Paste the code here", invalidCode: "Invalid code. Make sure you copied all of it.",
  about: "About",
  aboutText: "Text and font: King Fahd Complex (KFGQPC) Warsh v10, Warsh verse count. Recitation: Sheikh Mohamed Laghdaf with timings from the khatmah project. The recitation check runs on your device and judges words only (missing, different, similar passage), not tajweed: your teacher has the final word.",
};

export type Key = keyof typeof en;
type Dict = Record<Key, string>;

const fr: Dict = {
  appName: "Mushaf Hifz", riwaya: "Warsh d'après Nâfi'",
  tabToday: "Aujourd'hui", tabMushaf: "Mushaf", tabPractice: "Entraînement",
  search: "Rechercher", settings: "Réglages", close: "Fermer", start: "Commencer", next: "Suivant", again: "Recommencer", confirm: "Valider",
  page: "Page {n}", juz: "Juz {n}", hizb: "Hizb {n}", thumn: "Thumn {n}", ayahs: "{n} versets", percent: "{n} %",
  pagesRange: "p. {a}–{b}", pageOne: "p. {a}",

  streak: "{n} jours d'affilée", streakStart: "Commencez votre série aujourd'hui",
  memorizedRange: "Mémorisé : pages 1–{n} · environ {j} juz",
  pagesKnown: "pages mémorisées", ofMushaf: "du mushaf", dayStreak: "jours d'affilée",
  confirmAsk: "Quelle page mémorisez-vous aujourd'hui ?", confirmHint: "Une seule fois : le plan avance d'une page par jour.",
  tasksToday: "Tâches du jour", restDay: "Jour de consolidation · pas de nouvelle page",
  taskNew: "Nouvelle page · {n}", taskWeek: "Consolider les pages de la semaine", taskWeekMeta: "Récitez {pages} de mémoire et corrigez les points faibles.",
  reads: "Lectures · objectif 20–25", recites: "De mémoire · 2–3",
  read: "Lire", reciteHidden: "Masqué", reciteMic: "Réciter à voix haute",
  taskRecent: "Révision récente", taskRecentMeta: "{pages} · 7 dernières pages, chaque jour",
  taskOld: "Révision ancienne", taskOldMeta: "{pages} · tourne sur les pages anciennes",
  taskQuiz: "Quiz du jour", taskQuizMeta: "20 questions sur la page {n}", taskQuizRest: "15 questions de mutashabihat sur vos acquis",
  weakTitle: "{n} versets à revoir", weakMeta: "Issus des quiz, des récitations ou marqués dans le mushaf", test: "S'exercer",
  tip: "Si la révision récente comporte beaucoup d'erreurs, reprenez la page d'hier au lieu d'une nouvelle.",
  progress: "Progression", hizbMap: "Les 60 hizbs", hizbLegend: "Plein : mémorisé · contour : en cours", last4Weeks: "4 dernières semaines",

  modeRead: "Lire", modeHint: "Indice", modeHide: "Masquer", modeRecite: "Réciter",
  tapReveal: "Touchez un verset pour le révéler", revealNext: "Révéler le suivant",
  listen: "Écouter", pause: "Pause", stop: "Arrêter", audioError: "Récitation indisponible : vérifiez la connexion ou le navigateur",
  reciter: "Récitateur", playFrom: "Écouter", markWeak: "Point faible", unmarkWeak: "Retirer", bookmark: "Marque-page", unbookmark: "Enregistré",
  copy: "Copier", copied: "Copié", similar: "Passages similaires ({n})",

  tzReady: "Prêt", tzPress: "Touchez le micro et récitez de mémoire", tzListening: "À l'écoute", tzWords: "{a} / {b} mots", tzDone: "Récitation terminée",
  tzDownloading: "Téléchargement du modèle de reconnaissance", tzOnce: "Une seule fois · environ 23 Mo", tzPreparing: "Préparation du modèle",
  tzModelError: "Impossible de charger le modèle", tzModelErrorHint: "Vérifiez la connexion, ou choisissez le fichier du modèle dans Réglages",
  tzMicError: "Micro inaccessible", tzMicHint: "Autorisez le micro puis réessayez (https requis)",
  tzLost: "Je ne retrouve pas votre position", tzLostHint: "Reprenez au mot indiqué", showWord: "Afficher le mot",
  tzCorrect: "{n} justes", tzWrong: "{n} erreurs", tzShowText: "Afficher le texte",
  tzMissing: "Mot manquant : non récité", tzDifferent: "Différent du mushaf", tzHeard: "Entendu", tzNothing: "rien",
  tzSimilar: "Vous semblez être passé à un passage similaire ({where}), qui continue par",
  continueHere: "Reprendre ici", show: "Afficher",
  tzGreat: "Mémorisation solide.", tzGood: "Bien. Revoyez les passages ci-dessous.", tzLow: "Reprenez la page avant d'avancer.",
  tzAdded: "Ces versets ont été ajoutés à vos erreurs.", hints: "{n} indices",

  searchHint: "Sourate, page, 2:255 ou mots", surahs: "Sourates", juzs: "Juz", bookmarks: "Marque-pages", noBookmarks: "Aucun marque-page",
  verses: "Versets", moreResults: "{n} versets · {m} affichés", noResults: "Aucun résultat", goPage: "Aller à la page {n}",
  findRecite: "Réciter pour trouver", findListening: "Récitez un verset, puis touchez arrêter", findSearching: "Recherche…",
  findNone: "Aucun verset trouvé. Récitez un peu plus longtemps.",

  quiz: "Quiz", mutTab: "Mutashabihat",
  quizIntro: "Chaque question vient du texte du mushaf. Ce que vous ratez revient jusqu'à la maîtrise.",
  scope: "Étendue", byHizb: "Hizb", byPages: "Pages", myMistakes: "Erreurs", wholeHizb: "Hizb entier", thumnOptional: "Thumn (facultatif)",
  fromPage: "De la page", toPage: "à",
  weakCount: "{n} versets dans vos erreurs. Un verset sort après deux bonnes réponses.",
  weakEmpty: "Liste vide. Les versets ratés dans les quiz ou récitations apparaissent ici.",
  quizType: "Type de quiz", modeFull: "Maîtrise complète", modeFullMeta: "Chaque verset dans l'ordre : le compléter, le suivant, débuts des thumns",
  modeMix: "Aléatoire · 20 questions", modeMixMeta: "Suivant, précédent, mot manquant, compléter, thumns",
  askNext: "Quel verset vient après celui-ci ?", askPrev: "Quel verset vient avant celui-ci ?", askBlank: "Quel mot manque ?",
  askThumn: "Comment commence le thumn {k} du hizb {h} ?", askFinish: "Complétez le verset à voix haute, puis révélez",
  reveal: "Révéler", correct: "Juste", wrongBack: "Faux, la question reviendra", honest: "Comparez honnêtement avec le texte :",
  gotIt: "Réussi", missedIt: "Raté ou hésité", end: "Terminer", ofTotal: "{a} sur {b}", repeated: "reprise",
  firstTry: "Juste du premier coup : {a} sur {b}", scoreGreat: "Excellente maîtrise.", scoreGood: "Bien. Revoyez les versets ci-dessous puis recommencez.",
  scoreLow: "À revoir avant une nouvelle page.", toReview: "Versets à revoir ({n})", home: "Aujourd'hui",

  mutIntro: "{g} expressions similaires en {o} endroits du mushaf, trouvées en comparant le texte.",
  play: "Jouer", browse: "Parcourir", starred: "Favoris ({n})", hizbs: "Hizbs", known: "Mémorisés", all: "Tous", none: "Aucun",
  notDone: "en cours", selected: "{n} endroits choisis", round: "Partie de {n}", starredOnly: "Favoris seulement", best: "Meilleur : {n} %",
  mutSearch: "Chercher un mot, ex. البينات", phrases: "{n} expressions", showAll: "Tout afficher", whatFollows: "Que vient-il ensuite ici ?",
  allPlaces: "Tous les endroits ({n})", run: "série {n}", newRound: "Nouvelle partie", missedPhrases: "Expressions ratées",

  language: "Langue", theme: "Apparence", themeAuto: "Auto", themeLight: "Clair", themeDark: "Sombre",
  plan: "Plan de mémorisation", nextPage: "Prochaine nouvelle page", oldPerDay: "Pages de révision ancienne / jour",
  sundayRest: "Dimanche de consolidation", sundayRestMeta: "Pas de nouvelle page le dimanche",
  recitation: "Vérification de récitation", strictness: "Exigence", relaxed: "Souple", normal: "Normale", strict: "Stricte",
  stopOnMistake: "S'arrêter à une erreur", vibrate: "Vibrer en cas d'erreur", yes: "Oui", no: "Non",
  modelFile: "Fichier du modèle", modelFileHint: "Si le téléchargement échoue, récupérez onnx/model-int8.onnx sur HisnLabs/tajweed-v2 (Hugging Face) et choisissez-le ici.",
  backup: "Sauvegarde", backupHint: "La progression est enregistrée dans ce navigateur. Copiez le code pour la transférer (les codes de l'ancienne app fonctionnent aussi).",
  copyCode: "Copier le code", restore: "Restaurer", pasteCode: "Collez le code ici", invalidCode: "Code invalide. Vérifiez qu'il est complet.",
  about: "À propos",
  aboutText: "Texte et police : Complexe du Roi Fahd (KFGQPC) Warsh v10, numérotation de Warsh. Récitation : Cheikh Mohamed Laghdaf, minutage du projet khatmah. La vérification fonctionne sur l'appareil et juge les mots seulement (manquant, différent, passage similaire), pas le tajwid : votre enseignant a le dernier mot.",
};

const ar: Dict = {
  appName: "مصحف الحفظ", riwaya: "رواية ورش عن نافع",
  tabToday: "اليوم", tabMushaf: "المصحف", tabPractice: "التمرين",
  search: "بحث", settings: "الإعدادات", close: "إغلاق", start: "ابدأ", next: "التالي", again: "أعد", confirm: "تأكيد",
  page: "الصفحة {n}", juz: "الجزء {n}", hizb: "الحزب {n}", thumn: "الثمن {n}", ayahs: "{n} آية", percent: "{n}٪",
  pagesRange: "ص {a}–{b}", pageOne: "ص {a}",

  streak: "{n} أيام متتالية", streakStart: "ابدأ سلسلتك اليوم",
  memorizedRange: "محفوظك: من الصفحة ١ إلى {n} · نحو {j} جزء",
  pagesKnown: "صفحة محفوظة", ofMushaf: "من المصحف", dayStreak: "أيام متتالية",
  confirmAsk: "ما الصفحة التي تحفظها اليوم؟", confirmHint: "تضبطها مرة واحدة، ثم تتقدّم الخطة صفحة كل يوم.",
  tasksToday: "مهام اليوم", restDay: "يوم التثبيت · لا حفظ جديد",
  taskNew: "الحفظ الجديد · الصفحة {n}", taskWeek: "ثبّت صفحات الأسبوع", taskWeekMeta: "سمّع {pages} من حفظك، وأصلح المواضع الضعيفة.",
  reads: "القراءات · الهدف ٢٠–٢٥", recites: "من الحفظ · ٢–٣",
  read: "اقرأ", reciteHidden: "مع الإخفاء", reciteMic: "سمّع بالميكروفون",
  taskRecent: "المراجعة القريبة", taskRecentMeta: "{pages} · آخر ٧ صفحات، كل يوم",
  taskOld: "المراجعة البعيدة", taskOldMeta: "{pages} · تدور على محفوظك القديم",
  taskQuiz: "اختبار اليوم", taskQuizMeta: "٢٠ سؤالًا على الصفحة {n}", taskQuizRest: "اختبار متشابهات ١٥ سؤالًا على ما حفظت",
  weakTitle: "{n} آيات تحتاج عناية", weakMeta: "من الاختبارات أو التسميع أو علّمتها في المصحف", test: "اختبرها",
  tip: "إن كانت المراجعة القريبة كثيرة الأخطاء، أعد صفحة الأمس بدل صفحة جديدة.",
  progress: "تقدّمي", hizbMap: "الأحزاب الستون", hizbLegend: "ممتلئ: محفوظ · محدّد: تحفظه الآن", last4Weeks: "آخر ٤ أسابيع",

  modeRead: "قراءة", modeHint: "تلميح", modeHide: "إخفاء", modeRecite: "تسميع",
  tapReveal: "اضغط على آية لكشفها", revealNext: "اكشف التالية",
  listen: "استمع", pause: "إيقاف مؤقت", stop: "إيقاف", audioError: "التلاوة غير متاحة: تحقق من الاتصال أو المتصفح",
  reciter: "القارئ", playFrom: "استمع", markWeak: "موضع خطأ", unmarkWeak: "أزل العلامة", bookmark: "علامة", unbookmark: "محفوظة",
  copy: "نسخ", copied: "نُسخ", similar: "متشابهاتها ({n})",

  tzReady: "جاهز", tzPress: "اضغط الميكروفون وسمّع من حفظك", tzListening: "أستمع إليك", tzWords: "{a} / {b} كلمة", tzDone: "انتهى التسميع",
  tzDownloading: "أحمّل نموذج التعرّف", tzOnce: "مرة واحدة فقط · نحو ٢٣ م.ب", tzPreparing: "أجهّز النموذج",
  tzModelError: "تعذّر تحميل النموذج", tzModelErrorHint: "تحقق من الاتصال، أو اختر ملف النموذج من الإعدادات",
  tzMicError: "لا أستطيع الوصول إلى الميكروفون", tzMicHint: "اسمح باستخدام الميكروفون ثم أعد المحاولة (يلزم https)",
  tzLost: "لم أتعرّف على موضعك", tzLostHint: "أكمل من الكلمة المحدّدة", showWord: "أظهر الكلمة",
  tzCorrect: "{n} صحيحة", tzWrong: "{n} خطأ", tzShowText: "أظهر النص",
  tzMissing: "كلمة ناقصة: لم تُقرأ", tzDifferent: "كلمة مختلفة عمّا في المصحف", tzHeard: "ما سمعه التطبيق", tzNothing: "لا شيء",
  tzSimilar: "يبدو أنك انتقلت إلى موضع متشابه ({where})، حيث تأتي",
  continueHere: "أكمل من هنا", show: "أظهرها",
  tzGreat: "حفظ متقن.", tzGood: "جيد. راجع المواضع أدناه.", tzLow: "أعد الصفحة قبل الانتقال.",
  tzAdded: "أُضيفت هذه الآيات إلى أخطائك.", hints: "{n} تلميح",

  searchHint: "سورة، صفحة، ٢:٢٥٥ أو كلمات", surahs: "السور", juzs: "الأجزاء", bookmarks: "العلامات", noBookmarks: "لا علامات بعد",
  verses: "الآيات", moreResults: "{n} آية · يظهر {m}", noResults: "لا نتائج", goPage: "اذهب إلى الصفحة {n}",
  findRecite: "اقرأ لتجد الآية", findListening: "اقرأ آية ثم اضغط إيقاف", findSearching: "أبحث…",
  findNone: "لم أجد آية مطابقة. اقرأ مدة أطول قليلًا.",

  quiz: "اختبار", mutTab: "المتشابهات",
  quizIntro: "كل سؤال يُبنى من نص المصحف. ما تخطئ فيه يعود إليك حتى تتقنه.",
  scope: "النطاق", byHizb: "حزب", byPages: "صفحات", myMistakes: "أخطائي", wholeHizb: "الحزب كاملًا", thumnOptional: "الثمن (اختياري)",
  fromPage: "من الصفحة", toPage: "إلى",
  weakCount: "{n} آيات في أخطائك. تخرج الآية حين تجيب عنها صحيحًا مرتين.",
  weakEmpty: "قائمتك فارغة. الآيات التي تخطئ فيها في الاختبار أو التسميع تظهر هنا.",
  quizType: "نوع الاختبار", modeFull: "إتقان كامل", modeFullMeta: "كل آية بالترتيب: أكملها، ثم التالية، ثم بدايات الأثمان",
  modeMix: "عشوائي · ٢٠ سؤالًا", modeMixMeta: "التالية، السابقة، الكلمة الناقصة، أكمل الآية، الأثمان",
  askNext: "ما الآية التي تأتي بعد هذه؟", askPrev: "ما الآية التي تأتي قبل هذه؟", askBlank: "ما الكلمة الناقصة؟",
  askThumn: "بماذا يبدأ الثمن {k} من الحزب {h}؟", askFinish: "أكمل الآية من حفظك بصوت مسموع، ثم اكشف",
  reveal: "اكشف", correct: "صحيح", wrongBack: "خطأ، وسيعود هذا السؤال", honest: "قارن تسميعك بالنص بصدق:",
  gotIt: "أصبت", missedIt: "أخطأت أو تردّدت", end: "إنهاء", ofTotal: "{a} من {b}", repeated: "معاد",
  firstTry: "صحيح من أول محاولة: {a} من {b}", scoreGreat: "إتقان ممتاز.", scoreGood: "جيد. راجع الآيات أدناه ثم أعد.",
  scoreLow: "يحتاج مراجعة قبل حفظ صفحة جديدة.", toReview: "آيات تحتاج مراجعة ({n})", home: "اليوم",

  mutIntro: "{g} عبارة متشابهة في {o} موضعًا في المصحف كله، استُخرجت بمقارنة النص.",
  play: "العب", browse: "تصفّح", starred: "المفضّلة ({n})", hizbs: "الأحزاب", known: "محفوظي", all: "الكل", none: "لا شيء",
  notDone: "لم تكمله", selected: "{n} موضعًا مختارًا", round: "جولة {n}", starredOnly: "المفضّلة فقط", best: "أفضل نتيجة: {n}٪",
  mutSearch: "ابحث بكلمة، مثل: البينات", phrases: "{n} عبارة", showAll: "اعرض الكل", whatFollows: "ماذا يأتي بعدها في هذا الموضع؟",
  allPlaces: "كل المواضع ({n})", run: "متتالية {n}", newRound: "جولة جديدة", missedPhrases: "العبارات التي أخطأت فيها",

  language: "اللغة", theme: "المظهر", themeAuto: "تلقائي", themeLight: "فاتح", themeDark: "داكن",
  plan: "خطة الحفظ", nextPage: "الصفحة الجديدة التالية", oldPerDay: "صفحات المراجعة البعيدة يوميًّا",
  sundayRest: "الأحد للتثبيت", sundayRestMeta: "لا صفحة جديدة يوم الأحد",
  recitation: "التسميع بالصوت", strictness: "الصرامة", relaxed: "متساهل", normal: "عادي", strict: "صارم",
  stopOnMistake: "توقّف عند الخطأ", vibrate: "اهتزاز عند الخطأ", yes: "نعم", no: "لا",
  modelFile: "ملف النموذج", modelFileHint: "إن تعذّر التحميل، نزّل onnx/model-int8.onnx من HisnLabs/tajweed-v2 على Hugging Face واختره هنا.",
  backup: "النسخ الاحتياطي", backupHint: "تقدّمك محفوظ في هذا المتصفح. انسخ الرمز لتنقله إلى جهاز آخر (رموز التطبيق السابق تعمل أيضًا).",
  copyCode: "انسخ الرمز", restore: "استرجع", pasteCode: "الصق الرمز هنا", invalidCode: "الرمز غير صالح. تأكد أنك نسخته كاملًا.",
  about: "عن التطبيق",
  aboutText: "النص والخط: مجمع الملك فهد لطباعة المصحف الشريف، رواية ورش الإصدار ١٠، بعدّ ورش. التلاوة: الشيخ محمد لغظف، والتوقيت من مشروع khatmah. التسميع يعمل على جهازك ويحكم على الكلمات فقط (الناقصة، والمختلفة، والانتقال إلى متشابه) لا على التجويد: صحّح مع شيخك.",
};

const DICTS: Record<Lang, Dict> = { en, fr, ar };
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");
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
export type T = ReturnType<typeof useT>;
