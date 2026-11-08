/* Uni Duni TV: dados fixos (gêneros e dicionário de temas) */
window.UD = window.UD || {};

/* Gêneros "canônicos" do app. O TMDB usa números diferentes para filmes e séries,
   então cada gênero aponta para os números de cada lado. */
UD.GENRES = [
  { k: "acao",         n: "Ação",              e: "💥", movie: [28],    tv: [10759] },
  { k: "aventura",     n: "Aventura",          e: "🧭", movie: [12],    tv: [10759] },
  { k: "comedia",      n: "Comédia",           e: "😂", movie: [35],    tv: [35] },
  { k: "drama",        n: "Drama",             e: "🎭", movie: [18],    tv: [18] },
  { k: "romance",      n: "Romance",           e: "❤️", movie: [10749], tv: [] },
  { k: "suspense",     n: "Suspense",          e: "😰", movie: [53],    tv: [] },
  { k: "terror",       n: "Terror",            e: "👻", movie: [27],    tv: [] },
  { k: "misterio",     n: "Mistério",          e: "🔍", movie: [9648],  tv: [9648] },
  { k: "crime",        n: "Crime",             e: "🕵️", movie: [80],    tv: [80] },
  { k: "ficcao",       n: "Ficção científica", e: "🚀", movie: [878],   tv: [10765] },
  { k: "fantasia",     n: "Fantasia",          e: "🐉", movie: [14],    tv: [10765] },
  { k: "animacao",     n: "Animação",          e: "🎨", movie: [16],    tv: [16] },
  { k: "familia",      n: "Família",           e: "👨‍👩‍👧", movie: [10751], tv: [10751] },
  { k: "documentario", n: "Documentário",      e: "🎥", movie: [99],    tv: [99] },
  { k: "historia",     n: "História",          e: "🏛️", movie: [36],    tv: [] },
  { k: "guerra",       n: "Guerra",            e: "🪖", movie: [10752], tv: [10768] },
  { k: "faroeste",     n: "Faroeste",          e: "🤠", movie: [37],    tv: [37] },
  { k: "musica",       n: "Música",            e: "🎵", movie: [10402], tv: [] },
  { k: "infantil",     n: "Infantil",          e: "🧸", movie: [],      tv: [10762] },
  { k: "reality",      n: "Reality",           e: "📺", movie: [],      tv: [10764] },
  { k: "novela",       n: "Novela",            e: "💋", movie: [],      tv: [10766] }
];
UD.GENRE_BY_KEY = {};
UD.GENRES.forEach(g => (UD.GENRE_BY_KEY[g.k] = g));

/* número do TMDB -> gêneros canônicos (por tipo) */
UD.TMDB_TO_CANON = { movie: {}, tv: {} };
UD.GENRES.forEach(g => {
  ["movie", "tv"].forEach(t => g[t].forEach(id => {
    (UD.TMDB_TO_CANON[t][id] = UD.TMDB_TO_CANON[t][id] || []).push(g.k);
  }));
});

/* Dicionário português -> palavra-chave do TMDB (em inglês).
   O número de cada palavra é buscado no TMDB na primeira vez e guardado no celular. */
