// Seed data for languages and the video category taxonomy (source: docs/Guidelines spec).
// Pure data — used by prisma/seed-discovery.mjs and by tests. Safe to extend; never reorder
// existing codes/slugs (they are stable identifiers stored in URLs and user preferences).

// ───────────────────────────── 104 languages ─────────────────────────────
// [code (BCP 47), iso639-1, iso639-3, English name, native name, ISO 15924 script, direction, group, region, popular]
const L = (code, i1, i3, en, native, script, dir = "LTR", group = "INTERNATIONAL", region = null, popular = false) =>
  ({ code, iso6391: i1, iso6393: i3, nameEn: en, nameNative: native, script, direction: dir, group, region, popular });

export const LANGUAGES = [
  // 1–14 · Major Indian languages
  L("hi", "hi", "hin", "Hindi", "हिन्दी", "Deva", "LTR", "INDIAN", "India", true),
  L("pa", "pa", "pan", "Punjabi", "ਪੰਜਾਬੀ", "Guru", "LTR", "INDIAN", "India", true),
  L("raj", null, "raj", "Rajasthani", "राजस्थानी", "Deva", "LTR", "INDIAN", "India", true),
  L("bgc", null, "bgc", "Haryanvi", "हरियाणवी", "Deva", "LTR", "INDIAN", "India", true),
  L("bho", null, "bho", "Bhojpuri", "भोजपुरी", "Deva", "LTR", "INDIAN", "India / Nepal", true),
  L("bn", "bn", "ben", "Bengali", "বাংলা", "Beng", "LTR", "INDIAN", "India / Bangladesh", true),
  L("te", "te", "tel", "Telugu", "తెలుగు", "Telu", "LTR", "INDIAN", "India", true),
  L("mr", "mr", "mar", "Marathi", "मराठी", "Deva", "LTR", "INDIAN", "India", true),
  L("ta", "ta", "tam", "Tamil", "தமிழ்", "Taml", "LTR", "INDIAN", "India / Sri Lanka", true),
  L("ur", "ur", "urd", "Urdu", "اردو", "Arab", "RTL", "INDIAN", "India / Pakistan", true),
  L("gu", "gu", "guj", "Gujarati", "ગુજરાતી", "Gujr", "LTR", "INDIAN", "India", true),
  L("kn", "kn", "kan", "Kannada", "ಕನ್ನಡ", "Knda", "LTR", "INDIAN", "India", true),
  L("ml", "ml", "mal", "Malayalam", "മലയാളം", "Mlym", "LTR", "INDIAN", "India", true),
  L("or", "or", "ory", "Odia", "ଓଡ଼ିଆ", "Orya", "LTR", "INDIAN", "India", true),
  // 15–24
  L("en", "en", "eng", "English", "English", "Latn", "LTR", "INTERNATIONAL", "Worldwide", true),
  L("zh-Hans", "zh", "cmn", "Mandarin Chinese", "普通话", "Hans", "LTR", "INTERNATIONAL", "China / Taiwan / Singapore", true),
  L("es", "es", "spa", "Spanish", "Español", "Latn", "LTR", "INTERNATIONAL", "Spain / Latin America", true),
  L("ar", "ar", "arb", "Modern Standard Arabic", "العربية الفصحى", "Arab", "RTL", "INTERNATIONAL", "Middle East / North Africa", true),
  L("fr", "fr", "fra", "French", "Français", "Latn", "LTR", "INTERNATIONAL", "France / Africa / Canada", true),
  L("pt", "pt", "por", "Portuguese", "Português", "Latn", "LTR", "INTERNATIONAL", "Brazil / Portugal / Africa", true),
  L("ru", "ru", "rus", "Russian", "Русский", "Cyrl", "LTR", "INTERNATIONAL", "Russia / Central Asia", true),
  L("ja", "ja", "jpn", "Japanese", "日本語", "Jpan", "LTR", "INTERNATIONAL", "Japan", true),
  L("de", "de", "deu", "German", "Deutsch", "Latn", "LTR", "INTERNATIONAL", "Germany / Austria / Switzerland", true),
  L("ko", "ko", "kor", "Korean", "한국어", "Kore", "LTR", "INTERNATIONAL", "Korea", true),
  // 25–34
  L("id", "id", "ind", "Indonesian", "Bahasa Indonesia", "Latn", "LTR", "INTERNATIONAL", "Indonesia", true),
  L("tr", "tr", "tur", "Turkish", "Türkçe", "Latn", "LTR", "INTERNATIONAL", "Türkiye"),
  L("vi", "vi", "vie", "Vietnamese", "Tiếng Việt", "Latn", "LTR", "INTERNATIONAL", "Vietnam"),
  L("th", "th", "tha", "Thai", "ไทย", "Thai", "LTR", "INTERNATIONAL", "Thailand"),
  L("fa", "fa", "fas", "Persian (Farsi)", "فارسی", "Arab", "RTL", "INTERNATIONAL", "Iran / Afghanistan / Tajikistan"),
  L("sw", "sw", "swa", "Swahili", "Kiswahili", "Latn", "LTR", "INTERNATIONAL", "East Africa"),
  L("ha", "ha", "hau", "Hausa", "Hausa", "Latn", "LTR", "INTERNATIONAL", "West Africa"),
  L("yo", "yo", "yor", "Yoruba", "Yorùbá", "Latn", "LTR", "INTERNATIONAL", "Nigeria / Benin"),
  L("ig", "ig", "ibo", "Igbo", "Asụsụ Igbo", "Latn", "LTR", "INTERNATIONAL", "Nigeria"),
  L("am", "am", "amh", "Amharic", "አማርኛ", "Ethi", "LTR", "INTERNATIONAL", "Ethiopia"),
  // 35–44
  L("so", "so", "som", "Somali", "Soomaali", "Latn", "LTR", "INTERNATIONAL", "Horn of Africa"),
  L("zu", "zu", "zul", "Zulu", "isiZulu", "Latn", "LTR", "INTERNATIONAL", "South Africa"),
  L("xh", "xh", "xho", "Xhosa", "isiXhosa", "Latn", "LTR", "INTERNATIONAL", "South Africa"),
  L("af", "af", "afr", "Afrikaans", "Afrikaans", "Latn", "LTR", "INTERNATIONAL", "South Africa / Namibia"),
  L("nl", "nl", "nld", "Dutch", "Nederlands", "Latn", "LTR", "INTERNATIONAL", "Netherlands / Belgium"),
  L("it", "it", "ita", "Italian", "Italiano", "Latn", "LTR", "INTERNATIONAL", "Italy / Switzerland"),
  L("pl", "pl", "pol", "Polish", "Polski", "Latn", "LTR", "INTERNATIONAL", "Poland"),
  L("uk", "uk", "ukr", "Ukrainian", "Українська", "Cyrl", "LTR", "INTERNATIONAL", "Ukraine"),
  L("ro", "ro", "ron", "Romanian", "Română", "Latn", "LTR", "INTERNATIONAL", "Romania / Moldova"),
  L("hu", "hu", "hun", "Hungarian", "Magyar", "Latn", "LTR", "INTERNATIONAL", "Hungary"),
  // 45–54
  L("el", "el", "ell", "Greek", "Ελληνικά", "Grek", "LTR", "INTERNATIONAL", "Greece / Cyprus"),
  L("cs", "cs", "ces", "Czech", "Čeština", "Latn", "LTR", "INTERNATIONAL", "Czechia"),
  L("sk", "sk", "slk", "Slovak", "Slovenčina", "Latn", "LTR", "INTERNATIONAL", "Slovakia"),
  L("sr", "sr", "srp", "Serbian", "Српски / Srpski", "Cyrl", "LTR", "INTERNATIONAL", "Serbia (Cyrillic and Latin)"),
  L("hr", "hr", "hrv", "Croatian", "Hrvatski", "Latn", "LTR", "INTERNATIONAL", "Croatia"),
  L("bs", "bs", "bos", "Bosnian", "Bosanski", "Latn", "LTR", "INTERNATIONAL", "Bosnia and Herzegovina"),
  L("bg", "bg", "bul", "Bulgarian", "Български", "Cyrl", "LTR", "INTERNATIONAL", "Bulgaria"),
  L("sq", "sq", "sqi", "Albanian", "Shqip", "Latn", "LTR", "INTERNATIONAL", "Albania / Kosovo"),
  L("sl", "sl", "slv", "Slovenian", "Slovenščina", "Latn", "LTR", "INTERNATIONAL", "Slovenia"),
  L("mk", "mk", "mkd", "Macedonian", "Македонски", "Cyrl", "LTR", "INTERNATIONAL", "North Macedonia"),
  // 55–64
  L("lt", "lt", "lit", "Lithuanian", "Lietuvių", "Latn", "LTR", "INTERNATIONAL", "Lithuania"),
  L("lv", "lv", "lav", "Latvian", "Latviešu", "Latn", "LTR", "INTERNATIONAL", "Latvia"),
  L("et", "et", "est", "Estonian", "Eesti", "Latn", "LTR", "INTERNATIONAL", "Estonia"),
  L("fi", "fi", "fin", "Finnish", "Suomi", "Latn", "LTR", "INTERNATIONAL", "Finland"),
  L("sv", "sv", "swe", "Swedish", "Svenska", "Latn", "LTR", "INTERNATIONAL", "Sweden / Finland"),
  L("no", "no", "nor", "Norwegian", "Norsk", "Latn", "LTR", "INTERNATIONAL", "Norway"),
  L("da", "da", "dan", "Danish", "Dansk", "Latn", "LTR", "INTERNATIONAL", "Denmark"),
  L("is", "is", "isl", "Icelandic", "Íslenska", "Latn", "LTR", "INTERNATIONAL", "Iceland"),
  L("ga", "ga", "gle", "Irish", "Gaeilge", "Latn", "LTR", "INTERNATIONAL", "Ireland"),
  L("cy", "cy", "cym", "Welsh", "Cymraeg", "Latn", "LTR", "INTERNATIONAL", "Wales"),
  // 65–74
  L("eu", "eu", "eus", "Basque", "Euskara", "Latn", "LTR", "INTERNATIONAL", "Basque Country"),
  L("ca", "ca", "cat", "Catalan", "Català", "Latn", "LTR", "INTERNATIONAL", "Catalonia / Andorra"),
  L("he", "he", "heb", "Hebrew", "עברית", "Hebr", "RTL", "INTERNATIONAL", "Israel"),
  L("hy", "hy", "hye", "Armenian", "Հայերեն", "Armn", "LTR", "INTERNATIONAL", "Armenia"),
  L("ka", "ka", "kat", "Georgian", "ქართული", "Geor", "LTR", "INTERNATIONAL", "Georgia"),
  L("az", "az", "aze", "Azerbaijani", "Azərbaycanca", "Latn", "LTR", "INTERNATIONAL", "Azerbaijan"),
  L("kk", "kk", "kaz", "Kazakh", "Қазақ тілі", "Cyrl", "LTR", "INTERNATIONAL", "Kazakhstan"),
  L("uz", "uz", "uzb", "Uzbek", "Oʻzbekcha", "Latn", "LTR", "INTERNATIONAL", "Uzbekistan"),
  L("ky", "ky", "kir", "Kyrgyz", "Кыргызча", "Cyrl", "LTR", "INTERNATIONAL", "Kyrgyzstan"),
  L("tg", "tg", "tgk", "Tajik", "Тоҷикӣ", "Cyrl", "LTR", "INTERNATIONAL", "Tajikistan"),
  // 75–84
  L("tk", "tk", "tuk", "Turkmen", "Türkmençe", "Latn", "LTR", "INTERNATIONAL", "Turkmenistan"),
  L("mn", "mn", "mon", "Mongolian", "Монгол", "Cyrl", "LTR", "INTERNATIONAL", "Mongolia"),
  L("my", "my", "mya", "Burmese", "မြန်မာ", "Mymr", "LTR", "INTERNATIONAL", "Myanmar"),
  L("km", "km", "khm", "Khmer", "ខ្មែរ", "Khmr", "LTR", "INTERNATIONAL", "Cambodia"),
  L("lo", "lo", "lao", "Lao", "ລາວ", "Laoo", "LTR", "INTERNATIONAL", "Laos"),
  L("ms", "ms", "msa", "Malay", "Bahasa Melayu", "Latn", "LTR", "INTERNATIONAL", "Malaysia / Brunei / Singapore"),
  L("fil", null, "fil", "Filipino (Tagalog)", "Filipino", "Latn", "LTR", "INTERNATIONAL", "Philippines"),
  L("ceb", null, "ceb", "Cebuano", "Sinugbuanong Binisayâ", "Latn", "LTR", "INTERNATIONAL", "Philippines"),
  L("jv", "jv", "jav", "Javanese", "Basa Jawa", "Latn", "LTR", "INTERNATIONAL", "Indonesia"),
  L("su", "su", "sun", "Sundanese", "Basa Sunda", "Latn", "LTR", "INTERNATIONAL", "Indonesia"),
  // 85–94  (the spec lists "Punjabi" a second time here; seeded as Western Punjabi in Shahmukhi script)
  L("si", "si", "sin", "Sinhala", "සිංහල", "Sinh", "LTR", "INTERNATIONAL", "Sri Lanka"),
  L("ne", "ne", "nep", "Nepali", "नेपाली", "Deva", "LTR", "INTERNATIONAL", "Nepal / India"),
  L("ps", "ps", "pus", "Pashto", "پښتو", "Arab", "RTL", "INTERNATIONAL", "Afghanistan / Pakistan"),
  L("kmr", null, "kmr", "Kurdish (Kurmanji)", "Kurdî (Kurmancî)", "Latn", "LTR", "INTERNATIONAL", "Türkiye / Syria / Iraq"),
  L("pnb", null, "pnb", "Western Punjabi (Shahmukhi)", "پنجابی", "Arab", "RTL", "INTERNATIONAL", "Pakistan"),
  L("as", "as", "asm", "Assamese", "অসমীয়া", "Beng", "LTR", "INTERNATIONAL", "India"),
  L("sd", "sd", "snd", "Sindhi", "سنڌي", "Arab", "RTL", "INTERNATIONAL", "Pakistan / India"),
  L("bo", "bo", "bod", "Tibetan", "བོད་སྐད་", "Tibt", "LTR", "INTERNATIONAL", "Tibet / Nepal / India"),
  L("ug", "ug", "uig", "Uyghur", "ئۇيغۇرچە", "Arab", "RTL", "INTERNATIONAL", "Xinjiang / Central Asia"),
  L("ti", "ti", "tir", "Tigrinya", "ትግርኛ", "Ethi", "LTR", "INTERNATIONAL", "Eritrea / Ethiopia"),
  // 95–104
  L("om", "om", "orm", "Oromo", "Afaan Oromoo", "Latn", "LTR", "INTERNATIONAL", "Ethiopia / Kenya"),
  L("rw", "rw", "kin", "Kinyarwanda", "Ikinyarwanda", "Latn", "LTR", "INTERNATIONAL", "Rwanda"),
  L("sn", "sn", "sna", "Shona", "chiShona", "Latn", "LTR", "INTERNATIONAL", "Zimbabwe"),
  L("ny", "ny", "nya", "Chichewa (Nyanja)", "Chichewa", "Latn", "LTR", "INTERNATIONAL", "Malawi / Zambia"),
  L("ln", "ln", "lin", "Lingala", "Lingála", "Latn", "LTR", "INTERNATIONAL", "DR Congo / Congo"),
  L("wo", "wo", "wol", "Wolof", "Wolof", "Latn", "LTR", "INTERNATIONAL", "Senegal / Gambia"),
  L("mg", "mg", "mlg", "Malagasy", "Malagasy", "Latn", "LTR", "INTERNATIONAL", "Madagascar"),
  L("ht", "ht", "hat", "Haitian Creole", "Kreyòl ayisyen", "Latn", "LTR", "INTERNATIONAL", "Haiti"),
  L("qu", "qu", "que", "Quechua", "Runa Simi", "Latn", "LTR", "INTERNATIONAL", "Andes"),
  L("gn", "gn", "grn", "Guarani", "Avañeʼẽ", "Latn", "LTR", "INTERNATIONAL", "Paraguay"),
].map((l, i) => ({ ...l, priority: i + 1 }));

