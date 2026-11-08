/* Uni Duni TV: tudo que fica salvo no celular */
(function () {
  const KEY = "unidunitv.v1";

  const fresh = () => ({
    v: 1,
    apiKey: "",
    onboarded: false,
    type: "movie",
    items: {},          // "movie:123" -> registro do título com status
    skips: {},          // "movie:123" -> data em que pulou
    shortcuts: JSON.parse(JSON.stringify(UD.DEFAULT_SHORTCUTS)),
    learned: {},        // "natal" -> {id, name}
    kw: {},             // "movie:123" -> [ids de palavras-chave]
    filters: { maxRuntime: 0, minYear: 0, minVote: 0 },
    lastBackup: null,
    sinceBackup: 0
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      return Object.assign(fresh(), JSON.parse(raw));
    } catch (e) { return fresh(); }
  }

  const S = load();
  let timer = null;

  function save(now) {
    clearTimeout(timer);
    const write = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn("save", e); } };
    if (now) write(); else timer = setTimeout(write, 250);
  }

  /* status possíveis:
     want = quero ver | dislike = não gosto (não vi) | liked = vi e gostei | disliked = vi e não gostei */
  function setStatus(it, status) {
    const prev = S.items[it.k] ? Object.assign({}, S.items[it.k]) : null;
    if (!status) delete S.items[it.k];
    else {
      S.items[it.k] = {
        k: it.k, id: it.id, type: it.type, title: it.title, poster: it.poster || null,
        year: it.year || "", vote: it.vote || 0, genres: it.genres || [], status, at: Date.now()
      };
      if (!prev) S.sinceBackup++;
    }
    delete S.skips[it.k];
    save();
    return prev;
  }

  function restore(k, prevRecord) {
    if (prevRecord) S.items[k] = prevRecord; else delete S.items[k];
    save();
  }

  function counts() {
    const c = { total: 0, want: 0, liked: 0, disliked: 0, dislike: 0 };
    Object.values(S.items).forEach(i => { c.total++; c[i.status]++; });
    c.watched = c.liked + c.disliked;
    c.rejected = c.dislike + c.disliked;
    return c;
  }

  function exportData() {
    const copy = JSON.parse(JSON.stringify(S));
    copy.apiKey = ""; // a chave não vai no backup
    copy.exportedAt = new Date().toISOString();
    copy.app = "Uni Duni TV";
    return copy;
  }

  function importData(obj) {
    if (!obj || obj.app !== "Uni Duni TV" || typeof obj.items !== "object") throw new Error("Arquivo não é um backup do Uni Duni TV.");
    const key = S.apiKey;
    const base = fresh();
    Object.keys(S).forEach(k => delete S[k]);
    Object.assign(S, base, obj, { apiKey: key || obj.apiKey || "", onboarded: true });
    delete S.exportedAt; delete S.app;
    save(true);
  }

  function reset() {
    const key = S.apiKey;
    Object.keys(S).forEach(k => delete S[k]);
    Object.assign(S, fresh(), { apiKey: key });
    save(true);
  }

  UD.S = S;
  UD.store = { save, setStatus, restore, counts, exportData, importData, reset };
})();
