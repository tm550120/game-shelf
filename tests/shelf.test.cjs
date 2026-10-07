const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { games, allTag } = require('../assets/catalog.js');
const root = path.resolve(__dirname, '..');

// A deliberately small DOM contract harness. Real rendering/navigation is
// separately covered by browser.cjs; these tests require only Node.js.
class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {};
    this.dataset = {}; this.events = {}; this.hidden = false; this.value = '';
    this.textContent = ''; this.classes = new Set();
    this.classList = { add: n => this.classes.add(n), remove: n => this.classes.delete(n), contains: n => this.classes.has(n) };
  }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(k, v) { this.attributes[k] = v; }
  addEventListener(name, handler) { this.events[name] = handler; }
  querySelector(tag) { return this.children.find(c => c.tagName === tag.toUpperCase()) || this.children.map(c => c.querySelector(tag)).find(Boolean); }
  focus() { this.focused = true; }
  scrollIntoView(options) { this.scrolled = options; }
}
function setup(query = '', { denyHistory = false } = {}) {
  const ids = ['shelf', 'filters', 'search', 'result-count', 'surprise', 'empty-state', 'reset', 'total-count', 'featured-play', 'discovery'];
  const nodes = Object.fromEntries(ids.map(id => [id, new Element(id === 'search' ? 'input' : 'div')]));
  const docEvents = {}, windowEvents = {};
  const location = { href: 'https://tm550120.github.io/game-shelf/' + query };
  const document = { getElementById: id => nodes[id], createElement: tag => new Element(tag), addEventListener: (name, fn) => docEvents[name] = fn };
  const window = { GameShelfCatalog: { games, allTag }, location, history: { replaceState: (_, __, url) => { if (denyHistory) throw new Error('restricted'); location.href = String(url); } }, addEventListener: (name, fn) => windowEvents[name] = fn, matchMedia: () => ({ matches: true }) };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/shelf.js'), 'utf8'), { document, window, URL });
  const filter = tag => nodes.filters.children.find(n => n.textContent === tag).events.click();
  const search = value => { nodes.search.value = value; nodes.search.events.input(); };
  const visible = () => nodes.shelf.children.filter(n => !n.hidden);
  return { nodes, window, windowEvents, docEvents, filter, search, visible };
}

