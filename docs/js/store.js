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
    prog: {},           // "tv:123" -> { "1": [1,2,3], "2": [1] } episódios vistos por temporada
    tv: {},             // "tv:123" -> { sn:[[temp, qtd]], L:[temp,ep], st:"Ended", nx:{...} } dados da série
    daily: {},          // "2026-11-08" -> { movie: {...}, tv: {...} } (sugestão do dia)
    dailyVary: true,    // varia a sugestão conforme o dia da semana
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

  /* ---- episódios ---- */
  let lastProg = null; // para o "Desfazer" devolver também os episódios
  const copy = o => (o ? JSON.parse(JSON.stringify(o)) : null);

  // quantos episódios da temporada n já foram ao ar (c = total anunciado)
  function airedOf(k, n, c) {
    const t = S.tv[k];
    if (!t || !t.L) return t ? 0 : c;
    if (n < t.L[0]) return c;
    if (n === t.L[0]) return Math.min(c, t.L[1]);
    return 0;
  }
  function progOf(k) {
    const t = S.tv[k], p = S.prog[k] || {};
    let done = 0, total = 0;
    ((t && t.sn) || []).forEach(([n, c]) => { const a = airedOf(k, n, c); total += a; done += Math.min(a, (p[n] || []).length); });
    return { done, total };
  }
  function nextEp(k) {
    const t = S.tv[k], p = S.prog[k] || {};
    if (!t || !t.sn) return null;
    for (const [n, c] of t.sn.slice().sort((a, b) => a[0] - b[0])) {
      const a = airedOf(k, n, c), have = new Set(p[n] || []);
      for (let e = 1; e <= a; e++) if (!have.has(e)) return [n, e];
    }
    return null;
  }
  function setEps(k, n, eps, on) {
    const p = S.prog[k] = S.prog[k] || {};
    const set = new Set(p[n] || []);
    eps.forEach(e => (on ? set.add(e) : set.delete(e)));
    if (set.size) p[n] = [...set].sort((a, b) => a - b); else delete p[n];
    if (!Object.keys(p).length) delete S.prog[k];
    if (S.items[k]) S.items[k].last = Date.now();
    save();
  }
  function fillAll(k) {
    const t = S.tv[k]; if (!t || !t.sn) return;
    const p = {};
    t.sn.forEach(([n, c]) => { const a = airedOf(k, n, c); if (a) p[n] = Array.from({ length: a }, (_, i) => i + 1); });
    if (Object.keys(p).length) S.prog[k] = p;
  }

  /* status possíveis:
     want = quero ver | dislike = não gosto (não vi) | liked = vi e gostei | disliked = vi e não gostei
     dropped = comecei e desisti (com motivo opcional em "reason")
     watching = série em andamento (alguns episódios vistos) */
  function setStatus(it, status, reason) {
    const prev = S.items[it.k] ? Object.assign({}, S.items[it.k]) : null;
    lastProg = { k: it.k, val: copy(S.prog[it.k]) };
    if (!status) { delete S.items[it.k]; delete S.prog[it.k]; }
    else {
      S.items[it.k] = {
        k: it.k, id: it.id, type: it.type, title: it.title, poster: it.poster || null,
        year: it.year || "", vote: it.vote || 0, genres: it.genres || [], status, at: Date.now()
      };
      if (status === "dropped" && reason) S.items[it.k].reason = reason;
      if (prev && prev.last) S.items[it.k].last = prev.last;
      if (!prev) S.sinceBackup++;
      if (it.type === "tv" && (status === "liked" || status === "disliked")) fillAll(it.k);
    }
    delete S.skips[it.k];
    save();
    return prev;
  }

  function restore(k, prevRecord) {
    if (prevRecord) S.items[k] = prevRecord; else delete S.items[k];
    if (lastProg && lastProg.k === k) { if (lastProg.val) S.prog[k] = lastProg.val; else delete S.prog[k]; }
    save();
  }

  function counts() {
    const c = { total: 0, want: 0, watching: 0, liked: 0, disliked: 0, dislike: 0, dropped: 0 };
    Object.values(S.items).forEach(i => { c.total++; c[i.status]++; });
    c.watched = c.liked + c.disliked + c.dropped;
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
  UD.store = { save, setStatus, restore, counts, airedOf, progOf, nextEp, setEps, exportData, importData, reset };
})();