// Extra names people type when searching (lowercase). Native names and English names are matched too.
export const LANGUAGE_ALIASES = {
  hi: ["hindi", "hindustani"], pa: ["punjabi", "panjabi", "gurmukhi"], raj: ["rajasthani", "marwari"],
  bgc: ["haryanvi"], bho: ["bhojpuri"], bn: ["bengali", "bangla"], te: ["telugu"], mr: ["marathi"],
  ta: ["tamil"], ur: ["urdu"], gu: ["gujarati"], kn: ["kannada"], ml: ["malayalam"], or: ["odia", "oriya"],
  en: ["english"], "zh-Hans": ["chinese", "mandarin"], es: ["spanish", "espanol"], ar: ["arabic"],
  fr: ["french"], pt: ["portuguese"], ru: ["russian"], ja: ["japanese"], de: ["german"], ko: ["korean"],
  id: ["indonesian", "bahasa"], tr: ["turkish"], vi: ["vietnamese"], th: ["thai"], fa: ["persian", "farsi"],
  sw: ["swahili", "kiswahili"], fil: ["filipino", "tagalog"], ne: ["nepali"], si: ["sinhala", "sinhalese"],
  my: ["burmese", "myanmar"], kmr: ["kurdish", "kurmanji"], pnb: ["shahmukhi", "western punjabi"],
  ht: ["haitian", "creole"], ny: ["chichewa", "nyanja"], ms: ["malay"], he: ["hebrew"],
};

