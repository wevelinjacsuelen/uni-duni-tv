/* Uni Duni TV: telas e interação */
(function () {
  const S = UD.S, store = UD.store, tmdb = UD.tmdb, engine = UD.engine;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normTxt = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

  /* ---------- ícones ---------- */
  const I = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const IC = {
    x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
    heart: I('<path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.6 4.5c2 0 3.4 1.1 4.4 2.6 1-1.5 2.4-2.6 4.4-2.6 3.6 0 5.4 3.7 3.8 6.9C19 15.6 12 20 12 20z"/>'),
    up: I('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    skip: I('<path d="M5 5l7 7-7 7zM13 5l7 7-7 7z" fill="currentColor"/>'),
    star: I('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" fill="currentColor" stroke="none"/>'),
    sliders: I('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    home: I('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    bookmark: I('<path d="M6 3h12v18l-6-4-6 4z"/>'),
    user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>'),
    check: I('<path d="M5 12l5 5L20 7"/>'),
    pause: I('<path d="M9 5v14M15 5v14"/>'),
    sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>'),
    thumbUp: I('<path d="M7 11v9H4v-9zM7 11l4-8c1.7 0 3 1.3 3 3v3h5.2a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 18 20H7"/>'),
    thumbDown: I('<path d="M7 13V4H4v9zM7 13l4 8c1.7 0 3-1.3 3-3v-3h5.2a2 2 0 0 0 2-2.3l-1.2-7A2 2 0 0 0 18 4H7"/>'),
    clap: I('<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 9l1.5-5 16 3.5L21 9M8 4.5l2 4.2M13 5.6l2 3.4"/><path d="M10 13l5 2.5-5 2.5z" fill="currentColor"/>'),
    flame: I('<path d="M12 3c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.5-2-1-3 3 1 5 4 5 7a8 8 0 0 1-16 0c0-4 3-6 5-8 .5 1 1 1.5 1 2z"/>'),
    play: I('<path d="M7 4l13 8-13 8z"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    down: I('<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'),
    upload: I('<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>'),
    chev: I('<path d="M9 6l6 6-6 6"/>'),
    sparkle: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
    refresh: I('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    key: I('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>')
  };
  const WM = `<span class="wordmark">Uni Duni <span class="tv">TV</span></span>`;
  const TYPE_N = { movie: "Filme", tv: "Série" };

  /* ---------- estado da sessão ---------- */
  const U = {
    tab: "home",
    deck: [], deckLoading: false, deckError: null, mode: null,
    ob: { type: "movie", genre: null, page: 1, items: [], open: null, loading: false },
    search: { q: "", kw: null, seq: 0, similar: null },
    listTab: "want", listType: null, today: { busy: {}, err: {}, histItems: [] },
    undo: null, backupNagged: false
  };

  const screen = $("#screen");
  const nav = $("#nav");

  /* ---------- utilidades ---------- */
  function fmtRuntime(m) {
    if (!m) return "";
    const h = Math.floor(m / 60), r = m % 60;
    return h ? `${h}h${r ? ` ${String(r).padStart(2, "0")}min` : ""}` : `${r}min`;
  }
  function metaLine(it, withType) {
    const parts = [];
    if (withType) parts.push(TYPE_N[it.type]);
    if (it.year) parts.push(esc(it.year));
    if (it.type === "movie" && it.runtime) parts.push(fmtRuntime(it.runtime));
    if (it.type === "tv" && it.seasons) parts.push(`${it.seasons} temporada${it.seasons > 1 ? "s" : ""}`);
    return parts.map(p => `<span>${p}</span>`).join('<span class="dot"></span>');
  }
  const ratingPill = v => v ? `<span class="rating">${IC.star}${String(v.toFixed ? v.toFixed(1) : v).replace(".", ",")}</span>` : "";
  const STATUS_TXT = { want: "Quero ver", watching: "Assistindo", liked: "Assisti e gostei", disliked: "Assisti e não gostei", dropped: "Desisti no meio", dislike: "Não gosto" };
  const REASONS = [["repetitivo", "Ficou repetitivo"], ["enrolou", "Enrolou ou perdeu a graça"], ["parei", "Parei e nunca voltei"], ["cancelada", "Foi cancelada"]];
  const REASON_TXT = Object.fromEntries(REASONS);
  const epLabel = ne => `T${ne[0]}E${ne[1]}`;
  function statusText(r) {
    if (r.status === "watching" && r.type === "tv") {
      const { done, total } = store.progOf(r.k), ne = store.nextEp(r.k);
      if (!total) return "Assistindo";
      return `Assistindo: ${done} de ${total}` + (ne ? ` · próximo ${epLabel(ne)}` : " · em dia");
    }
    return statusText0(r);
  }
  const statusText0 = r => r.status === "dropped" && r.reason && REASON_TXT[r.reason] ? `Desisti: ${REASON_TXT[r.reason].toLowerCase()}` : STATUS_TXT[r.status];

  let toastTimer;
  function toast(msg, action, fn, ms = 4000) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ""}`;
    if (action) $("button", t).onclick = () => { t.classList.remove("show"); fn(); };
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  /* ---------- janelas por cima (o botão voltar do Android fecha) ---------- */
  const overlays = [];
  function openOverlay(html, { center = false, onClose } = {}) {
    hideToast();
    const ov = document.createElement("div");
    ov.className = "overlay" + (center ? " center" : "");
    ov.innerHTML = html;
    ov.addEventListener("click", e => { if (e.target === ov) closeOverlay(); });
    document.body.appendChild(ov);
    overlays.push({ ov, onClose });
    history.pushState({ ov: overlays.length }, "");
    return ov;
  }
  function closeOverlay() { if (overlays.length) history.back(); }
  window.addEventListener("popstate", () => {
    const o = overlays.pop();
    if (o) { o.ov.remove(); o.onClose && o.onClose(); }
  });

  function askLiked(title, isTv) {
    return new Promise(resolve => {
      let answered = false;
      const ov = openOverlay(`
        <div class="modal">
          <div class="ic">${IC.clap}</div>
          <h2>Você gostou?</h2>
          <p>${title ? esc(title) : "Conte como foi a sua experiência com este título."}</p>
          <div class="two">
            <button class="btn primary" data-a="liked">${IC.thumbUp} Gostei</button>
            <button class="btn" data-a="disliked">${IC.thumbDown} Não gostei</button>
            <button class="btn wide3" data-a="dropped">${IC.pause} Desisti no meio</button>
            ${isTv ? `<button class="btn wide3" data-a="partial">${IC.play} Vi só algumas temporadas</button>` : ""}
          </div>
          <button class="cancel" data-a="">Cancelar</button>
        </div>`, { center: true, onClose: () => { if (!answered) resolve(null); } });
      $$("[data-a]", ov).forEach(b => b.onclick = () => { answered = true; resolve(b.dataset.a || null); closeOverlay(); });
    });
  }

  function askReason(title) {
    return new Promise(resolve => {
      let answered = false;
      const ov = openOverlay(`
        <div class="modal">
          <h2>Por que desistiu?</h2>
          <p>${title ? esc(title) : ""}</p>
          <div class="reasons">
            ${REASONS.map(([k, t]) => `<button class="btn" data-r="${k}">${t}</button>`).join("")}
          </div>
          <button class="cancel" data-r="">Pular, sem motivo</button>
        </div>`, { center: true, onClose: () => { if (!answered) resolve(""); } });
      $$("[data-r]", ov).forEach(b => b.onclick = () => { answered = true; resolve(b.dataset.r || ""); closeOverlay(); });
    });
  }

  /* pergunta tudo de uma vez: gostou / não gostou / desistiu (+ motivo). Devolve {status, reason} ou null */
  async function askWatched(title, it) {
    const status = await askLiked(title, !!(it && it.type === "tv"));
    if (!status) return null;
    if (status === "partial") return { status: "watching", reason: "", partial: true };
    if (status !== "dropped") return { status, reason: "" };
    await new Promise(r => setTimeout(r, 80)); // deixa a janela anterior fechar
    return { status, reason: await askReason(title) };
  }

  // depois de "vi só algumas temporadas": abre a série para marcar até onde foi
  const openLater = (it, refresh) => setTimeout(() => openDetail(it, { refresh }), 250);

  function confirmBox(title, text, okLabel, danger) {
    return new Promise(resolve => {
      let answered = false;
      const ov = openOverlay(`
        <div class="modal">
          <h2>${esc(title)}</h2><p>${esc(text)}</p>
          <div class="two">
            <button class="btn" data-a="0">Cancelar</button>
            <button class="btn ${danger ? "danger" : "primary"}" data-a="1">${esc(okLabel)}</button>
          </div>
        </div>`, { center: true, onClose: () => { if (!answered) resolve(false); } });
      $$("[data-a]", ov).forEach(b => b.onclick = () => { answered = true; resolve(b.dataset.a === "1"); closeOverlay(); });
    });
  }

  /* ---------- navegação ---------- */
  function hideToast() { $("#toast").classList.remove("show"); }
  function go(tab) {
    hideToast();
    U.tab = tab;
    $$("button", nav).forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
    nav.classList.remove("hidden");
    screen.className = "screen glow-bg";
    screen.scrollTop = 0;
    ({ home: renderHome, today: renderToday, search: renderSearch, lists: renderLists, profile: renderProfile })[tab]();
  }
  nav.addEventListener("click", e => {
    const b = e.target.closest("button[data-tab]");
    if (b) go(b.dataset.tab);
  });

  /* =========================================================
     BOAS-VINDAS (chave do TMDB)
     ========================================================= */
  function renderWelcome() {
    nav.classList.add("hidden");
    screen.className = "screen no-nav glow-bg";
    screen.innerHTML = `
      <div class="welcome">
        <div class="hero">
          <img src="icons/logo-tv.webp" alt="">
          ${WM}
          <p class="muted" style="margin:0">Para quem não sabe o que assistir.</p>
        </div>
        <h2>Antes de começar</h2>
        <p class="muted small" style="margin:0">O app usa o TMDB, um banco de filmes e séries gratuito. Você precisa de uma chave pessoal, que é de graça:</p>
        <ol class="steps">
          <li>Crie uma conta em <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a>.</li>
          <li>Entre em <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">Configurações › API</a> e peça uma chave de uso pessoal.</li>
          <li>Copie a "Chave da API" (ou o "Token de leitura") e cole aqui.</li>
        </ol>
        <div class="field">${IC.key}<input id="key" placeholder="Cole sua chave aqui" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(S.apiKey)}"></div>
        <div class="err" id="err"></div>
        <button class="btn primary block" id="go">Entrar</button>
        <p class="note">A chave fica salva só neste celular. Ela não vai para o GitHub nem para o backup.</p>
      </div>`;
    const goBtn = $("#go");
    goBtn.onclick = async () => {
      const key = $("#key").value.trim();
      const err = $("#err");
      if (!key) { err.textContent = "Cole a chave primeiro."; return; }
      goBtn.disabled = true; err.textContent = "";
      try {
        await tmdb.get("/configuration", {}, { key, noCache: true });
        S.apiKey = key; store.save(true);
        S.onboarded ? go("home") : renderOnboarding();
      } catch (e) {
        err.textContent = e.status === 401 ? "Essa chave não funcionou. Confira se copiou inteira." : e.message;
      } finally { goBtn.disabled = false; }
    };
  }

  /* =========================================================
     PRIMEIRO USO
     ========================================================= */
  function renderOnboarding() {
    nav.classList.add("hidden");
    screen.className = "screen no-nav glow-bg";
    const ob = U.ob;
    const gs = UD.GENRES.filter(g => g[ob.type].length);
    screen.innerHTML = `
      <div class="topbar">${WM}</div>
      <div class="seg" id="obType">
        <button data-t="movie" class="${ob.type === "movie" ? "on" : ""}">Filmes</button>
        <button data-t="tv" class="${ob.type === "tv" ? "on" : ""}">Séries</button>
      </div>
      <div class="ob-head">
        <h1>Escolha títulos que combinam com você</h1>
        <p>Toque num pôster e diga se já assistiu, se tem interesse ou se não gosta. Quanto mais avaliar, melhor o app te conhece.</p>
      </div>
      <div class="chips" id="obG">
        <button class="chip ${!ob.genre ? "on" : ""}" data-g="">Todos</button>
        ${gs.map(g => `<button class="chip ${ob.genre === g.k ? "on" : ""}" data-g="${g.k}">${g.e} ${g.n}</button>`).join("")}
      </div>
      <div class="grid" id="obGrid"></div>
      <button class="btn load-more" id="obMore">Carregar mais</button>
      <div class="ob-footer">
        <div class="count" id="obCount"></div>
        <button class="btn primary block" id="obGo">Continuar</button>
      </div>`;

    $("#obType").onclick = e => {
      const b = e.target.closest("button"); if (!b || b.dataset.t === ob.type) return;
      ob.type = b.dataset.t; ob.genre = null; renderOnboarding(); loadOb(true);
    };
    $("#obG").onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      ob.genre = b.dataset.g || null;
      $$(".chip", $("#obG")).forEach(c => c.classList.toggle("on", c === b));
      loadOb(true);
    };
    $("#obMore").onclick = () => loadOb(false);
    $("#obGo").onclick = () => {
      S.onboarded = true; S.type = ob.type; store.save(true);
      U.deck = []; go("home");
    };
    $("#obGrid").onclick = onTile;
    if (!ob.items.length) loadOb(true); else drawOb();
  }

  async function loadOb(reset) {
    const ob = U.ob;
    if (ob.loading) return;
    ob.loading = true;
    if (reset) { ob.page = 1; ob.items = []; ob.open = null; $("#obGrid").innerHTML = `<div style="grid-column:1/-1;display:grid;place-items:center;padding:40px"><div class="spinner"></div></div>`; }
    else ob.page++;
    try {
      const r = await tmdb.discover(ob.type, { genres: ob.genre ? [ob.genre] : [], sort: "vote_count.desc", page: ob.page, minVotes: 300 });
      const have = new Set(ob.items.map(i => i.k));
      ob.items.push(...r.results.filter(i => i.poster && !have.has(i.k)));
      drawOb();
    } catch (e) {
      $("#obGrid").innerHTML = `<p class="err" style="grid-column:1/-1">${esc(e.message)}</p>`;
    } finally { ob.loading = false; }
  }

  function drawOb() {
    const ob = U.ob;
    $("#obGrid").innerHTML = ob.items.map(it => {
      const st = S.items[it.k] && S.items[it.k].status;
      const badge = st ? `<span class="badge">${{ want: IC.heart, liked: IC.thumbUp, disliked: IC.thumbDown, dropped: IC.pause, dislike: IC.x }[st]}</span>` : "";
      let menu = "";
      if (ob.open === it.k) {
        menu = ob.open2 === it.k
          ? `<div class="menu"><div class="muted small" style="text-align:center">Gostou?</div><div class="row"><button data-s="liked">${"👍"}</button><button data-s="disliked">${"👎"}</button></div><button data-s="dropped">⏸ Desisti</button><button data-s="back">Voltar</button></div>`
          : `<div class="menu">
               <button data-s="seen">✓ Assisti</button>
               <button data-s="want" class="want">♡ Tenho interesse</button>
               <button data-s="dislike">✕ Não gosto</button>
               ${st ? `<button data-s="clear">Limpar</button>` : ""}
             </div>`;
      }
      const sub = [it.year, it.vote ? "★ " + String(it.vote.toFixed(1)).replace(".", ",") : ""].filter(Boolean).join(" · ");
      return `<div class="cell" data-k="${it.k}">
        <div class="tile ${st ? "sel-" + st : ""}">
          <img src="${tmdb.img(it.poster, "w342")}" alt="" loading="lazy">
          ${badge}${menu}
        </div>
        <div class="cap"><b>${esc(it.title)}</b><span>${esc(sub)}</span></div>
      </div>`;
    }).join("");
    const n = store.counts().total;
    $("#obCount").textContent = n ? `${n} avaliado${n > 1 ? "s" : ""}${n < 10 ? ". Avalie pelo menos 10 para começar bem." : ". Ótimo, já dá para começar."}` : "Avalie pelo menos 10 para começar bem.";
  }

  function onTile(e) {
    const tile = e.target.closest(".cell"); if (!tile) return;
    const ob = U.ob, k = tile.dataset.k;
    const it = ob.items.find(i => i.k === k);
    const sb = e.target.closest("button[data-s]");
    if (sb) {
      const s = sb.dataset.s;
      if (s === "seen") { ob.open2 = k; drawOb(); return; }
      if (s === "back") { ob.open2 = null; drawOb(); return; }
      if (s === "dropped") {
        ob.open = null; ob.open2 = null; drawOb();
        askReason(it.title).then(r => { store.setStatus(it, "dropped", r); drawOb(); });
        return;
      }
      store.setStatus(it, s === "clear" ? null : s);
      ob.open = null; ob.open2 = null; drawOb(); return;
    }
    ob.open = ob.open === k ? null : k; ob.open2 = null; drawOb();
  }

  /* =========================================================
     INÍCIO (cartões)
     ========================================================= */
  function renderHome() {
    screen.className = "screen fixed glow-bg";
    const f = S.filters;
    const hasF = f.maxRuntime || f.minYear || f.minVote;
    screen.innerHTML = `
      <div class="topbar">
        ${WM}<div class="spacer"></div>
        <button class="icon-btn ${hasF ? "active" : ""}" id="fBtn" aria-label="Filtros">${IC.sliders}</button>
      </div>
      <div class="seg" id="hType" style="margin-bottom:10px">
        <button data-t="movie" class="${S.type === "movie" ? "on" : ""}">Filmes</button>
        <button data-t="tv" class="${S.type === "tv" ? "on" : ""}">Séries</button>
      </div>
      ${U.mode ? `<div class="mode-banner">${IC.sparkle.replace("<svg", '<svg width="18" height="18"')}<span>${esc(U.mode.label)}</span><button id="mOff" aria-label="Sair do atalho">${IC.x.replace("<svg", '<svg width="18" height="18"')}</button></div>` : ""}
      <div class="deck-wrap" id="deck"></div>
      <div class="actions">
        <div class="act-w"><button class="act nope" data-a="nope" aria-label="Não gosto">${IC.x}</button><span>Não gosto</span></div>
        <div class="act-w"><button class="act seen" data-a="seen" aria-label="Já assisti">${IC.up}</button><span>Já assisti</span></div>
        <div class="act-w"><button class="act skip" data-a="skip" aria-label="Pular">${IC.skip}</button><span>Pular</span></div>
        <div class="act-w want"><button class="act want" data-a="want" aria-label="Quero ver">${IC.heart}</button><span>Quero ver</span></div>
      </div>`;
    $("#hType").onclick = e => {
      const b = e.target.closest("button"); if (!b || b.dataset.t === S.type) return;
      S.type = b.dataset.t; store.save();
      if (U.mode) U.mode.page = 0;
      U.deck = []; U.deckError = null; renderHome();
    };
    $("#fBtn").onclick = openFilters;
    if ($("#mOff")) $("#mOff").onclick = () => { U.mode = null; U.deck = []; renderHome(); };
    $$(".act").forEach(b => b.onclick = () => act(b.dataset.a));
    drawDeck();
    fillDeck();
  }

  async function fillDeck() {
    if (U.deckLoading || U.deck.length >= 4) return;
    U.deckLoading = true; U.deckError = null;
    if (!U.deck.length) drawDeck();
    const type = S.type, modeAtStart = U.mode;
    try {
      let got = [];
      for (let tries = 0; tries < 3 && got.length < 2; tries++) {
        const more = await engine.batch(type, U.mode, new Set(U.deck.map(c => c.k).concat(got.map(c => c.k))));
        got = got.concat(more);
      }
      if (type !== S.type || modeAtStart !== U.mode) return; // mudou no meio
      const have = new Set(U.deck.map(c => c.k));
      U.deck.push(...got.filter(c => !have.has(c.k) && !engine.seen(c.k)));
      if (!got.length && !U.deck.length) U.deckError = "empty";
    } catch (e) {
      U.deckError = e.message || "Erro ao buscar sugestões.";
      if (e.status === 401) { S.apiKey = ""; store.save(true); renderWelcome(); return; }
    } finally {
      U.deckLoading = false;
      if (U.tab === "home" && $("#deck")) {
        const needDraw = !$("#deck .card") || $("#deck .card").length < 3;
        if (needDraw) drawDeck();
      }
    }
  }

  function cardHTML(c, i) {
    const gnames = (c.genres || []).map(k => UD.GENRE_BY_KEY[k] && UD.GENRE_BY_KEY[k].n).filter(Boolean);
    const tag = c.explore
      ? `<span class="type-tag explore">✦ Fora da bolha${gnames[0] ? " · " + esc(gnames[0]) : ""}</span>`
      : `<span class="type-tag">${TYPE_N[c.type]}</span>`;
    const why = c.explore ? `Fora da sua bolha${gnames.length ? ": " + gnames.slice(0, 2).join(" e ") : ""}` : c.why;
    return `<div class="card ${i ? "behind" : ""}" data-k="${c.k}" style="transform:translateY(${i * 14}px) scale(${1 - i * 0.05});z-index:${10 - i}">
      <img class="poster" src="${tmdb.img(c.poster, "w780")}" alt="" draggable="false">
      <div class="shade"></div>
      ${tag}
      <div class="stamp want">${IC.heart} Quero ver</div>
      <div class="stamp nope">${IC.x} Não gosto</div>
      <div class="stamp seen">${IC.check} Já assisti</div>
      <div class="info">
        <h2>${esc(c.title)}</h2>
        <div class="meta">${metaLine(c)}${c.vote ? `<span class="dot"></span>${ratingPill(c.vote)}` : ""}</div>
        ${c.overview ? `<p class="ov">${esc(c.overview)}</p>` : ""}
        ${why ? `<div class="why">${esc(why)}</div>` : ""}
      </div>
    </div>`;
  }

  function drawDeck() {
    const el = $("#deck"); if (!el) return;
    if (!U.deck.length) {
      if (U.deckLoading) el.innerHTML = `<div class="empty"><div class="spinner"></div><p class="muted">Escolhendo títulos para você…</p></div>`;
      else if (U.deckError) el.innerHTML = `<div class="empty">${IC.refresh}<p>${U.deckError === "empty" ? (U.mode ? "Esse atalho não achou mais títulos com os filtros atuais." : "Acabaram as sugestões com esses filtros.") : esc(U.deckError)}</p><button class="btn" id="retry">Tentar de novo</button></div>`;
      else el.innerHTML = `<div class="empty"><div class="spinner"></div></div>`;
      if ($("#retry")) $("#retry").onclick = () => { U.deckError = null; fillDeck(); };
      return;
    }
    const show = U.deck.slice(0, 3);
    el.innerHTML = show.map((c, i) => cardHTML(c, i)).reverse().join("");
    bindDrag($(".card:not(.behind)", el));
    // pré-carrega o próximo pôster
    if (U.deck[3]) { const im = new Image(); im.src = tmdb.img(U.deck[3].poster, "w780"); }
  }

  function bindDrag(card) {
    if (!card) return;
    let sx = 0, sy = 0, dx = 0, dy = 0, t0 = 0, dragging = false, id = null;
    const st = { want: $(".stamp.want", card), nope: $(".stamp.nope", card), seen: $(".stamp.seen", card) };
    const clamp = v => Math.max(0, Math.min(1, v));
    card.addEventListener("pointerdown", e => {
      dragging = true; id = e.pointerId; sx = e.clientX; sy = e.clientY; dx = dy = 0; t0 = Date.now();
      card.setPointerCapture(id); card.style.transition = "none";
    });
    card.addEventListener("pointermove", e => {
      if (!dragging || e.pointerId !== id) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)`;
      const vertical = Math.abs(dy) > Math.abs(dx);
      st.want.style.opacity = vertical ? 0 : clamp(dx / 90);
      st.nope.style.opacity = vertical ? 0 : clamp(-dx / 90);
      st.seen.style.opacity = vertical ? clamp(-dy / 100) : 0;
    });
    const end = e => {
      if (!dragging || (e && e.pointerId !== id)) return;
      dragging = false;
      const quick = Date.now() - t0 < 300 && Math.abs(dx) < 8 && Math.abs(dy) < 8;
      if (quick) { resetCard(card); openDetail(U.deck[0], { deck: true }); return; }
      const vertical = Math.abs(dy) > Math.abs(dx);
      if (!vertical && dx > 110) return act("want");
      if (!vertical && dx < -110) return act("nope");
      if (vertical && dy < -120) return act("seen");
      resetCard(card);
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  function resetCard(card) {
    card.style.transition = "transform .3s cubic-bezier(.2,.8,.2,1)";
    card.style.transform = "";
    $$(".stamp", card).forEach(s => (s.style.opacity = 0));
  }

  function flyOut(card, dir) {
    return new Promise(r => {
      if (!card) return r();
      const w = window.innerWidth;
      const tf = { want: `translate(${w * 1.3}px, -40px) rotate(24deg)`, nope: `translate(${-w * 1.3}px, -40px) rotate(-24deg)`, seen: `translate(0, -120vh)`, skip: `translate(0, 40px) scale(.85)` }[dir];
      const sk = { want: ".stamp.want", nope: ".stamp.nope", seen: ".stamp.seen" }[dir];
      if (sk) $(sk, card).style.opacity = 1;
      card.style.transition = "transform .32s ease-in, opacity .32s";
      card.style.transform = tf;
      if (dir === "skip") card.style.opacity = 0;
      setTimeout(r, 300);
    });
  }

  let busy = false;
  async function act(kind) {
    if (busy || !U.deck.length) return;
    busy = true;
    const it = U.deck[0];
    const card = $("#deck .card:not(.behind)");
    try {
      if (kind === "seen") {
        await flyOut(card, "seen");
        const r = await askWatched(it.title, it);
        if (!r) { drawDeck(); return; }
        commit(it, r.status, r.reason);
        if (r.partial) openLater(it);
      } else {
        await flyOut(card, kind);
        commit(it, kind === "want" ? "want" : kind === "nope" ? "dislike" : "skip");
      }
    } finally { busy = false; }
  }

  function commit(it, status, reason) {
    let undo;
    if (status === "skip") {
      const prevSkip = S.skips[it.k];
      S.skips[it.k] = Date.now(); store.save();
      undo = () => { if (prevSkip) S.skips[it.k] = prevSkip; else delete S.skips[it.k]; store.save(); };
    } else {
      const prev = store.setStatus(it, status, reason);
      undo = () => store.restore(it.k, prev);
    }
    U.deck = U.deck.filter(c => c.k !== it.k);
    drawDeck();
    fillDeck();
    const msg = { want: "Adicionado a Quero ver", dislike: "Anotado: não gosto", liked: "Assistido e gostou", disliked: "Assistido e não gostou", dropped: "Anotado: desistiu", watching: "Anotado: assistindo", skip: "Pulado: não volta a aparecer" }[status];
    toast(msg, "Desfazer", () => {
      undo();
      U.deck = [it].concat(U.deck.filter(c => c.k !== it.k));
      if (U.tab === "home") drawDeck();
    }, 3500);
    if (!U.backupNagged && S.sinceBackup >= 40) {
      U.backupNagged = true;
      setTimeout(() => toast("Você já avaliou bastante. Faça um backup no Perfil.", "Ir", () => go("profile"), 6000), 3800);
    }
  }

  function openFilters() {
    const f = S.filters;
    const opt = (arr, v) => arr.map(([val, txt]) => `<option value="${val}" ${+v === val ? "selected" : ""}>${txt}</option>`).join("");
    const ov = openOverlay(`
      <div class="sheet"><div class="grab"></div>
        <h2>Filtros</h2>
        <p class="muted small" style="margin:0">Valem para os cartões do Início.</p>
        <label class="lbl">Duração máxima</label>
        <select class="sel" id="fR">${opt([[0, "Qualquer"], [90, "Até 1h30"], [120, "Até 2h"], [150, "Até 2h30"]], f.maxRuntime)}</select>
        <label class="lbl">Lançado a partir de</label>
        <select class="sel" id="fY">${opt([[0, "Qualquer ano"], [1990, "1990"], [2000, "2000"], [2010, "2010"], [2015, "2015"], [2020, "2020"], [2024, "2024"]], f.minYear)}</select>
        <label class="lbl">Nota mínima</label>
        <select class="sel" id="fV">${opt([[0, "Qualquer"], [6, "6 ou mais"], [7, "7 ou mais"], [8, "8 ou mais"]], f.minVote)}</select>
        <div class="detail-actions">
          <button class="btn" id="fClr">Limpar</button>
          <button class="btn primary" id="fOk">Aplicar</button>
        </div>
      </div>`);
    const apply = vals => {
      Object.assign(S.filters, vals); store.save();
      U.deck = []; U.deckError = null; if (U.mode) U.mode.page = 0;
      closeOverlay(); setTimeout(renderHome, 30);
    };
    $("#fOk", ov).onclick = () => apply({ maxRuntime: +$("#fR", ov).value, minYear: +$("#fY", ov).value, minVote: +$("#fV", ov).value });
    $("#fClr", ov).onclick = () => apply({ maxRuntime: 0, minYear: 0, minVote: 0 });
  }

  /* =========================================================
     DETALHES
     ========================================================= */
  async function openDetail(it, ctx = {}) {
    if (!it) return;
    const ov = openOverlay(`<div class="sheet" id="det"><div class="grab"></div><div style="display:grid;place-items:center;padding:60px"><div class="spinner"></div></div></div>`);
    let d = it;
    if ((it.runtime === undefined && it.seasons === undefined) || (it.type === "tv" && !S.tv[it.k])) {
      try { d = Object.assign({}, it, await tmdb.details(it.type, it.id)); store.save(); } catch (e) { /* mostra o que tem */ }
    }
    const sheet = $("#det", ov); if (!sheet) return;
    const rec = S.items[d.k];
    const gnames = d.genreNames && d.genreNames.length ? d.genreNames : (d.genres || []).map(k => UD.GENRE_BY_KEY[k] && UD.GENRE_BY_KEY[k].n).filter(Boolean);
    const buttons = ctx.deck
      ? `<button class="btn" data-d="nope">${IC.x} Não gosto</button>
         <button class="btn primary" data-d="want">${IC.heart} Quero ver</button>
         <button class="btn wide" data-d="seen">${IC.check} Já assisti</button>`
      : `${rec && rec.status === "want" ? "" : `<button class="btn primary" data-s="want">${IC.heart} Quero ver</button>`}
         <button class="btn" data-s="seen">${IC.check} Já assisti</button>
         ${rec && rec.status === "dislike" ? "" : `<button class="btn" data-s="dislike">${IC.x} Não gosto</button>`}
         ${rec ? `<button class="btn danger" data-s="clear">${IC.trash} Tirar das listas</button>` : ""}`;
    sheet.innerHTML = `<div class="grab"></div>
      <div class="detail-hero"><img src="${tmdb.img(d.backdrop || d.poster, "w780")}" alt=""></div>
      <h2>${esc(d.title)}</h2>
      ${d.original && d.original !== d.title ? `<div class="muted small">${esc(d.original)}</div>` : ""}
      <div class="meta" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px;color:var(--muted);font-size:14px">${metaLine(d, true)}${d.vote ? `<span class="dot" style="width:3px;height:3px;border-radius:50%;background:currentColor"></span>${ratingPill(d.vote)}` : ""}</div>
      <div class="status small" id="stLab" style="color:var(--amber-2);margin-top:6px">${rec ? `Na sua lista: ${statusText(rec)}` : ""}</div>
      <div class="detail-genres">${gnames.map(n => `<span>${esc(n)}</span>`).join("")}</div>
      <div class="detail-ov">${d.overview ? esc(d.overview) : "Sinopse não disponível."}${d.overviewEn ? ' <span class="muted small">(sinopse só em inglês)</span>' : ""}</div>
      ${d.cast && d.cast.length ? `<div class="cast">Com ${esc(d.cast.join(", "))}</div>` : ""}
      ${d.type === "tv" ? `<div id="eps"></div>` : ""}
      <div class="detail-actions">${buttons}${d.imdb ? `<a class="btn ghost wide" href="https://www.imdb.com/title/${esc(d.imdb)}/" target="_blank" rel="noopener" style="text-decoration:none;grid-column:span 2">Ver no IMDb ↗</a>` : ""}</div>`;

    if (d.type === "tv") initEps(sheet, d, ctx);
    $$("[data-d]", sheet).forEach(b => b.onclick = () => {
      const a = b.dataset.d; closeOverlay(); setTimeout(() => act(a), 60);
    });
    $$("[data-s]", sheet).forEach(b => b.onclick = async () => {
      const s = b.dataset.s;
      let status = s, reason = "", partial = false;
      if (s === "seen") {
        closeOverlay();
        await new Promise(r => setTimeout(r, 60));
        const r = await askWatched(d.title, d);
        if (!r) return;
        status = r.status; reason = r.reason; partial = !!r.partial;
      } else closeOverlay();
      const prev = store.setStatus(d, s === "clear" ? null : status, reason);
      toast(s === "clear" ? "Removido das listas" : `Marcado: ${STATUS_TXT[status]}`, "Desfazer", () => { store.restore(d.k, prev); ctx.refresh && ctx.refresh(); });
      ctx.refresh && ctx.refresh();
      ctx.onRated && ctx.onRated(d, s === "clear" ? null : status);
      if (partial) openLater(d, ctx.refresh);
    });
  }

  /* ---------- episódios (série) ---------- */
  async function afterProgress(d, wasComplete) {
    const rec = S.items[d.k];
    const { done, total } = store.progOf(d.k);
    if (done > 0 && (!rec || rec.status === "want" || rec.status === "dislike")) store.setStatus(d, "watching");
    else if (done === 0 && rec && rec.status === "watching") store.setStatus(d, "want");
    const now = S.items[d.k];
    const complete = total > 0 && done >= total;
    if (!complete || wasComplete || !now || now.status !== "watching") return;
    const t = S.tv[d.k];
    if (t && /^(Ended|Canceled)$/.test(t.st)) {
      await new Promise(r => setTimeout(r, 80));
      const r = await askWatched(d.title);
      if (r) { store.setStatus(d, r.status, r.reason); toast(`Marcado: ${STATUS_TXT[r.status]}`); }
    } else toast(`Você está em dia com ${d.title}`);
  }
  const isComplete = k => { const p = store.progOf(k); return p.total > 0 && p.done >= p.total; };

  async function markNext(k, refresh) {
    const rec = S.items[k], ne = store.nextEp(k); if (!rec || !ne) return;
    const wasC = isComplete(k);
    store.setEps(k, ne[0], [ne[1]], true);
    store.markToday();
    await afterProgress(rec, wasC);
    if (S.items[k] && S.items[k].status === "watching" && !isComplete(k)) {
      toast(`Marcado: ${epLabel(ne)}`, "Desfazer", () => { store.setEps(k, ne[0], [ne[1]], false); afterProgress(rec, false); refresh && refresh(); });
    }
    refresh && refresh();
  }

  function initEps(sheet, d, ctx) {
    const box = $("#eps", sheet); if (!box) return;
    const open = new Set(), sd = {}, loading = new Set();
    const lab = () => { const r = S.items[d.k], el = $("#stLab", sheet); if (el) el.textContent = r ? `Na sua lista: ${statusText(r)}` : ""; };
    const draw = () => {
      const t = S.tv[d.k];
      if (!t || !t.sn.length) { box.innerHTML = ""; return; }
      const p = S.prog[d.k] || {}, { done, total } = store.progOf(d.k), today = dayKey();
      box.innerHTML = `<div class="eps-h"><h3>Episódios</h3><span>${done} de ${total} vistos</span></div>` + t.sn.map(([n, c]) => {
        const a = store.airedOf(d.k, n, c), w = Math.min(a, (p[n] || []).length), full = a > 0 && w >= a;
        let eps = "";
        if (open.has(n)) {
          eps = loading.has(n) ? `<div class="ss-eps"><div style="display:grid;place-items:center;padding:14px"><div class="spinner"></div></div></div>`
            : `<div class="ss-eps">${(sd[n] || []).map(e => {
              const aired = e.date && e.date <= today, on = (p[n] || []).includes(e.n);
              return `<button class="ep ${on ? "on" : ""}" data-ep="${n}:${e.n}" ${aired ? "" : "disabled"}><span class="bx">${on ? IC.check : ""}</span><span class="en">${e.n}. ${esc(e.name)}</span><span class="ed">${aired ? e.date.split("-").reverse().join("/") : "em breve"}</span></button>`;
            }).join("") || `<p class="muted small" style="margin:8px 0">Não consegui carregar os episódios.</p>`}</div>`;
        }
        return `<div class="ss ${open.has(n) ? "open" : ""}"><div class="ss-row">
          <button class="ss-h" data-exp="${n}"><span class="ss-t">Temporada ${n}</span><span class="ss-c">${a ? `${w} de ${a}` : "em breve"}</span><span class="chev">${IC.chev}</span></button>
          <button class="ss-all ${full ? "on" : ""}" data-all="${n}" ${a ? "" : "disabled"} aria-label="Marcar temporada inteira">${IC.check}</button></div>
          <div class="ss-bar"><i style="width:${a ? Math.round(100 * w / a) : 0}%"></i></div>${eps}</div>`;
      }).join("");
    };
    const change = async (n, eps, on) => {
      const wasC = isComplete(d.k);
      store.setEps(d.k, n, eps, on);
      draw();
      await afterProgress(d, wasC);
      lab(); draw(); ctx.refresh && ctx.refresh();
    };
    box.onclick = async ev => {
      const x = ev.target.closest("[data-exp],[data-all],[data-ep]"); if (!x) return;
      const t = S.tv[d.k]; if (!t) return;
      if (x.dataset.exp) {
        const n = +x.dataset.exp;
        if (open.has(n)) { open.delete(n); return draw(); }
        open.add(n);
        if (!sd[n]) {
          loading.add(n); draw();
          try {
            const r = await tmdb.get(`/tv/${d.id}/season/${n}`);
            sd[n] = (r.episodes || []).map(e => ({ n: e.episode_number, name: e.name || `Episódio ${e.episode_number}`, date: e.air_date || "" }));
          } catch (e) { sd[n] = []; }
          loading.delete(n);
        }
        return draw();
      }
      if (x.dataset.all) {
        const n = +x.dataset.all, c = t.sn.find(s => s[0] === n)[1], a = store.airedOf(d.k, n, c);
        const have = (S.prog[d.k] || {})[n] || [];
        return change(n, Array.from({ length: a }, (_, i) => i + 1), have.length < a);
      }
      const [n, e] = x.dataset.ep.split(":").map(Number);
      change(n, [e], !((S.prog[d.k] || {})[n] || []).includes(e));
    };
    draw();
  }

  /* =========================================================
     BUSCA
     ========================================================= */
  /* =========================================================
     HOJE (sugestão do dia: um filme e uma série por dia)
     ========================================================= */
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const pad2 = n => String(n).padStart(2, "0");
  const dayKey = () => { const x = new Date(); return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`; };
  function dayRule() {
    if (!S.dailyVary) return "plain";
    const wd = new Date().getDay(); // 0 = domingo
    return wd === 0 || wd === 5 || wd === 6 ? "bold" : "calm";
  }
  function dayNote(rule, type, explore) {
    if (rule === "calm") return type === "movie" ? "Dia de semana: filme curto, no seu estilo" : "Dia de semana: no seu estilo";
    if (rule === "bold") return explore ? "Fim de semana: algo fora do seu padrão" : "Fim de semana: sem pressa, no seu estilo";
    return "";
  }
  const slim = c => ({ k: c.k, id: c.id, type: c.type, title: c.title, poster: c.poster, backdrop: c.backdrop, year: c.year, vote: c.vote,
    runtime: c.runtime || 0, seasons: c.seasons || 0, overview: c.overview || "", genres: c.genres || [], why: c.why || "", note: c.note || "", explore: !!c.explore });
  const dailyKeysUsed = () => { const set = new Set(); Object.values(S.daily).forEach(d => ["movie", "tv"].forEach(t => d[t] && set.add(d[t].k))); return set; };

  async function ensureToday(type, force) {
    const key = dayKey();
    S.daily[key] = S.daily[key] || {};
    if (S.daily[key][type] && !force) return;
    if (U.today.busy[type]) return;
    U.today.busy[type] = true; U.today.err[type] = null;
    if (U.tab === "today") drawToday();
    try {
      const rule = dayRule();
      const it = await engine.pickDaily(type, rule, dailyKeysUsed());
      if (!it) throw new Error("Não achei uma sugestão agora. Tente de novo.");
      it.note = dayNote(rule, type, !!it.explore);
      S.daily[key][type] = slim(it);
      Object.keys(S.daily).sort().reverse().slice(8).forEach(k => delete S.daily[k]);
      store.save();
    } catch (e) {
      U.today.err[type] = e.message || "Erro ao buscar a sugestão.";
      if (e.status === 401) { S.apiKey = ""; store.save(true); renderWelcome(); return; }
    } finally {
      U.today.busy[type] = false;
      if (U.tab === "today") drawToday();
    }
  }

  function renderToday() {
    screen.innerHTML = `
      <div class="topbar">${WM}</div>
      <h1>Sugestão de hoje</h1>
      <div class="muted" style="margin:2px 0 10px">${cap(new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }))}</div>
      <div id="streak"></div>
      <div id="tdBody"></div>`;
    const body = $("#tdBody");
    body.onclick = e => {
      const b = e.target.closest("[data-td]");
      if (b) { const [a, t] = b.dataset.td.split(":"); return tdAct(a, t); }
      const nx = e.target.closest("[data-nx]");
      if (nx) return markNext(nx.dataset.nx, drawToday);
      const r = e.target.closest(".row-item");
      if (r) { const it = U.today.histItems.find(i => i.k === r.dataset.k) || S.items[r.dataset.k]; if (it) openDetail(it, { refresh: drawToday }); }
    };
    drawToday();
    ensureToday("movie"); ensureToday("tv");
    if (!U.cal.at || Date.now() - U.cal.at > 10 * 60e3 || U.cal.sig !== calSig()) loadCal();
  }

  /* ---------- sequência de dias ---------- */
  function streakHTML() {
    const { cur, today } = store.streakInfo();
    const txt = cur ? `${cur} dia${cur > 1 ? "s" : ""} seguido${cur > 1 ? "s" : ""}${today ? "" : ". Marque um episódio ou filme hoje para manter"}` : "Sem sequência. Use o botão &quot;Vi&quot; ou &quot;Assisti&quot; quando terminar algo.";
    return `<div class="streak ${cur ? "on" : ""}">${IC.flame}<span>${txt}</span></div>`;
  }

  /* ---------- calendário: próximos episódios e estreias ---------- */
  U.cal = { at: 0, ev: [], loading: false };
  const calSig = () => Object.values(S.items).filter(i => (i.type === "tv" && ["watching", "want", "liked"].includes(i.status)) || (i.type === "movie" && i.status === "want")).map(i => i.k + i.status).sort().join(",");
  async function loadCal() {
    if (U.cal.loading) return; U.cal.loading = true; U.cal.sig = calSig();
    if (U.tab === "today") drawToday();
    const today = dayKey();
    try {
      const mine = Object.values(S.items);
      const tvs = mine.filter(i => i.type === "tv" && ["watching", "want", "liked"].includes(i.status))
        .filter(i => { const t = S.tv[i.k]; return !t || !/^(Ended|Canceled)$/.test(t.st); })
        .sort((a, b) => (b.last || b.at) - (a.last || a.at)).slice(0, 30);
      const stale = tvs.filter(i => { const t = S.tv[i.k]; return !t || !t.at || Date.now() - t.at > 20 * 36e5; });
      const yr = String(new Date().getFullYear());
      const mv = mine.filter(i => i.type === "movie" && i.status === "want" && (i.date ? i.date >= today : i.year >= yr) && !(S.cal[i.k] && S.cal[i.k] < today));
      const need = stale.concat(mv.filter(i => !(i.date || S.cal[i.k])).slice(0, 20));
      for (let n = 0; n < need.length; n += 6) {
        await Promise.all(need.slice(n, n + 6).map(async i => {
          try { const d = await tmdb.details(i.type, i.id); if (i.type === "movie") S.cal[i.k] = d.date || "0000"; } catch (e) { /* segue */ }
        }));
      }
      store.save();
      const ev = [];
      tvs.forEach(i => { const t = S.tv[i.k]; if (t && t.nx && t.nx.d && t.nx.d >= today) ev.push({ it: i, date: t.nx.d, label: `T${t.nx.s}E${t.nx.e}` }); });
      mv.forEach(i => { const d = i.date || S.cal[i.k]; if (d && d >= today) ev.push({ it: i, date: d, label: "Estreia do filme" }); });
      ev.sort((a, b) => a.date.localeCompare(b.date));
      U.cal.ev = ev.slice(0, 8); U.cal.at = Date.now();
    } catch (e) { /* sem internet: mantém o que tinha */ }
    U.cal.loading = false;
    if (U.tab === "today") drawToday();
  }
  function calHTML() {
    const head = `<div class="section-h"><h2>Calendário</h2></div>`;
    if (U.cal.loading && !U.cal.ev.length) return head + `<div style="display:grid;place-items:center;padding:16px"><div class="spinner"></div></div>`;
    if (!U.cal.ev.length) return head + `<p class="muted small" style="margin:0 0 20px">Nada previsto para o que você acompanha. Aparecem aqui os próximos episódios das séries que você segue e as estreias dos filmes em Quero ver.</p>`;
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    return head + `<div class="list" style="margin-bottom:22px">${U.cal.ev.map(e => {
      const [y, m, d] = e.date.split("-").map(Number), dt = new Date(y, m - 1, d);
      const diff = Math.round((dt - t0) / 864e5);
      const when = diff === 0 ? "Hoje" : diff === 1 ? "Amanhã" : `Em ${diff} dias`;
      return `<button class="row-item cal" data-k="${e.it.k}"><img src="${tmdb.img(e.it.poster, "w185")}" alt="" loading="lazy"><div class="body"><h3>${esc(e.it.title)}</h3><div class="meta"><span>${esc(e.label)}</span></div><div class="status">${when} · ${dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</div></div><span class="chev">${IC.chev}</span></button>`;
    }).join("")}</div>`;
  }

  function todayCard(type, it) {
    const label = type === "movie" ? "Filme do dia" : "Série do dia";
    if (U.today.busy[type]) return `<div class="td-card"><div class="td-label">${label}</div><div class="empty small"><div class="spinner"></div><p class="muted">Escolhendo para você…</p></div></div>`;
    if (!it) return `<div class="td-card"><div class="td-label">${label}</div><div class="empty small">${IC.refresh}<p>${esc(U.today.err[type] || "Sem sugestão ainda.")}</p><button class="btn" data-td="swap:${type}">Tentar de novo</button></div></div>`;
    const rec = S.items[it.k];
    const done = rec && ["liked", "disliked", "dropped"].includes(rec.status);
    const btns = [];
    if (!done) {
      if (!rec || rec.status !== "want") btns.push(`<button class="btn primary" data-td="want:${type}">${IC.heart} Quero ver</button>`);
      btns.push(`<button class="btn" data-td="seen:${type}">${IC.check} Já assisti</button>`);
      if (!rec || rec.status !== "dislike") btns.push(`<button class="btn" data-td="nope:${type}">${IC.x} Não gosto</button>`);
    }
    return `<div class="td-card">
      <div class="td-label">${label}</div>
      <button class="td-img" data-td="open:${type}"><img src="${tmdb.img(it.backdrop || it.poster, "w780")}" alt=""><span class="td-title">${esc(it.title)}</span></button>
      <div class="meta">${metaLine(it)}${it.vote ? `<span class="dot"></span>${ratingPill(it.vote)}` : ""}</div>
      ${it.overview ? `<p class="td-ov">${esc(it.overview)}</p>` : ""}
      ${it.note ? `<div class="td-note">${esc(it.note)}</div>` : ""}
      ${it.why ? `<div class="td-why">${esc(it.why)}</div>` : ""}
      ${rec ? `<div class="td-status">Na sua lista: ${esc(statusText(rec))}</div>` : ""}
      ${U.today.err[type] ? `<div class="err">${esc(U.today.err[type])}</div>` : ""}
      ${btns.length ? `<div class="td-actions ${btns.length === 2 ? "two" : ""}">${btns.join("")}</div>` : ""}
      <button class="td-swap" data-td="swap:${type}">${IC.refresh} Outra sugestão</button>
    </div>`;
  }

  function nextRow(it) {
    const ne = store.nextEp(it.k);
    return `<div class="row-wrap">${rowHTML(it)}${ne ? `<button class="quick" data-nx="${it.k}" aria-label="Vi ${epLabel(ne)}">${IC.check}<span>Vi ${epLabel(ne)}</span></button>` : ""}</div>`;
  }
  function continueHTML() {
    const w = Object.values(S.items).filter(i => i.status === "watching" && i.type === "tv" && store.nextEp(i.k))
      .sort((a, b) => (b.last || b.at) - (a.last || a.at)).slice(0, 4);
    if (!w.length) return "";
    return `<div class="section-h" style="margin-top:0"><h2>Continue de onde parou</h2></div><div class="list" style="margin-bottom:22px">${w.map(nextRow).join("")}</div>`;
  }

  function historyHTML() {
    const today = dayKey();
    const now = new Date(); const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const all = [];
    const blocks = Object.keys(S.daily).filter(k => k !== today).sort().reverse().slice(0, 7).map(k => {
      const [y, m, d] = k.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      const diff = Math.round((t0 - dt) / 864e5);
      const lab = (diff === 1 ? "Ontem" : cap(dt.toLocaleDateString("pt-BR", { weekday: "long" }))) + ` · ${pad2(d)}/${pad2(m)}`;
      const its = ["movie", "tv"].map(t => S.daily[k][t]).filter(Boolean);
      its.forEach(i => all.push(i));
      return its.length ? `<div class="section-h" style="margin:16px 0 0"><h3>${lab}</h3></div><div class="list">${its.map(rowHTML).join("")}</div>` : "";
    }).join("");
    U.today.histItems = all;
    return blocks ? `<div class="section-h"><h2>Dias anteriores</h2></div><p class="muted small" style="margin:0">Sugestões que você pode ter perdido.</p>${blocks}` : "";
  }

  function drawToday() {
    const body = $("#tdBody"); if (!body) return;
    const day = S.daily[dayKey()] || {};
    const sk = $("#streak"); if (sk) sk.innerHTML = streakHTML();
    body.innerHTML = continueHTML() + calHTML() + todayCard("movie", day.movie) + todayCard("tv", day.tv) + historyHTML() +
      `<p class="note" style="margin-top:20px">A sugestão muda todo dia. A que você não viu fica em "Dias anteriores", sem contar como "não gosto".</p>`;
  }

  async function tdAct(a, type) {
    const it = (S.daily[dayKey()] || {})[type];
    if (a === "swap") {
      const old = (S.daily[dayKey()] || {})[type];
      if (old && !S.items[old.k]) { S.skips[old.k] = Date.now(); store.save(); } // trocou porque não quis esse
      return ensureToday(type, true);
    }
    if (!it) return;
    if (a === "open") return openDetail(it, { refresh: drawToday });
    let status, reason = "", partial = false;
    if (a === "seen") {
      const r = await askWatched(it.title, it);
      if (!r) return;
      status = r.status; reason = r.reason; partial = !!r.partial;
    } else status = a === "want" ? "want" : "dislike";
    const prev = store.setStatus(it, status, reason);
    toast(`Marcado: ${STATUS_TXT[status]}`, "Desfazer", () => { store.restore(it.k, prev); drawToday(); });
    drawToday();
    if (partial) openLater(it, drawToday);
  }

  function dictMatches(q) {
    const n = normTxt(q); if (!n) return [];
    const keys = Object.keys(UD.DICT).concat(Object.keys(UD.GENRE_THEMES).filter(k => !UD.DICT[k]), Object.keys(S.learned).filter(k => !UD.DICT[k] && !UD.GENRE_THEMES[k]));
    const starts = [], has = [];
    keys.forEach(k => { const nk = normTxt(k); if (nk.startsWith(n)) starts.push(k); else if (nk.includes(n)) has.push(k); });
    return starts.sort((a, b) => a.length - b.length).concat(has).slice(0, 6);
  }

  async function resolveTheme(pt) {
    if (S.learned[pt]) return S.learned[pt];
    const en = UD.DICT[pt]; if (!en) return null;
    const d = await tmdb.get("/search/keyword", { query: en, language: "en-US" });
    const res = d.results || [];
    const hit = res.find(r => r.name.toLowerCase() === en.toLowerCase()) || res[0];
    if (!hit) return null;
    S.learned[pt] = { id: hit.id, name: hit.name }; store.save();
    return S.learned[pt];
  }

  function renderSearch() {
    screen.innerHTML = `
      <div class="topbar">${WM}</div>
      <div class="field" style="margin-bottom:12px">${IC.search}
        <input id="q" placeholder="Tema, título ou palavra (ex.: natal)" autocomplete="off" value="${esc(U.search.q)}">
        <button class="clear ${U.search.q || U.search.kw ? "" : "hidden"}" id="qx" aria-label="Limpar">${IC.x}</button>
      </div>
      <div id="simBox"></div>
      <div id="sr"></div>`;
    const q = $("#q");
    let t;
    q.oninput = () => {
      U.search.q = q.value; U.search.kw = null; U.search.similar = null; drawSimilar();
      $("#qx").classList.toggle("hidden", !q.value);
      clearTimeout(t); t = setTimeout(drawSearch, 300);
      drawSearch(true);
    };
    $("#qx").onclick = () => { U.search.q = ""; U.search.kw = null; U.search.similar = null; drawSimilar(); q.value = ""; $("#qx").classList.add("hidden"); drawSearch(); };
    drawSimilar();
    drawSearch();
  }

  /* ---------- parecidos (só na Busca) ---------- */
  function rateSimilar(d, status) {
    if (!["want", "liked", "dropped"].includes(status)) { drawSimilar(); return; }
    const sim = U.search.similar = { k: d.k, title: d.title, type: d.type, items: null, loading: true, err: "" };
    drawSimilar();
    (async () => {
      try {
        let res = tmdb.list(await tmdb.get(`/${d.type}/${d.id}/recommendations`), d.type);
        if (res.length < 8) {
          const more = tmdb.list(await tmdb.get(`/${d.type}/${d.id}/similar`), d.type);
          const have = new Set(res.map(r => r.k));
          res = res.concat(more.filter(m => !have.has(m.k)));
        }
        sim.items = res.filter(r => r.poster && r.k !== d.k).slice(0, 14);
      } catch (e) { sim.err = e.message || "Erro ao buscar parecidos."; }
      sim.loading = false;
      if (U.search.similar === sim) drawSimilar();
    })();
  }

  function drawSimilar() {
    const box = $("#simBox"); if (!box) return;
    const sim = U.search.similar;
    if (!sim) { box.innerHTML = ""; return; }
    const items = (sim.items || []).filter(i => !S.items[i.k] && !engine.seen(i.k));
    let inner;
    if (sim.loading) inner = `<div style="display:grid;place-items:center;padding:22px"><div class="spinner"></div></div>`;
    else if (sim.err) inner = `<p class="err">${esc(sim.err)}</p>`;
    else if (!items.length) inner = `<p class="muted small" style="margin:0 0 8px">Não achei parecidos novos.</p>`;
    else inner = `<div class="sim-row">${items.map(it => {
      const sub = [it.year, it.vote ? "★ " + String(it.vote.toFixed(1)).replace(".", ",") : ""].filter(Boolean).join(" · ");
      return `<button class="sim-card" data-k="${it.k}"><img src="${tmdb.img(it.poster, "w342")}" alt="" loading="lazy"><div class="cap"><b>${esc(it.title)}</b><span>${esc(sub)}</span></div></button>`;
    }).join("")}</div>`;
    box.innerHTML = `<div class="sim-box"><div class="sim-h"><h3>Parecidos com ${esc(sim.title)}</h3><button class="link" id="simX">Fechar</button></div>${inner}</div>`;
    $("#simX", box).onclick = () => { U.search.similar = null; drawSimilar(); };
    box.onclick = e => {
      const c = e.target.closest(".sim-card"); if (!c) return;
      const it = items.find(i => i.k === c.dataset.k);
      if (it) openDetail(it, { refresh: drawSimilar, onRated: rateSimilar });
    };
  }

  function shortcutsHTML() {
    return `<div class="section-h"><h2>Meus atalhos</h2></div>
      <div class="shortcuts">
        ${S.shortcuts.map(s => `<button class="sc" data-sc="${s.id}">
            <span class="edit" data-edit="${s.id}">${IC.edit}</span>
            <span class="emoji">${esc(s.emoji || "🎬")}</span>
            <span><b>${esc(s.name)}</b><small>${esc(scSummary(s))}</small></span>
          </button>`).join("")}
        <button class="sc add" data-new="1">${IC.plus}<b>Novo atalho</b></button>
      </div>`;
  }
  function scSummary(s) {
    const p = [];
    p.push(s.type === "both" ? "Filmes e séries" : s.type === "tv" ? "Séries" : "Filmes");
    if (s.genres && s.genres.length) p.push(s.genres.map(k => UD.GENRE_BY_KEY[k] && UD.GENRE_BY_KEY[k].n).filter(Boolean).slice(0, 3).join(", "));
    if (s.kw) p.push(`tema ${s.kw.label || s.kw.name}`);
    if (s.maxRuntime) p.push(`até ${fmtRuntime(s.maxRuntime)}`);
    return p.join(" · ");
  }
  function bindShortcuts(root) {
    root.onclick = e => {
      const ed = e.target.closest("[data-edit]");
      if (ed) { e.stopPropagation(); return openShortcut(S.shortcuts.find(s => s.id === ed.dataset.edit)); }
      if (e.target.closest("[data-new]")) return openShortcut(null);
      const sc = e.target.closest("[data-sc]");
      if (sc) useShortcut(S.shortcuts.find(s => s.id === sc.dataset.sc));
    };
  }
  function useShortcut(s) {
    if (s.type !== "both") S.type = s.type;
    U.mode = { label: s.name, genres: s.genres || [], kw: s.kw, maxRuntime: s.maxRuntime || 0, page: 0 };
    U.deck = []; U.deckError = null;
    go("home");
  }

  async function drawSearch(quick) {
    const box = $("#sr"); if (!box) return;
    const { q, kw } = U.search;
    const seq = ++U.search.seq;

    if (kw) return drawKwResults(kw, seq);

    if (!q.trim()) {
      box.innerHTML = `${shortcutsHTML()}
        <div class="section-h"><h2>Temas populares</h2></div>
        <div class="chips wrap" id="pop">${UD.POPULAR_THEMES.map(t => `<button class="chip" data-pt="${esc(t)}">${esc(t)}</button>`).join("")}</div>
        <div id="trend"></div>`;
      bindShortcuts($(".shortcuts", box));
      $("#pop").onclick = onThemeChip;
      drawTrend(seq);
      return;
    }

    const local = dictMatches(q);
    const head = `<div class="section-h" style="margin-top:4px"><h3 class="muted">Sugestões de tema</h3></div>
      <div class="chips wrap" id="sug">${local.map(t => `<button class="chip" data-pt="${esc(t)}">${IC.search.replace("<svg", '<svg width="14" height="14"')} ${esc(t)}</button>`).join("")}<span id="sugRemote"></span></div>`;
    if (quick) {
      if (!$("#sug")) box.innerHTML = head + `<div id="titles"></div>`;
      else $("#sug").innerHTML = local.map(t => `<button class="chip" data-pt="${esc(t)}">${IC.search.replace("<svg", '<svg width="14" height="14"')} ${esc(t)}</button>`).join("") + `<span id="sugRemote"></span>`;
      $("#sug").onclick = onThemeChip;
      return;
    }
    box.innerHTML = head + `<div id="titles"><div style="display:grid;place-items:center;padding:30px"><div class="spinner"></div></div></div>`;
    $("#sug").onclick = onThemeChip;

    try {
      const exact = UD.DICT[normTxt(q)] || UD.DICT[q.toLowerCase().trim()];
      const [kwRes, multi, ppl] = await Promise.all([
        tmdb.get("/search/keyword", { query: exact || q, language: "en-US" }).catch(() => ({ results: [] })),
        tmdb.get("/search/multi", { query: q, include_adult: "false" }),
        tmdb.get("/search/person", { query: q, include_adult: "false" }).catch(() => ({ results: [] }))
      ]);
      if (seq !== U.search.seq) return;
      const localIds = new Set(local.map(t => S.learned[t] && S.learned[t].id).filter(Boolean));
      const remote = (kwRes.results || []).filter(k => !localIds.has(k.id)).slice(0, 5);
      const people = (ppl.results || []).filter(x => ["Acting", "Directing", "Writing"].includes(x.known_for_department)).sort((a, b) => b.popularity - a.popularity).slice(0, 2);
      const pchips = people.map(x => `<button class="chip" data-pid="${x.id}" data-pname="${esc(x.name)}" data-pdept="${x.known_for_department}">${IC.user.replace("<svg", '<svg width="14" height="14"')} ${esc(x.name)} <small>pessoa</small></button>`).join("");
      $("#sugRemote").outerHTML = pchips + remote.map(k => `<button class="chip" data-kwid="${k.id}" data-kwname="${esc(k.name)}">${esc(k.name)} <small>tema</small></button>`).join("");
      if (!local.length && !remote.length && !people.length) $("#sug").innerHTML = `<span class="muted small">Nenhum tema com esse nome. Veja os títulos abaixo.</span>`;
      const items = tmdb.list(multi).filter(i => i.poster).slice(0, 20);
      $("#titles").innerHTML = items.length
        ? `<div class="section-h"><h2>Títulos</h2></div><div class="list">${items.map(rowHTML).join("")}</div>`
        : `<p class="muted" style="margin-top:20px">Nenhum título com esse nome.</p>`;
      bindRows($("#titles"), items, () => drawSearch(), rateSimilar);
    } catch (e) {
      if (seq === U.search.seq) $("#titles").innerHTML = `<p class="err">${esc(e.message)}</p>`;
    }
  }

  /* ---------- em alta (o que está bombando no TMDB esta semana) ---------- */
  async function drawTrend(seq) {
    const box = $("#trend"); if (!box) return;
    box.innerHTML = `<div style="display:grid;place-items:center;padding:24px"><div class="spinner"></div></div>`;
    let rows;
    try {
      rows = await Promise.all(["movie", "tv"].map(async t => tmdb.list(await tmdb.get(`/trending/${t}/week`), t).filter(i => i.poster && !S.items[i.k] && !engine.seen(i.k)).slice(0, 14)));
    } catch (e) { if (seq === U.search.seq && $("#trend")) $("#trend").innerHTML = ""; return; }
    if (seq !== U.search.seq || !$("#trend")) return;
    const all = rows[0].concat(rows[1]);
    const strip = (title, items) => items.length ? `<div class="section-h"><h2>${title}</h2></div><div class="sim-row">${items.map(it => `<button class="sim-card" data-k="${it.k}"><img src="${tmdb.img(it.poster, "w342")}" alt="" loading="lazy"><div class="cap"><b>${esc(it.title)}</b><span>${it.vote ? "★ " + String(it.vote.toFixed(1)).replace(".", ",") : ""}</span></div></button>`).join("")}</div>` : "";
    const t = $("#trend");
    t.innerHTML = strip("Filmes em alta", rows[0]) + strip("Séries em alta", rows[1]);
    t.onclick = e => {
      const c = e.target.closest(".sim-card"); if (!c) return;
      const it = all.find(i => i.k === c.dataset.k);
      if (it) openDetail(it, { refresh: () => drawSearch(), onRated: rateSimilar });
    };
  }

  async function onThemeChip(e) {
    const b = e.target.closest("button.chip"); if (!b) return;
    if (b.dataset.pid) {
      const role = { Acting: "act", Directing: "dir", Writing: "wri" }[b.dataset.pdept] || "act";
      U.search.kw = { label: b.dataset.pname, person: { id: +b.dataset.pid, name: b.dataset.pname }, role, ptype: null, credits: null };
      U.search.q = b.dataset.pname; const qi = $("#q"); if (qi) { qi.value = b.dataset.pname; $("#qx").classList.remove("hidden"); }
      return drawSearch();
    }
    if (b.dataset.kwid) {
      const kw = { id: +b.dataset.kwid, name: b.dataset.kwname };
      const q = U.search.q.trim().toLowerCase();
      if (q && !UD.DICT[q] && !S.learned[q]) { S.learned[q] = kw; store.save(); } // palavra nova entra no dicionário
      U.search.kw = Object.assign({ label: q || kw.name }, kw);
      return drawSearch();
    }
    const pt = b.dataset.pt;
    b.disabled = true;
    try {
      let kw = null;
      try { kw = await resolveTheme(pt); } catch (err) { if (!UD.GENRE_THEMES[pt]) throw err; }
      if (!kw && !UD.GENRE_THEMES[pt]) { toast("Não achei esse tema no TMDB."); return; }
      U.search.kw = Object.assign({ label: pt }, kw || {}, UD.GENRE_THEMES[pt] ? { genres: UD.GENRE_THEMES[pt] } : {});
      U.search.q = pt; const qi = $("#q"); if (qi) { qi.value = pt; $("#qx").classList.remove("hidden"); }
      drawSearch();
    } catch (err) { toast(err.message); } finally { b.disabled = false; }
  }

  /* ---------- pessoa: filmografia ---------- */
  const ROLES = [["act", "Atuou"], ["dir", "Dirigiu"], ["wri", "Escreveu"]];
  const WRITE_JOBS = ["Writer", "Screenplay", "Novel", "Author", "Story", "Creator", "Characters", "Book", "Teleplay", "Original Story"];
  function splitCredits(d) {
    const out = { act: new Map(), dir: new Map(), wri: new Map() };
    const put = (m, r) => { const it = tmdb.norm(r, r.media_type); if (it && it.poster && !m.has(it.k)) m.set(it.k, it); };
    (d.cast || []).forEach(r => { if (!(r.genre_ids || []).some(g => g === 10767 || g === 10763)) put(out.act, r); });
    (d.crew || []).forEach(r => {
      if (r.job === "Director") put(out.dir, r);
      if (r.department === "Writing" || WRITE_JOBS.includes(r.job)) put(out.wri, r);
    });
    const res = {};
    Object.keys(out).forEach(k => (res[k] = [...out[k].values()].sort((a, b) => b.pop - a.pop)));
    return res;
  }
  function drawPerson(kw, seq) {
    const box = $("#sr"); if (!box || !kw.credits) return;
    const c = kw.credits;
    const list = (role, type) => c[role].filter(i => i.type === type);
    if (!kw.ptype) { kw.ptype = list(kw.role, "movie").length || !list(kw.role, "tv").length ? "movie" : "tv"; }
    // se o papel escolhido está vazio nesse tipo, escolhe o primeiro que tiver algo
    if (!list(kw.role, kw.ptype).length) { const r = ROLES.find(([k]) => list(k, kw.ptype).length); if (r) kw.role = r[0]; }
    const items = list(kw.role, kw.ptype);
    box.innerHTML = `
      <div class="chips wrap" style="margin-bottom:6px"><button class="chip solid" id="kwOff">${esc(kw.person.name)} ${IC.x.replace("<svg", '<svg width="14" height="14"')}</button></div>
      <div class="seg" id="pT" style="margin:10px 0 4px">${[["movie", "Filmes"], ["tv", "Séries"]].map(([k, n]) => `<button data-t="${k}" class="${k === kw.ptype ? "on" : ""}">${n} (${new Set(ROLES.flatMap(([r]) => list(r, k).map(i => i.k))).size})</button>`).join("")}</div>
      <div class="tabs" id="pR" style="margin-top:12px">${ROLES.filter(([r]) => list(r, kw.ptype).length).map(([r, n]) => `<button class="chip ${r === kw.role ? "solid" : ""}" data-r="${r}">${n} (${list(r, kw.ptype).length})</button>`).join("")}</div>
      <div class="list" id="kwList">${items.length ? items.map(it => { const rec = S.items[it.k]; return `<div class="row-wrap">${rowHTML(it)}${rec ? `<span class="quick-ph"></span>` : `<button class="quick" data-seen="${it.k}" aria-label="Já assisti">${IC.check}<span>Assisti</span></button>`}</div>`; }).join("") : `<p class="muted" style="margin-top:20px">Nada encontrado para ${esc(kw.person.name)} aqui.</p>`}</div>`;
    $("#kwOff").onclick = () => { U.search.kw = null; drawSearch(); };
    $("#pT").onclick = e => { const b = e.target.closest("[data-t]"); if (b) { kw.ptype = b.dataset.t; drawPerson(kw); } };
    $("#pR").onclick = e => { const b = e.target.closest("[data-r]"); if (b) { kw.role = b.dataset.r; drawPerson(kw); } };
    bindRows($("#kwList"), items, () => drawPerson(kw), rateSimilar);
    $("#kwList").addEventListener("click", async e => {
      const q = e.target.closest("[data-seen]"); if (!q) return;
      const it = items.find(i => i.k === q.dataset.seen); if (!it) return;
      const r = await askWatched(it.title, it); if (!r) return;
      const prev = store.setStatus(it, r.status, r.reason);
      toast(`Marcado: ${STATUS_TXT[r.status]}`, "Desfazer", () => { store.restore(it.k, prev); drawPerson(kw); });
      drawPerson(kw);
      if (r.partial) openLater(it, () => drawPerson(kw));
    });
  }
  async function loadPerson(kw, seq) {
    const box = $("#sr");
    box.innerHTML = `<div class="chips wrap" style="margin-bottom:6px"><button class="chip solid" id="kwOff">${esc(kw.person.name)} ${IC.x.replace("<svg", '<svg width="14" height="14"')}</button></div><div style="display:grid;place-items:center;padding:30px"><div class="spinner"></div></div>`;
    $("#kwOff").onclick = () => { U.search.kw = null; drawSearch(); };
    try {
      if (!kw.credits) kw.credits = splitCredits(await tmdb.get(`/person/${kw.person.id}/combined_credits`));
      if (seq !== U.search.seq) return;
      drawPerson(kw, seq);
    } catch (e) {
      if (seq === U.search.seq) box.innerHTML += `<p class="err">${esc(e.message)}</p>`;
    }
  }

  async function drawKwResults(kw, seq) {
    if (kw.person) return kw.credits ? drawPerson(kw, seq) : loadPerson(kw, seq);
    const box = $("#sr");
    box.innerHTML = `
      <div class="chips wrap" style="margin-bottom:6px"><button class="chip solid" id="kwOff">${esc(kw.label)} ${IC.x.replace("<svg", '<svg width="14" height="14"')}</button></div>
      <div class="section-h"><div><h2>Resultados para "${esc(kw.label)}"</h2><div class="muted small" id="kwN"></div></div></div>
      <button class="btn primary block" id="kwDeck">${IC.sparkle} Ver em cartões</button>
      <div class="list" id="kwList"><div style="display:grid;place-items:center;padding:30px"><div class="spinner"></div></div></div>`;
    $("#kwOff").onclick = () => { U.search.kw = null; drawSearch(); };
    $("#kwDeck").onclick = () => {
      U.mode = kw.genres
        ? { label: `Tema: ${kw.label}`, genres: kw.genres, all: true, kw: kw.id ? { id: kw.id, name: kw.name } : null, maxRuntime: 0, page: 0 }
        : { label: `Tema: ${kw.label}`, genres: [], kw, maxRuntime: 0, page: 0 };
      U.deck = []; U.deckError = null; go("home");
    };
    try {
      const [m, t] = await Promise.all([
        tmdb.discover("movie", kw.genres ? { genres: kw.genres, allGenres: true, minVotes: 100 } : { keywords: [kw.id], minVotes: 5 }),
        tmdb.discover("tv", kw.genres ? { genres: kw.genres, allGenres: true, keywords: kw.id ? [kw.id] : [], minVotes: 20 } : { keywords: [kw.id], minVotes: 0 })
      ]);
      if (seq !== U.search.seq) return;
      const items = m.results.concat(t.results).filter(i => i.poster).sort((a, b) => b.pop - a.pop);
      const total = m.total + t.total;
      $("#kwN").textContent = `${total} título${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"} (${m.total} filme${m.total === 1 ? "" : "s"}, ${t.total} série${t.total === 1 ? "" : "s"})`;
      $("#kwList").innerHTML = items.length ? items.map(rowHTML).join("") : `<p class="muted">Nenhum título marcado com esse tema.</p>`;
      bindRows($("#kwList"), items, () => drawKwResults(kw, U.search.seq), rateSimilar);
    } catch (e) {
      $("#kwList").innerHTML = `<p class="err">${esc(e.message)}</p>`;
    }
  }

  function rowHTML(it) {
    const rec = S.items[it.k];
    return `<button class="row-item" data-k="${it.k}">
      <img src="${tmdb.img(it.poster, "w185")}" alt="" loading="lazy">
      <div class="body">
        <h3>${esc(it.title)}</h3>
        <div class="meta"><span>${TYPE_N[it.type]}</span>${it.year ? `<span>· ${esc(it.year)}</span>` : ""}${it.vote ? ratingPill(it.vote) : ""}</div>
        ${rec ? `<div class="status">${statusText(rec)}</div>` : it.overview ? `<p>${esc(it.overview)}</p>` : ""}
      </div>
      <span class="chev">${IC.chev}</span>
    </button>`;
  }
  function bindRows(root, items, refresh, onRated) {
    root.onclick = e => {
      const r = e.target.closest(".row-item"); if (!r) return;
      const it = items.find(i => i.k === r.dataset.k);
      openDetail(it, { refresh, onRated });
    };
  }

  /* ---------- atalho: criar/editar ---------- */
  function openShortcut(sc) {
    const editing = !!sc;
    const d = sc ? JSON.parse(JSON.stringify(sc)) : { id: "s" + Date.now(), name: "", emoji: "🍿", type: "movie", genres: [], kw: null, maxRuntime: 0 };
    const EMO = ["🍿", "🌧️", "🍃", "🔥", "😂", "💘", "👻", "🚀", "🎄", "🧠", "😭", "🛋️"];
    const ov = openOverlay(`<div class="sheet" id="scS"></div>`);
    const sheet = $("#scS", ov);
    const draw = () => {
      sheet.innerHTML = `<div class="grab"></div>
        <h2>${editing ? "Editar atalho" : "Novo atalho"}</h2>
        <label class="lbl">Nome</label>
        <div class="field"><input id="scN" maxlength="28" placeholder="Ex.: Sexta à noite" value="${esc(d.name)}"></div>
        <label class="lbl">Ícone</label>
        <div class="chips wrap" id="scE">${EMO.map(e => `<button class="chip ${d.emoji === e ? "on" : ""}" data-e="${e}" style="font-size:18px">${e}</button>`).join("")}</div>
        <label class="lbl">Tipo</label>
        <div class="seg" id="scT">
          <button data-t="movie" class="${d.type === "movie" ? "on" : ""}">Filmes</button>
          <button data-t="tv" class="${d.type === "tv" ? "on" : ""}">Séries</button>
          <button data-t="both" class="${d.type === "both" ? "on" : ""}">Ambos</button>
        </div>
        <label class="lbl">Gêneros (qualquer um deles)</label>
        <div class="chips wrap" id="scG">${UD.GENRES.map(g => `<button class="chip ${d.genres.includes(g.k) ? "on" : ""}" data-g="${g.k}">${g.e} ${g.n}</button>`).join("")}</div>
        <label class="lbl">Tema (opcional)</label>
        ${d.kw ? `<div class="chips wrap"><button class="chip solid" id="scKx">${esc(d.kw.label || d.kw.name)} ${IC.x.replace("<svg", '<svg width="14" height="14"')}</button></div>`
               : `<div class="field"><input id="scK" placeholder="Ex.: natal, viagem no tempo" autocomplete="off"></div><div class="chips wrap" id="scKs" style="margin-top:8px"></div>`}
        <label class="lbl">Duração máxima</label>
        <select class="sel" id="scR">${[[0, "Qualquer"], [90, "Até 1h30"], [110, "Até 1h50"], [120, "Até 2h"], [150, "Até 2h30"]].map(([v, t]) => `<option value="${v}" ${d.maxRuntime === v ? "selected" : ""}>${t}</option>`).join("")}</select>
        <div class="err" id="scErr"></div>
        <div class="detail-actions">
          ${editing ? `<button class="btn danger" id="scDel">${IC.trash} Excluir</button>` : `<button class="btn" id="scCancel">Cancelar</button>`}
          <button class="btn primary" id="scOk">Salvar</button>
        </div>`;
      $("#scN", sheet).oninput = e => (d.name = e.target.value);
      $("#scE", sheet).onclick = e => { const b = e.target.closest("[data-e]"); if (b) { d.emoji = b.dataset.e; $$("#scE .chip", sheet).forEach(c => c.classList.toggle("on", c === b)); } };
      $("#scT", sheet).onclick = e => { const b = e.target.closest("[data-t]"); if (b) { d.type = b.dataset.t; $$("#scT button", sheet).forEach(c => c.classList.toggle("on", c === b)); } };
      $("#scG", sheet).onclick = e => {
        const b = e.target.closest("[data-g]"); if (!b) return;
        const k = b.dataset.g;
        d.genres = d.genres.includes(k) ? d.genres.filter(x => x !== k) : d.genres.concat(k);
        b.classList.toggle("on");
      };
      $("#scR", sheet).onchange = e => (d.maxRuntime = +e.target.value);
      if ($("#scKx", sheet)) $("#scKx", sheet).onclick = () => { d.kw = null; draw(); };
      if ($("#scK", sheet)) {
        let t;
        $("#scK", sheet).oninput = e => {
          const q = e.target.value;
          const box = $("#scKs", sheet);
          box.innerHTML = dictMatches(q).map(x => `<button class="chip" data-pt="${esc(x)}">${esc(x)}</button>`).join("");
          clearTimeout(t);
          if (q.trim().length >= 3) t = setTimeout(async () => {
            try {
              const r = await tmdb.get("/search/keyword", { query: UD.DICT[q.toLowerCase().trim()] || q, language: "en-US" });
              if ($("#scK", sheet) && $("#scK", sheet).value === q)
                box.insertAdjacentHTML("beforeend", (r.results || []).slice(0, 4).map(k => `<button class="chip" data-kwid="${k.id}" data-kwname="${esc(k.name)}">${esc(k.name)} <small>tema</small></button>`).join(""));
            } catch (e2) { /* sem internet */ }
          }, 350);
        };
        $("#scKs", sheet).onclick = async e => {
          const b = e.target.closest(".chip"); if (!b) return;
          if (b.dataset.kwid) {
            const q = $("#scK", sheet).value.trim().toLowerCase();
            d.kw = { id: +b.dataset.kwid, name: b.dataset.kwname, label: q || b.dataset.kwname };
            if (q && !UD.DICT[q] && !S.learned[q]) { S.learned[q] = { id: d.kw.id, name: d.kw.name }; store.save(); }
          } else {
            try { const kw = await resolveTheme(b.dataset.pt); if (kw) d.kw = Object.assign({ label: b.dataset.pt }, kw); }
            catch (err) { $("#scErr", sheet).textContent = err.message; return; }
          }
          d.name = $("#scN", sheet).value;
          draw();
        };
      }
      $("#scOk", sheet).onclick = () => {
        d.name = $("#scN", sheet).value.trim();
        if (!d.name) { $("#scErr", sheet).textContent = "Dê um nome ao atalho."; return; }
        if (!d.genres.length && !d.kw) { $("#scErr", sheet).textContent = "Escolha pelo menos um gênero ou um tema."; return; }
        const i = S.shortcuts.findIndex(s => s.id === d.id);
        if (i >= 0) S.shortcuts[i] = d; else S.shortcuts.push(d);
        store.save(); closeOverlay(); if (U.tab === "search") drawSearch();
      };
      if ($("#scCancel", sheet)) $("#scCancel", sheet).onclick = closeOverlay;
      if ($("#scDel", sheet)) $("#scDel", sheet).onclick = () => {
        S.shortcuts = S.shortcuts.filter(s => s.id !== d.id); store.save(); closeOverlay(); if (U.tab === "search") drawSearch();
      };
    };
    draw();
  }

  /* =========================================================
     LISTAS
     ========================================================= */
  function renderLists() {
    U.listType = U.listType || S.type || "movie";
    if (U.listType === "movie" && U.listTab === "watching") U.listTab = "want";
    const base = Object.values(S.items).filter(i => i.type === U.listType);
    const groups = {
      want: { n: "Quero ver", f: i => i.status === "want", ic: IC.heart },
      watching: { n: "Assistindo", f: i => i.status === "watching", ic: IC.play },
      watched: { n: "Assistidos", f: i => i.status === "liked" || i.status === "disliked" || i.status === "dropped", ic: IC.check },
      dropped: { n: "Desisti", f: i => i.status === "dropped", ic: IC.pause },
      nope: { n: "Não gostei", f: i => i.status === "dislike" || i.status === "disliked", ic: IC.thumbDown }
    };
    Object.values(groups).forEach(v => (v.c = base.filter(v.f).length));
    const g = groups[U.listTab];
    const items = base.filter(g.f).sort((a, b) => (b.last || b.at) - (a.last || a.at));
    screen.innerHTML = `
      <div class="topbar">${WM}</div>
      <h1>Minhas listas</h1>
      <div class="seg" id="ltype" style="margin:10px 0 4px">${[["movie", "Filmes"], ["tv", "Séries"]].map(([k, n]) => `<button data-t="${k}" class="${k === U.listType ? "on" : ""}">${n}</button>`).join("")}</div>
      <div class="tabs" id="lt" style="margin-top:12px">${Object.entries(groups).filter(([k]) => k !== "watching" || U.listType === "tv").map(([k, v]) => `<button class="chip ${k === U.listTab ? "solid" : ""}" data-l="${k}">${v.ic.replace("<svg", '<svg width="16" height="16"')} ${v.n} (${v.c})</button>`).join("")}</div>
      <div class="list" id="ll">${items.length ? items.map(it => U.listTab === "watching" ? nextRow(it) : U.listTab === "want" ? `<div class="row-wrap">${rowHTML(it)}<button class="quick" data-seen="${it.k}" aria-label="Já assisti">${IC.check}<span>Assisti</span></button></div>` : rowHTML(it)).join("") : `<p class="muted" style="margin-top:24px">Nada aqui ainda. ${U.listTab === "want" ? "Arraste cartões para a direita no Início." : U.listTab === "watching" ? "Abra uma série e marque os episódios que já viu." : "Marque o que já assistiu no Início ou na Busca."}</p>`}</div>`;
    $("#ltype").onclick = e => { const b = e.target.closest("[data-t]"); if (b) { U.listType = b.dataset.t; renderLists(); } };
    $("#lt").onclick = e => { const b = e.target.closest("[data-l]"); if (b) { U.listTab = b.dataset.l; renderLists(); } };
    bindRows($("#ll"), items, renderLists);
    $("#ll").addEventListener("click", async e => {
      const nx = e.target.closest("[data-nx]"); if (nx) return markNext(nx.dataset.nx, renderLists);
      const q = e.target.closest("[data-seen]"); if (!q) return;
      const it = items.find(i => i.k === q.dataset.seen); if (!it) return;
      const r = await askWatched(it.title, it); if (!r) return;
      const prev = store.setStatus(it, r.status, r.reason);
      if (!r.partial) store.markToday();
      toast(`Marcado: ${STATUS_TXT[r.status]}`, "Desfazer", () => { store.restore(it.k, prev); renderLists(); });
      renderLists();
      if (r.partial) openLater(it, renderLists);
    });
  }

  /* =========================================================
     PERFIL
     ========================================================= */
  function renderProfile() {
    const c = store.counts();
    const gb = engine.genreBars();
    const last = S.lastBackup ? new Date(S.lastBackup).toLocaleDateString("pt-BR") : "nunca";
    screen.innerHTML = `
      <div class="topbar">${WM}</div>
      <h1 style="margin-bottom:14px">Meu perfil</h1>
      <div class="stats">
        <div class="stat"><b>${c.total}</b><span>Avaliados</span></div>
        <div class="stat"><b>${c.want}</b><span>Quero ver</span></div>
        <div class="stat"><b>${c.watched}</b><span>Assistidos</span></div>
      </div>
      <div class="section-h"><h2>Seus gêneros favoritos</h2></div>
      ${gb.pos.length ? `<div class="bars">${gb.pos.map(b => `<div class="bar"><span>${UD.GENRE_BY_KEY[b.k].e} ${UD.GENRE_BY_KEY[b.k].n}</span><div class="track"><div class="fill" style="width:${b.pct}%"></div></div><span class="pct">${b.pct}%</span></div>`).join("")}</div>
        <p class="note" style="text-align:left">100% é o gênero que você mais curte. Os outros são comparados a ele.</p>` : `<p class="muted">Avalie alguns títulos para ver seu gosto aqui.</p>`}
      ${gb.neg.length ? `<div class="section-h"><h3>Você costuma evitar</h3></div><div class="chips wrap">${gb.neg.map(k => `<span class="chip">${UD.GENRE_BY_KEY[k].e} ${UD.GENRE_BY_KEY[k].n}</span>`).join("")}</div>` : ""}

      ${droppedHTML()}
      <div class="section-h"><h2>Backup</h2></div>
      <p class="muted small" style="margin:0">Seu perfil fica só neste celular. Se limpar os dados do navegador, ele some. Guarde um backup de vez em quando.</p>
      <div class="backup-row">
        <button class="btn" id="exp">${IC.down} Exportar</button>
        <button class="btn" id="imp">${IC.upload} Importar</button>
      </div>
      <p class="note">Último backup: ${last}</p>
      <input type="file" id="impF" accept="application/json,.json" class="hidden">

      <div class="section-h"><h2>Configurações</h2></div>
      <div class="list">
        <button class="row-item" id="cVar" style="padding:14px 0"><span style="color:var(--amber)">${IC.sun}</span><div class="body"><h3>Variar a sugestão do dia</h3><div class="meta">${S.dailyVary ? "Ligado: seg a qui curto e no seu estilo, sex a dom mais ousado" : "Desligado: sempre a melhor para o seu gosto"}</div></div><span class="chev">${IC.chev}</span></button>
        <button class="row-item" id="cKey" style="padding:14px 0"><span style="color:var(--amber)">${IC.key}</span><div class="body"><h3>Trocar chave do TMDB</h3></div><span class="chev">${IC.chev}</span></button>
        <button class="row-item" id="cOb" style="padding:14px 0"><span style="color:var(--amber)">${IC.refresh}</span><div class="body"><h3>Avaliar mais títulos populares</h3><div class="meta">Volta para a tela da primeira vez</div></div><span class="chev">${IC.chev}</span></button>
        <button class="row-item" id="cDel" style="padding:14px 0"><span style="color:var(--red)">${IC.trash}</span><div class="body"><h3 style="color:var(--red)">Apagar todas as avaliações</h3></div><span class="chev">${IC.chev}</span></button>
      </div>
      <div class="tmdb-credit">
        <span>Dados e imagens do TMDB. Este app usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</span>
      </div>
      <p class="note">Uni Duni TV · versão ${UD.VERSION}</p>`;

    $("#exp").onclick = exportBackup;
    $("#imp").onclick = () => $("#impF").click();
    $("#impF").onchange = importBackup;
    $("#cVar").onclick = () => { S.dailyVary = !S.dailyVary; store.save(true); toast(S.dailyVary ? "Sugestão varia por dia da semana" : "Sugestão sem variação por dia"); renderProfile(); };
    $("#cKey").onclick = renderWelcome;
    $("#cOb").onclick = () => { U.ob.items = []; renderOnboarding(); };
    $("#cDel").onclick = async () => {
      if (await confirmBox("Apagar tudo?", "Todas as avaliações, listas e atalhos serão apagados deste celular. Faça um backup antes, se quiser guardar.", "Apagar", true)) {
        store.reset(); U.deck = []; U.mode = null; U.ob.items = []; renderOnboarding();
      }
    };
  }

  function droppedHTML() {
    const d = Object.values(S.items).filter(i => i.status === "dropped");
    if (!d.length) return "";
    const by = {};
    d.forEach(i => { const k = REASON_TXT[i.reason] ? i.reason : "_"; by[k] = (by[k] || 0) + 1; });
    const rows = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span class="chip">${k === "_" ? "Sem motivo" : REASON_TXT[k]} <small>${n}</small></span>`).join("");
    return `<div class="section-h"><h2>Por que você desiste</h2></div>
      <p class="muted small" style="margin:0 0 10px">${d.length} título${d.length > 1 ? "s" : ""} que você começou e largou.</p>
      <div class="chips wrap">${rows}</div>`;
  }

  function exportBackup() {
    const data = store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `uni-duni-tv-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    S.lastBackup = Date.now(); S.sinceBackup = 0; store.save(true);
    toast("Backup salvo na pasta Downloads.");
    if (U.tab === "profile") setTimeout(renderProfile, 50);
  }

  function importBackup(e) {
    const file = e.target.files && e.target.files[0]; e.target.value = "";
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const obj = JSON.parse(r.result);
        const n = Object.keys(obj.items || {}).length;
        if (!(await confirmBox("Importar backup?", `O arquivo tem ${n} avaliações. Ele vai substituir tudo o que está no app agora.`, "Importar"))) return;
        store.importData(obj); U.deck = []; U.mode = null;
        toast(`Backup importado: ${n} avaliações.`);
        renderProfile();
      } catch (err) { toast(err.message.includes("JSON") ? "Arquivo inválido." : err.message); }
    };
    r.readAsText(file);
  }

  /* =========================================================
     INÍCIO DO APP
     ========================================================= */
  UD.VERSION = "1.6.1";
  function start() {
    const sv = $("#spVer"); if (sv) sv.textContent = "versão " + UD.VERSION;
    if (!S.apiKey) renderWelcome();
    else if (!S.onboarded) renderOnboarding();
    else go("home");
    setTimeout(() => {
      const sp = $("#splash"); if (sp) { sp.classList.add("out"); setTimeout(() => sp.remove(), 500); }
    }, 1600);
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }
  UD.app = { go, openDetail, U };
  start();
})();