UD.DICT = {
  "natal": "christmas", "véspera de natal": "christmas eve", "papai noel": "santa claus",
  "ano novo": "new year's eve", "halloween": "halloween", "dia dos namorados": "valentine's day",
  "páscoa": "easter", "ação de graças": "thanksgiving",
  "zumbi": "zombie", "vampiro": "vampire", "lobisomem": "werewolf", "fantasma": "ghost",
  "casa assombrada": "haunted house", "possessão": "demonic possession", "exorcismo": "exorcism",
  "demônio": "demon", "bruxa": "witch", "magia": "magic", "psicopata": "psychopath",
  "serial killer": "serial killer", "slasher": "slasher",
  "viagem no tempo": "time travel", "alienígena": "alien", "espaço": "space", "robô": "robot",
  "inteligência artificial": "artificial intelligence", "apocalipse": "post-apocalyptic future",
  "distopia": "dystopia", "super-herói": "superhero", "futuro": "future", "hacker": "hacker",
  "baseado em fatos reais": "based on true story", "fatos reais": "based on true story",
  "biografia": "biography", "assalto": "heist", "roubo de banco": "bank robbery",
  "golpe": "con artist", "golpista": "con artist", "máfia": "mafia", "detetive": "detective",
  "investigação": "investigation", "tribunal": "courtroom", "advogado": "lawyer",
  "prisão": "prison", "fuga da prisão": "prison escape", "sequestro": "kidnapping",
  "vingança": "revenge", "espionagem": "spy", "espião": "spy", "polícia": "police",
  "guerra": "war", "segunda guerra": "world war ii", "primeira guerra": "world war i",
  "casamento": "wedding", "divórcio": "divorce", "amizade": "friendship",
  "primeiro amor": "first love", "triângulo amoroso": "love triangle",
  "comédia romântica": "romantic comedy", "amadurecimento": "coming of age",
  "adolescência": "coming of age", "escola": "high school", "faculdade": "college",
  "gravidez": "pregnancy", "mãe e filha": "mother daughter relationship",
  "pai e filho": "father son relationship", "irmãos": "siblings", "família": "family",
  "luto": "grief", "superação": "overcoming adversity", "doença": "illness",
  "câncer": "cancer", "depressão": "depression", "autismo": "autism",
  "religião": "religion", "fé": "faith", "bíblia": "bible", "jesus": "jesus christ",
  "esporte": "sport", "futebol": "soccer", "boxe": "boxing", "basquete": "basketball",
  "corrida": "car race", "carro": "car", "dança": "dance", "música": "music", "musical": "musical",
  "cachorro": "dog", "gato": "cat", "cavalo": "horse", "animais": "animal", "tubarão": "shark",
  "natureza": "nature", "sobrevivência": "survival", "desastre": "disaster",
  "oceano": "ocean", "ilha": "island", "praia": "beach", "neve": "snow", "inverno": "winter",
  "verão": "summer", "fazenda": "farm", "cidade pequena": "small town",
  "viagem": "road trip", "road trip": "road trip", "nova york": "new york city", "paris": "paris",
  "las vegas": "las vegas", "cassino": "casino", "dinheiro": "money",
  "culinária": "cooking", "comida": "food", "chef": "chef", "médico": "doctor",
  "hospital": "hospital", "bombeiro": "firefighter", "cowboy": "cowboy", "pirata": "pirate",
  "conto de fadas": "fairy tale", "princesa": "princess", "dragão": "dragon",
  "mitologia": "mythology", "anime": "anime", "videogame": "video game",
  "medieval": "medieval", "rei": "king", "rainha": "queen", "realeza": "royalty",
  "roma antiga": "ancient rome", "egito": "egypt", "deserto": "desert", "selva": "jungle",
  "montanha": "mountain", "avião": "airplane", "trem": "train",
  "final surpreendente": "twist ending", "reviravolta": "twist ending",
  "feel good": "feel-good", "filme leve": "feel-good", "emocionante": "tearjerker",
  "brasil": "brazil", "favela": "favela", "idosos": "old age", "avó": "grandmother"
};

UD.POPULAR_THEMES = ["natal", "viagem no tempo", "baseado em fatos reais", "assalto",
  "zumbi", "super-herói", "comédia romântica", "sobrevivência", "final surpreendente", "cachorro"];

UD.DEFAULT_SHORTCUTS = [
  { id: "s1", name: "Domingo chuvoso", emoji: "🌧️", type: "movie", genres: ["comedia", "romance", "familia"], kw: null, maxRuntime: 120 },
  { id: "s2", name: "Algo leve", emoji: "🍃", type: "both", genres: ["comedia", "animacao"], kw: null, maxRuntime: 0 }
];