// Interface locales the website/app can be shown in (taxonomy names are localized for these).
export const INTERFACE_LOCALES = [
  { code: "en", name: "English", nameNative: "English" },
  { code: "hi", name: "Hindi", nameNative: "हिन्दी" },
];

// ───────────────────── Kids-only taxonomy (ages 3–8): 15 main categories ─────────────────────
// Kuchu Puchu is made for children aged 3–8 (Google Play "Ages 5 & under" + "Ages 6–8").
// Everything here must suit that age: no adult topics, no pranks/stunts, no toy-unboxing ads.
// keywords = extra words for search & upload suggestions (English + common Hinglish).
export const KIDS_AUDIENCE = { minAge: 3, maxAge: 8, label: "Made for kids aged 3–8" };

const C = (slug, name, emoji, color, hi, keywords, subcategories, description) =>
  ({ slug, name, emoji, color, nameHi: hi, keywords, subcategories, description });

export const CATEGORIES = [
  C("cartoons-animation", "Cartoons & Animation", "🎬", "#FF4E9B", "कार्टून और एनिमेशन",
    ["cartoon", "cartoons", "animated", "animation", "toon", "kids cartoon"],
    [
      ["Funny Cartoons", "😄", ["funny cartoon", "comedy cartoon"]],
      ["Adventure Cartoons", "🗺️", ["adventure", "journey"]],
      ["Animal Cartoons", "🐻", ["animal cartoon", "bear", "bunny"]],
      ["Fairy Tale Cartoons", "🧚", ["fairy", "princess", "magic"]],
      ["Vehicle Cartoons", "🚗", ["car cartoon", "truck", "train", "bus"]],
      ["Dinosaur Cartoons", "🦖", ["dinosaur", "dino"]],
      ["Space Cartoons", "🚀", ["rocket", "astronaut", "space adventure"]],
    ],
    "Gentle, funny and adventurous cartoons made for little viewers."),
  C("rhymes-songs", "Rhymes & Songs", "🎵", "#1677FF", "राइम्स और गाने",
    ["rhyme", "rhymes", "poem", "song", "songs", "balgeet", "kavita", "music for kids"],
    [
      ["Nursery Rhymes", "🎵", ["nursery", "rhymes", "twinkle", "balgeet"]],
      ["Sing-Along Songs", "🎤", ["sing along", "kids songs", "children songs"]],
      ["Action Songs", "🙌", ["action song", "move along", "clap"]],
      ["Lullabies", "🌙", ["lullaby", "lori", "sleep song"]],
      ["ABC Songs", "🔤", ["abc song", "alphabet song", "phonics song"]],
      ["Counting Songs", "🔢", ["counting song", "numbers song", "ginti"]],
      ["Festival Songs", "🪔", ["festival song", "diwali song", "birthday song"]],
    ],
    "Nursery rhymes, sing-alongs, lullabies and learning songs."),
  C("stories", "Stories & Fairy Tales", "📖", "#8B5CF6", "कहानियाँ और परी कथाएँ",
    ["story", "stories", "kahani", "kahaniyan", "tale", "fairy tale", "bedtime"],
    [
      ["Bedtime Stories", "🌙", ["bedtime story", "sleep story"]],
      ["Moral Stories", "🌟", ["moral story", "lesson story", "naitik"]],
      ["Fairy Tales", "🧚", ["fairy tale", "pari", "princess story"]],
      ["Folk Tales & Panchatantra", "🦊", ["panchatantra", "folk tale", "jataka", "akbar birbal"]],
      ["Animal Stories", "🐘", ["animal story", "jungle story"]],
      ["Read-Aloud Books", "📚", ["read aloud", "picture book", "storybook"]],
    ],
    "Bedtime stories, moral stories, fairy tales and folk tales."),
  C("early-learning", "Early Learning", "🔤", "#22C55E", "शुरुआती पढ़ाई",
    ["learn", "learning", "preschool", "kindergarten", "abc", "123", "padhai", "school"],
    [
      ["Alphabet & Phonics", "🔤", ["alphabet", "phonics", "letters", "varnmala", "abcd"]],
      ["Numbers & Counting", "🔢", ["numbers", "counting", "123", "ginti", "maths for kids"]],
      ["Colours & Shapes", "🔺", ["colours", "colors", "shapes", "rang"]],
      ["First Words", "💬", ["first words", "vocabulary", "words"]],
      ["Days, Months & Seasons", "📅", ["days of the week", "months", "seasons"]],
      ["Opposites & Patterns", "↔️", ["opposites", "patterns", "big small"]],
      ["Learning Games", "🎲", ["learning game", "quiz for kids", "learn and play"]],
    ],
    "Letters, numbers, colours, shapes and first words — learning through play."),
  C("science-nature", "Science & Nature", "🔬", "#06B6D4", "विज्ञान और प्रकृति",
    ["science", "nature", "experiment", "vigyan", "space", "planets", "weather"],
    [
      ["Science for Kids", "🔬", ["kids science", "science fun"]],
      ["Easy Experiments", "🧪", ["experiment", "science experiment", "diy science"]],
      ["Space & Planets", "🪐", ["space", "planets", "solar system", "moon", "stars"]],
      ["Human Body", "🫀", ["body parts", "human body", "senses"]],
      ["Weather & Seasons", "⛅", ["weather", "rain", "seasons"]],
      ["Plants & Gardens", "🌱", ["plants", "garden", "trees", "flowers"]],
      ["Dinosaurs", "🦕", ["dinosaurs", "dino facts", "fossils"]],
    ],
    "Curious questions, safe experiments, space, plants and dinosaurs."),
  C("animals", "Animals", "🐾", "#F59E0B", "जानवर",
    ["animal", "animals", "janwar", "pets", "zoo", "jungle", "farm"],
    [
      ["Animal Friends", "🐾", ["cute animals", "animal friends"]],
      ["Farm Animals", "🐄", ["farm", "cow", "hen", "goat"]],
      ["Wild Animals", "🦁", ["wild animals", "jungle animals", "lion", "elephant"]],
      ["Ocean Animals", "🐠", ["ocean", "sea animals", "fish", "whale"]],
      ["Birds & Insects", "🦋", ["birds", "insects", "butterfly", "bees"]],
      ["Animal Sounds", "🔊", ["animal sounds", "what does the cow say"]],
      ["Pet Care for Kids", "🐶", ["pet care", "puppy", "kitten"]],
    ],
    "Farm, jungle and ocean animals, animal sounds and caring for pets."),
  C("arts-crafts", "Arts & Crafts", "🎨", "#EC4899", "कला और शिल्प",
    ["art", "craft", "crafts", "drawing", "painting", "colouring", "coloring", "diy for kids"],
    [
      ["Easy Crafts", "✂️", ["easy craft", "kids craft", "diy for kids"]],
      ["Drawing", "🖍️", ["how to draw", "drawing for kids"]],
      ["Colouring", "🖌️", ["colouring", "coloring pages"]],
      ["Painting", "🎨", ["painting", "finger painting", "watercolour"]],
      ["Paper Craft & Origami", "📄", ["paper craft", "origami"]],
      ["Clay & Dough", "🧱", ["clay", "play dough", "playdough"]],
    ],
    "Drawing, colouring, painting and easy crafts kids can make."),
  C("dance-movement", "Dance & Movement", "💃", "#F97316", "डांस और मूवमेंट",
    ["dance", "dancing", "nach", "yoga", "exercise", "move"],
    [
      ["Kids Dance", "💃", ["kids dance", "dance along"]],
      ["Freeze Dance & Games", "🧊", ["freeze dance", "movement game"]],
      ["Kids Yoga", "🧘", ["kids yoga", "yoga for kids"]],
      ["Exercise for Kids", "🤸", ["kids exercise", "stretching", "workout for kids"]],
    ],
    "Dance-alongs, movement games and yoga for little bodies."),
  C("kids-comedy", "Kids Comedy", "😂", "#EAB308", "बच्चों की कॉमेडी",
    ["funny", "comedy", "laugh", "silly", "majedar", "hasi"],
    [
      ["Silly Sketches", "🤪", ["silly", "funny sketch"]],
      ["Funny Animals", "🐒", ["funny animals", "animal comedy"]],
      ["Riddles & Kids Jokes", "🃏", ["riddles", "kids jokes", "paheli", "chutkule for kids"]],
      ["Puppet Shows", "🧸", ["puppet", "puppet show", "kathputli"]],
    ],
    "Gentle, silly fun — no pranks or stunts."),
  C("toys-play", "Toys & Play", "🧸", "#A855F7", "खिलौने और खेल",
    ["toys", "toy", "play", "khilona", "pretend play"],
    [
      ["Toy Stories", "🧸", ["toy story", "teddy"]],
      ["Building Blocks", "🧱", ["blocks", "building", "lego"]],
      ["Pretend Play", "👩‍🍳", ["pretend play", "role play", "kitchen set"]],
      ["Puzzles & Board Games", "🧩", ["puzzle", "board game", "jigsaw"]],
    ],
    "Imaginative play, building and puzzles (no unboxing ads)."),
  C("our-world", "Our World", "🌍", "#0EA5E9", "हमारी दुनिया",
    ["world", "festival", "travel", "places", "vehicles", "helpers"],
    [
      ["Family Adventures", "🏕️", ["family fun", "picnic", "outing"]],
      ["Festivals & Celebrations", "🎉", ["festival", "diwali", "holi", "eid", "christmas", "birthday"]],
      ["Countries & Cultures", "🗺️", ["countries", "cultures", "around the world"]],
      ["Community Helpers", "👩‍🚒", ["community helpers", "doctor", "firefighter", "police"]],
      ["Vehicles & Machines", "🚂", ["vehicles", "train", "plane", "tractor", "construction"]],
      ["Places to Visit", "🏰", ["places", "zoo visit", "museum", "monuments"]],
    ],
    "Festivals, places, cultures, community helpers and vehicles."),
  C("good-habits", "Good Habits & Feelings", "🌟", "#10B981", "अच्छी आदतें और भावनाएँ",
    ["habits", "manners", "feelings", "emotions", "safety", "hygiene", "kindness"],
    [
      ["Good Manners", "🙏", ["manners", "please and thank you", "sharing"]],
      ["Healthy Habits", "🪥", ["brushing", "hand washing", "hygiene", "sleep"]],
      ["Healthy Eating", "🥕", ["healthy food", "fruits", "vegetables"]],
      ["Staying Safe", "🦺", ["safety", "road safety", "stranger safety"]],
      ["Feelings & Kindness", "💛", ["feelings", "emotions", "kindness", "friendship"]],
    ],
    "Manners, healthy habits, safety and understanding feelings."),
  C("kids-cooking", "Kids Cooking", "🍳", "#EF4444", "बच्चों की रसोई",
    ["cooking", "recipe", "snack", "khana", "kitchen"],
    [
      ["Easy Snacks", "🥪", ["easy snack", "sandwich", "kids recipe"]],
      ["No-Cook Recipes", "🥗", ["no cook", "no fire recipe", "fruit salad"]],
      ["Fruit & Veggie Fun", "🍓", ["fruit", "veggie", "smoothie"]],
      ["Baking with a Grown-up", "🧁", ["baking", "cupcake", "cookies"]],
    ],
    "Simple, safe recipes to make with a grown-up."),
  C("learn-languages", "Learn Languages", "🗣️", "#6366F1", "भाषाएँ सीखें",
    ["learn english", "learn hindi", "language", "bhasha", "speak"],
    [
      ["Learn English", "🔤", ["learn english", "english for kids", "spoken english for kids"]],
      ["Learn Hindi", "अ", ["learn hindi", "hindi for kids", "varnmala"]],
      ["Learn Other Languages", "🌐", ["learn language", "spanish for kids", "french for kids"]],
      ["Bilingual Stories", "📗", ["bilingual", "two languages"]],
    ],
    "First words and simple phrases in English, Hindi and more."),
  C("sports-play", "Sports & Outdoor Play", "⚽", "#84CC16", "खेल-कूद",
    ["sports", "games", "outdoor", "khel", "playground", "football", "cricket"],
    [
      ["Outdoor Games", "🏃", ["outdoor games", "hide and seek", "tag"]],
      ["Ball Games", "⚽", ["ball games", "football", "cricket for kids"]],
      ["Playground Fun", "🛝", ["playground", "park", "swing"]],
      ["Cycling & Skating", "🚲", ["cycling", "skating", "scooter"]],
    ],
    "Active outdoor play and first sports skills — always safely."),
].map((c, i) => ({
  ...c,
  sortOrder: i + 1,
  subcategories: c.subcategories.map(([name, emoji, keywords], j) => ({
    name, emoji: emoji ?? null, keywords: keywords ?? [], sortOrder: j + 1, slug: slugify(name),
  })),
}));

