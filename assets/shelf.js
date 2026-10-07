(function () {
  "use strict";
  const { games, allTag } = window.GameShelfCatalog;
  const shelf = document.getElementById("shelf");
  const filters = document.getElementById("filters");
  const search = document.getElementById("search");
  const count = document.getElementById("result-count");
  const surprise = document.getElementById("surprise");
  const tags = [allTag, ...new Set(games.flatMap(game => game.tags))];
  let activeTag = allTag;
  const cards = new Map();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  games.forEach((game, index) => {
    const link = element("a", `game tone-${game.tone}`);
    link.href = game.href;
    link.dataset.game = game.id;
    link.setAttribute("aria-labelledby", `title-${game.id} action-${game.id}`);
    const cover = element("div", "cover");
    cover.setAttribute("aria-hidden", "true");
    const number = element("span", "game-number", String(index + 1).padStart(2, "0"));
    const art = element("img", "cover-art");
    art.src = game.cover; art.alt = ""; art.width = 480; art.height = 260;
    art.loading = "lazy"; art.decoding = "async";
    cover.append(number, art);
    if (game.external || game.note) cover.append(element("span", "cover-note", game.external ? "公開版と連携 ↗" : game.note));
    const body = element("div", "game-body");
    const subtitle = element("span", "game-subtitle", game.subtitle); subtitle.lang = "en";
    const title = element("h3", "game-title", game.title); title.id = `title-${game.id}`;
    const description = element("p", "game-description", game.description);
    const labels = element("div", "tags");
    game.tags.forEach(tag => labels.append(element("span", "tag", tag)));
    const bottom = element("div", "game-bottom");
    const players = element("span", "players", `◯ ${game.players}`);
    const action = element("span", "play", game.external ? "公開版であそぶ ↗" : "あそぶ →"); action.id = `action-${game.id}`;
    bottom.append(players, action);
    body.append(subtitle, title, description, labels, bottom);
    link.append(cover, body); shelf.append(link); cards.set(game.id, link);
  });

  tags.forEach(tag => {
    const button = element("button", "filter", tag); button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => { activeTag = tag; update(true); });
    filters.append(button);
  });

  function normalize(value) { return value.normalize("NFKC").toLocaleLowerCase("ja").trim(); }
  function update(save) {
    const query = normalize(search.value);
    let visible = 0;
    games.forEach(game => {
      const matches = (activeTag === allTag || game.tags.includes(activeTag)) &&
        normalize([game.title, game.subtitle, game.description, game.players, ...game.tags].join(" ")).includes(query);
      const card = cards.get(game.id); card.hidden = !matches; card.classList.remove("picked");
      if (matches) visible++;
    });
    [...filters.children].forEach(button => button.setAttribute("aria-pressed", String(button.textContent === activeTag)));
    count.textContent = `${games.length}作品のうち ${visible}作品を表示${activeTag === allTag ? "" : ` · ${activeTag}`}`;
    document.getElementById("empty-state").hidden = visible > 0;
    surprise.disabled = visible === 0;
    if (save) {
      const url = new URL(window.location.href);
      search.value.trim() ? url.searchParams.set("q", search.value.trim()) : url.searchParams.delete("q");
      activeTag !== allTag ? url.searchParams.set("tag", activeTag) : url.searchParams.delete("tag");
      // file:// previews can restrict history writes; the catalog still works.
      try { window.history.replaceState(null, "", url); } catch (_) { /* optional enhancement */ }
    }
  }

  function restore() {
    const params = new URL(window.location.href).searchParams;
    search.value = (params.get("q") || "").slice(0, 100);
    activeTag = tags.includes(params.get("tag")) ? params.get("tag") : allTag;
    update(false);
  }
  search.addEventListener("input", () => update(true));
  document.getElementById("reset").addEventListener("click", () => { search.value = ""; activeTag = allTag; update(true); search.focus(); });
  surprise.addEventListener("click", () => {
    const visible = [...cards.values()].filter(card => !card.hidden);
    if (!visible.length) return;
    cards.forEach(card => card.classList.remove("picked"));
    const card = visible[Math.floor(Math.random() * visible.length)];
    card.classList.add("picked"); card.focus({ preventScroll: true });
    card.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    count.textContent = `今日のおすすめは「${card.querySelector("h3").textContent}」。選んで遊んでみましょう。`;
  });
  window.addEventListener("popstate", restore);
  window.addEventListener("pageshow", restore);
  document.getElementById("total-count").textContent = games.length;
  document.getElementById("featured-play").href = games.find(game => game.id === "mofuru-gym").href;
  document.getElementById("discovery").hidden = false;
  surprise.hidden = false;
  restore();
})();
