/* Uni Duni TV: o algoritmo que aprende o seu gosto.
   Sem IA paga: cada avaliação soma ou tira pontos dos gêneros e temas do título. */
(function () {
  const W = { liked: 3, watching: 2, want: 1.5, dropped: 0.8, dislike: -2, disliked: -2.5 };
  const SKIP_DAYS = 365; // "Pular" = este título não, para sempre (na prática), sem mexer no seu gosto
  const EXPLORE_EVERY = 5; // 1 em cada 5 cartões é fora da sua bolha (20%)

  function profile() {
    const g = {}, kw = {};
    Object.values(UD.S.items).forEach(it => {
      const w = W[it.status] || 0;
      (it.genres || []).forEach(k => (g[k] = (g[k] || 0) + w));
      (UD.S.kw[it.k] || []).forEach(id => (kw[id] = (kw[id] || 0) + w));
    });
    const maxG = Math.max(1, ...Object.values(g).map(Math.abs));
    Object.keys(g).forEach(k => (g[k] /= maxG));
    const maxK = Math.max(1, ...Object.values(kw).map(Math.abs));
    Object.keys(kw).forEach(k => (kw[k] /= maxK));
    return { g, kw, n: Object.keys(UD.S.items).length };
  }

  function topGenres(p, n = 3, positive = true) {
    return Object.entries(p.g)
      .filter(([, v]) => (positive ? v > 0.15 : v < -0.25))
      .sort((a, b) => (positive ? b[1] - a[1] : a[1] - b[1]))
      .slice(0, n).map(([k]) => k);
  }

  function score(c, p) {
    const gs = c.genres.length ? c.genres.reduce((s, k) => s + (p.g[k] || 0), 0) / c.genres.length : 0;
    let ks = 0;
    if (c.keywords && c.keywords.length) {
      ks = c.keywords.reduce((s, id) => s + (p.kw[id] || 0), 0);
      ks = Math.max(-1, Math.min(1.5, ks / 3));
    }
    const q = Math.max(-1, Math.min(1, ((c.vote || 6) - 6.5) / 2.5));
    return 2 * gs + ks + (c.bonus || 0) + 0.6 * q + Math.random() * 0.25;
  }

  function seen(k) {
    if (UD.S.items[k]) return true;
    const s = UD.S.skips[k];
    return s && Date.now() - s < SKIP_DAYS * 864e5;
  }

  const rnd = n => 1 + Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function passFilters(c, f, mode) {
    if (f.minVote && c.vote && c.vote < f.minVote) return false;
    if (f.minYear && c.year && +c.year < f.minYear) return false;
    const maxR = (mode && mode.maxRuntime) || f.maxRuntime;
    if (maxR && c.runtime && c.type === "movie" && c.runtime > maxR) return false;
    if (maxR && c.runtime && c.type === "tv" && c.runtime > maxR) return false;
    return true;
  }

  /* busca uma nova leva de cartões */
  async function batch(type, mode, exclude, opts = {}) {
    const p = profile();
    const f = UD.S.filters;
    const pool = new Map();
    const add = (arr, extra) => arr.forEach(c => {
      if (!c || seen(c.k) || exclude.has(c.k) || !c.poster) return;
      if (pool.has(c.k)) { pool.get(c.k).bonus += 0.3; return; }
      pool.set(c.k, Object.assign(c, { bonus: 0 }, extra));
    });
    const jobs = [];

    if (mode) {
      const o = { genres: mode.genres, keywords: mode.kw ? [mode.kw.id] : [], filters: Object.assign({}, f, { maxRuntime: mode.maxRuntime || f.maxRuntime }), minVotes: mode.kw ? 10 : 80 };
      mode.page = (mode.page || 0);
      for (let i = 0; i < 2; i++) {
        mode.page++;
        jobs.push(UD.tmdb.discover(type, Object.assign({ page: mode.page }, o)).then(r => add(r.results, { why: mode.label })));
      }
    } else {
      // 1) "quem gostou disso também gostou de..." a partir do que você curtiu
      const mine = Object.values(UD.S.items).filter(i => i.type === type);
      const liked = shuffle(mine.filter(i => i.status === "liked"));
      const wants = shuffle(mine.filter(i => i.status === "want"));
      const seeds = liked.slice(0, 3).concat(wants.slice(0, liked.length >= 3 ? 1 : 3 - liked.length));
      seeds.forEach(s => jobs.push(
        UD.tmdb.get(`/${type}/${s.id}/recommendations`, { page: rnd(2) })
          .then(d => add(UD.tmdb.list(d, type), { bonus: s.status === "liked" ? 1 : 0.6, why: `Porque você ${s.status === "liked" ? "gostou de" : "quer ver"} ${s.title}` }))
          .catch(() => {})
      ));
      // 2) seus gêneros preferidos
      const top = topGenres(p, 3);
      const avoid = topGenres(p, 3, false);
      if (top.length) {
        jobs.push(UD.tmdb.discover(type, { genres: top, without: avoid, page: rnd(8), minVotes: 300, filters: f })
          .then(r => add(r.results, { why: `Combina com ${top.map(k => UD.GENRE_BY_KEY[k].n).slice(0, 2).join(" e ")}` })));
      }
      // 3) começo do zero: o que está em alta
      if (p.n < 8 || !top.length) {
        jobs.push(UD.tmdb.get(`/trending/${type}/week`, { page: rnd(3) }).then(d => add(UD.tmdb.list(d, type), { why: "Em alta esta semana" })).catch(() => {}));
      }
      // 4) fora da bolha: gêneros que você ainda não explorou
      const others = UD.GENRES.filter(g => g[type].length && !top.includes(g.k) && !avoid.includes(g.k)).map(g => g.k);
      const pick = shuffle(others).slice(0, 2);
      if (!opts.noExplore) {
        jobs.push(UD.tmdb.discover(type, { genres: pick, without: avoid, page: rnd(10), minVotes: 800, sort: "vote_average.desc", filters: f })
          .then(r => r.results.forEach(c => add([c], { explore: true, why: "Fora da sua bolha" }))));
      }
    }

    await Promise.allSettled(jobs);

    // rede de segurança: se quase nada veio (ex.: você só avaliou filmes e pediu série), completa com o que está em alta
    if (!mode && pool.size < 6) {
      try { const d = await UD.tmdb.get(`/trending/${type}/week`, { page: rnd(3) }); add(UD.tmdb.list(d, type), { why: "Em alta esta semana" }); } catch (e) { /* sem internet */ }
    }

    const pf = mode || (opts.maxRuntime ? { maxRuntime: opts.maxRuntime } : null);
    let cands = [...pool.values()].filter(c => passFilters(c, f, pf));
    cands.forEach(c => (c.s = score(c, p)));
    const main = cands.filter(c => !c.explore).sort((a, b) => b.s - a.s).slice(0, 12);
    const expl = opts.noExplore ? [] : shuffle(cands.filter(c => c.explore)).slice(0, 3);

    // detalhes: duração, temas e sinopse (se faltar em português busca em inglês)
    const detailed = await Promise.all(main.concat(expl).map(async c => {
      try {
        const d = await UD.tmdb.details(c.type, c.id);
        return Object.assign(d, { bonus: c.bonus, why: c.why, explore: c.explore });
      } catch (e) { return c; }
    }));
    UD.store.save();
    const ok = detailed.filter(c => passFilters(c, f, pf));
    const m2 = ok.filter(c => !c.explore);
    m2.forEach(c => (c.s = score(c, p)));
    m2.sort((a, b) => b.s - a.s);
    const e2 = ok.filter(c => c.explore);

    // intercala: a cada 5 cartões, 1 é exploração
    const out = [];
    while (m2.length || e2.length) {
      for (let i = 0; i < EXPLORE_EVERY - 1 && m2.length; i++) out.push(m2.shift());
      if (e2.length) out.push(e2.shift());
      if (!m2.length && e2.length) out.push(...e2.splice(0));
    }
    return out;
  }

  /* porcentagem de gosto por gênero para o perfil (só positivos) */
  function genreBars() {
    const p = profile();
    const pos = Object.entries(p.g).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const neg = Object.entries(p.g).filter(([, v]) => v < -0.25).sort((a, b) => a[1] - b[1]).slice(0, 4).map(([k]) => k);
    return { pos: pos.map(([k, v]) => ({ k, pct: Math.round(v * 100) })), neg };
  }

  /* sugestão do dia: rule = "calm" (seg a qui), "bold" (sex a dom) ou "plain" (sem regra) */
  async function pickDaily(type, rule, exclude) {
    const opts = {};
    if (rule === "calm") { opts.noExplore = true; if (type === "movie") opts.maxRuntime = 110; }
    const got = await batch(type, null, exclude, opts);
    if (!got.length) return null;
    if (rule === "bold") { const e = got.find(c => c.explore); if (e) return e; }
    return got[0];
  }

  UD.engine = { profile, batch, genreBars, seen, pickDaily };
})();