/** The 12 categories of the original kids app → their place in the kids taxonomy (name → [category, subcategory]). */
export const LEGACY_KIDS_MAP = {
  "Cartoons & Animation": ["cartoons-animation", "funny-cartoons"],
  "Nursery Rhymes": ["rhymes-songs", "nursery-rhymes"],
  "Kids Comedy": ["kids-comedy", "silly-sketches"],
  "Learning & Fun": ["early-learning", "learning-games"],
  "Story Time": ["stories", "bedtime-stories"],
  "Kids Songs": ["rhymes-songs", "sing-along-songs"],
  "Toys & Play": ["toys-play", "toy-stories"],
  "Animals & Friends": ["animals", "animal-friends"],
  "Arts & Crafts": ["arts-crafts", "easy-crafts"],
  "Dance & Fun": ["dance-movement", "kids-dance"],
  "Family Adventures": ["our-world", "family-adventures"],
  "Science for Kids": ["science-nature", "science-for-kids"],
};

export function slugify(name) {
  return name.toLowerCase().replace(/&/g, " ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// The 12 original kids categories → their new home under Kids & Cartoons (same names).
export const LEGACY_KIDS_CATEGORIES = [
  "Cartoons & Animation", "Nursery Rhymes", "Kids Comedy", "Learning & Fun", "Story Time", "Kids Songs",
  "Toys & Play", "Animals & Friends", "Arts & Crafts", "Dance & Fun", "Family Adventures", "Science for Kids",
];

// Default recommendation configuration (version 1). Admins adjust within safe limits.
export const DEFAULT_RECO_SETTINGS = {
  weights: { subcategory: 40, category: 25, engagement: 20, recency: 10, discovery: 5 },
  followBoost: 5, // points added when the viewer follows the creator
  learnedAffinity: 30, // % of the category/subcategory signal that viewing behaviour may contribute
  recencyHalfLifeDays: 14,
  maxPerCreatorPerPage: 2,
  pageSize: 10,
  discoveryShare: 15, // % of a page that may come from outside the viewer's chosen categories
  newCreatorDays: 30,
  newCreatorBoost: 4,
  watchedPenalty: 50, // % score reduction for videos watched in the last 14 days
  notInterestedCreatorPenalty: 40,
  notInterestedSubcategoryPenalty: 15,
  otherLanguagePenalty: 50, // only used when the viewer enabled other-language discovery
  minQuality: { excludeHighFraudFlags: true, maxReportsBeforeHidden: 5 },
};