test('catalog has seven unique games and valid local entry points and covers', () => {
  assert.equal(games.length, 7); assert.equal(new Set(games.map(g => g.id)).size, games.length);
  for (const g of games) {
    assert.ok(g.title && g.description && g.tags.length && g.players);
    assert.ok(fs.existsSync(path.join(root, g.cover)));
    if (!g.external) { assert.match(g.href, /^games\/[a-z-]+\/$/); assert.ok(fs.existsSync(path.join(root, g.href, 'index.html'))); }
    else assert.equal(new URL(g.href).protocol, 'https:');
  }
  assert.ok(Object.isFrozen(games)); assert.ok(games.every(Object.isFrozen));
});
test('Mofuru uses the user-confirmed canonical URL, never the copied game', () => {
  const g = games.find(g => g.id === 'mofuru-gym');
  assert.equal(g.href, 'https://tm550120.github.io/mofuru-gym/index.html');
  assert.equal(g.repository, 'https://github.com/tm550120/mofuru-gym');
  assert.ok(g.external);
});
test('initial shelf renders seven semantic links and live result count', () => {
  const t = setup(); assert.equal(t.visible().length, 7);
  assert.ok(t.visible().every(n => n.tagName === 'A' && n.href && n.attributes['aria-labelledby']));
  assert.match(t.nodes['result-count'].textContent, /7作品のうち 7作品/);
  assert.equal(t.nodes.discovery.hidden, false);
  assert.equal(t.nodes['featured-play'].href, games.find(g => g.external).href);
});
test('genre filters show matching games and exactly one pressed button', () => {
  const t = setup(); t.filter('パズル');
  assert.deepEqual(t.visible().map(n => n.dataset.game), ['kadotori', 'himitsu-no-hana']);
  assert.equal(t.nodes.filters.children.filter(n => n.attributes['aria-pressed'] === 'true').length, 1);
  assert.equal(new URL(t.window.location.href).searchParams.get('tag'), 'パズル');
});
test('search normalizes fullwidth characters, whitespace, and case', () => {
  const t = setup(); t.search('  ＤＩＣＥ  ');
  assert.deepEqual(t.visible().map(n => n.dataset.game), ['dice-dungeon']);
});
test('genre and search are combined', () => {
  const t = setup(); t.filter('パズル'); t.search('CPU');
  assert.deepEqual(t.visible().map(n => n.dataset.game), ['kadotori']);
});
test('empty results show recovery, disable random, and reset restores focus', () => {
  const t = setup(); t.search('no such game');
  assert.equal(t.visible().length, 0); assert.equal(t.nodes['empty-state'].hidden, false); assert.equal(t.nodes.surprise.disabled, true);
  t.nodes.surprise.events.click(); // Defensive even if invoked programmatically.
  t.nodes.reset.events.click();
  assert.equal(t.visible().length, 7); assert.equal(t.nodes.search.focused, true); assert.equal(t.nodes['empty-state'].hidden, true);
  assert.equal(new URL(t.window.location.href).search, '');
});
test('URL state restores filters and caps untrusted input', () => {
  const t = setup('?tag=' + encodeURIComponent('パズル') + '&q=カド');
  assert.deepEqual(t.visible().map(n => n.dataset.game), ['kadotori']);
  const bad = setup('?tag=unknown&q=' + 'a'.repeat(400));
  assert.equal(bad.nodes.search.value.length, 100);
  assert.equal(bad.nodes.filters.children[0].attributes['aria-pressed'], 'true');
});
test('Back/Forward and bfcache restore URL state', () => {
  const t = setup(); t.window.location.href += '?tag=' + encodeURIComponent('リズム');
  t.windowEvents.popstate(); assert.deepEqual(t.visible().map(n => n.dataset.game), ['ponpon-rhythm']);
  t.window.location.href = 'https://tm550120.github.io/game-shelf/'; t.windowEvents.pageshow(); assert.equal(t.visible().length, 7);
});
test('random choice only selects a visible card and keeps one highlight', () => {
  const t = setup(); t.filter('パズル');
  for (let i = 0; i < 10; i++) t.nodes.surprise.events.click();
  const picked = t.nodes.shelf.children.filter(n => n.classList.contains('picked'));
  assert.equal(picked.length, 1); assert.equal(picked[0].hidden, false); assert.ok(picked[0].focused);
  assert.equal(picked[0].scrolled.behavior, 'instant');
});
test('search has a visible-focus wrapper and accessible label, with no character shortcut', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<label[^>]*for="search">ゲームを検索<\/label>/);
  const css = fs.readFileSync(path.join(root, 'assets/shelf.css'), 'utf8');
  assert.match(css, /\.search-field:focus-within/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'assets/shelf.js'), 'utf8'), /addEventListener\("keydown"/);
});
test('blocked history writes do not break filtering', () => {
  const t = setup('', { denyHistory: true }); t.filter('謎解き'); assert.equal(t.visible().length, 1);
});
test('query text cannot inject HTML', () => {
  const t = setup(); t.search('<img src=x onerror=alert(1)>'); assert.equal(t.visible().length, 0);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'assets/shelf.js'), 'utf8'), /innerHTML/);
});
test('legacy redirect preserves room query and hash, uses replace, ignores redirect targets', () => {
  let replaced; const anchor = {};
  const window = { GameShelfCatalog: { games }, location: { search: '?room=test-room&redirect=https://evil.invalid', hash: '#title', replace: url => replaced = url } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/redirect.js'), 'utf8'), { window, URL, document: { getElementById: () => anchor } });
  assert.equal(new URL(replaced).origin, 'https://tm550120.github.io');
  assert.equal(new URL(replaced).pathname, '/mofuru-gym/index.html');
  assert.equal(new URL(replaced).searchParams.get('room'), 'test-room'); assert.equal(new URL(replaced).hash, '#title');
  assert.equal(anchor.href, replaced);
});
test('no-JS fallback includes all games and exact canonical link', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const fallback = html.match(/<noscript>([\s\S]*?)<\/noscript>/)[1];
  for (const game of games) assert.ok(fallback.includes(`href="${game.href}"`));
  const legacy = fs.readFileSync(path.join(root, 'games/mofuru-gym/index.html'), 'utf8');
  assert.ok(legacy.includes(`href="${games.find(g => g.external).href}"`));
  assert.match(legacy, /href="\.\.\/\.\.\/"/);
});
