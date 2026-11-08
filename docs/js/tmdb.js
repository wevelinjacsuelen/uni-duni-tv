/* Uni Duni TV: conversa com o TMDB (banco de filmes gratuito) */
(function () {
  const BASE = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/";
  const cache = new Map();

  class TmdbError extends Error {
    constructor(msg, status) { super(msg); this.status = status; }
  }

  async function get(path, params = {}, opts = {}) {
    const key = (opts.key || UD.S.apiKey || "").trim();
    if (!key) throw new TmdbError("Sem chave do TMDB", 401);
    const bearer = key.startsWith("eyJ");
    const q = new URLSearchParams(Object.assign({ language: "pt-BR" }, params));
    if (!bearer) q.set("api_key", key);
    const url = `${BASE}${path}?${q}`;
    if (!opts.noCache && cache.has(url)) return cache.get(url);
    const p = (async () => {
      let res;
      try {
        res = await fetch(url, { headers: bearer ? { Authorization: `Bearer ${key}`, accept: "application/json" } : { accept: "application/json" } });
      } catch (e) {
        throw new TmdbError("Sem conexão com a internet.", 0);
      }
      if (res.status === 401) throw new TmdbError("Chave do TMDB inválida.", 401);
      if (!res.ok) throw new TmdbError(`O TMDB respondeu com erro ${res.status}.`, res.status);
      return res.json();
    })();
    cache.set(url, p);
    p.catch(() => cache.delete(url));
    return p;
  }

  function canonGenres(ids, type) {
    const out = new Set();
    (ids || []).forEach(id => (UD.TMDB_TO_CANON[type][id] || []).forEach(k => out.add(k)));
    return [...out];
  }

  /* transforma o formato do TMDB no formato do app */
  function norm(r, type) {
    type = type || r.media_type;
    if (type !== "movie" && type !== "tv") return null;
    const date = r.release_date || r.first_air_date || "";
    const ids = r.genre_ids || (r.genres || []).map(g => g.id);
    return {
      k: `${type}:${r.id}`, id: r.id, type,
      title: r.title || r.name || "Sem título",
      original: r.original_title || r.original_name || "",
      year: date.slice(0, 4),
      date,
      vote: Math.round((r.vote_average || 0) * 10) / 10,
      votes: r.vote_count || 0,
      pop: r.popularity || 0,
      poster: r.poster_path || null,
      backdrop: r.backdrop_path || null,
      overview: r.overview || "",
      genres: canonGenres(ids, type),
      genreNames: (r.genres || []).map(g => g.name)
    };
  }

  function list(data, type) {
    return (data.results || []).map(r => norm(r, type)).filter(Boolean);
  }

  function genreParam(keys, type) {
    const ids = new Set();
    (keys || []).forEach(k => (UD.GENRE_BY_KEY[k] ? UD.GENRE_BY_KEY[k][type] : []).forEach(id => ids.add(id)));
    return [...ids].join("|");
  }

  async function discover(type, o = {}) {
    const p = {
      sort_by: o.sort || "popularity.desc",
      include_adult: "false",
      page: o.page || 1,
      "vote_count.gte": o.minVotes != null ? o.minVotes : 100
    };
    const g = genreParam(o.genres, type);
    if (g) p.with_genres = g;
    if (o.without && o.without.length) {
      const w = genreParam(o.without, type);
      if (w) p.without_genres = w.replace(/\|/g, ",");
    }
    if (o.keywords && o.keywords.length) p.with_keywords = o.keywords.join("|");
    const f = o.filters || {};
    if (f.minVote) p["vote_average.gte"] = f.minVote;
    if (f.minYear) p[type === "movie" ? "primary_release_date.gte" : "first_air_date.gte"] = `${f.minYear}-01-01`;
    if (f.maxRuntime && type === "movie") p["with_runtime.lte"] = f.maxRuntime;
    if (o.genres && o.genres.length && !g) return { results: [], total: 0, pages: 0 }; // gênero não existe nesse tipo
    const d = await get(`/discover/${type}`, p);
    return { results: list(d, type), total: d.total_results || 0, pages: d.total_pages || 0 };
  }

  async function details(type, id) {
    const d = await get(`/${type}/${id}`, { append_to_response: "keywords,credits,external_ids" });
    const it = norm(d, type);
    const kws = (d.keywords && (d.keywords.keywords || d.keywords.results)) || [];
    it.keywords = kws.map(k => k.id);
    it.keywordNames = kws.map(k => k.name);
    it.runtime = type === "movie" ? d.runtime || 0 : (d.episode_run_time && d.episode_run_time[0]) || 0;
    it.seasons = d.number_of_seasons || 0;
    it.imdb = d.imdb_id || (d.external_ids && d.external_ids.imdb_id) || "";
    it.cast = ((d.credits && d.credits.cast) || []).slice(0, 4).map(c => c.name);
    if (!it.overview) {
      try {
        const en = await get(`/${type}/${id}`, { language: "en-US" });
        if (en.overview) { it.overview = en.overview; it.overviewEn = true; }
      } catch (e) { /* sem sinopse */ }
    }
    UD.S.kw[it.k] = it.keywords.slice(0, 40);
    return it;
  }

  const img = (path, size = "w500") => path ? `${IMG}${size}${path}` : UD.PLACEHOLDER;

  UD.PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#141418"/><g fill="none" stroke="#f8a51c" stroke-width="6" opacity=".55"><rect x="60" y="118" width="80" height="64" rx="10"/><path d="M80 118l-14-22M120 118l14-22"/></g></svg>`);

  UD.tmdb = { get, norm, list, discover, details, img, TmdbError };
})();
