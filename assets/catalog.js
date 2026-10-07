/* Game metadata lives here. External games point at their own deployed site. */
(function (root) {
  "use strict";
  const games = [
    { id: "trigger-tactics", title: "陣取りトリガー戦", subtitle: "TRIGGER TACTICS", description: "6つの兵種を編成して、中継点を奪い合う。先の一手が勝負を決めるターン制タクティクス。", players: "1人", tags: ["戦略"], href: "games/trigger-tactics/", cover: "assets/covers/trigger-tactics.svg", tone: "blue" },
    { id: "dice-dungeon", title: "ダイス・ダンジョン", subtitle: "DICE DUNGEON", description: "ダイスを展開して道をつくり、モンスターを召喚。相手のマスターを3回攻撃すれば勝ち。", players: "1〜2人", tags: ["戦略", "対戦"], href: "games/dice-dungeon/", cover: "assets/covers/dice-dungeon.svg", tone: "purple" },
    { id: "kadotori", title: "カドトリ", subtitle: "KADOTORI", description: "ピースを角だけでつなげて陣地を広げよう。CPUとじっくり遊べる陣取りパズル。", players: "1人", tags: ["戦略", "パズル"], href: "games/kadotori/", cover: "assets/covers/kadotori.svg", tone: "orange" },
    { id: "mofuru-gym", title: "開拓の島 モフルジム", subtitle: "MOFURU GYM", description: "資源を集めて道とジムを建て、モフルを進化。CPU戦やオンライン対戦で島を開拓しよう。", players: "1人／オンライン2〜3人", tags: ["戦略", "ボードゲーム", "対戦"], href: "https://tm550120.github.io/mofuru-gym/index.html", repository: "https://github.com/tm550120/mofuru-gym", cover: "assets/covers/mofuru-gym.svg", tone: "green", external: true },
    { id: "hakobune", title: "方舟の寄生体", subtitle: "THE ARK", description: "移民船に紛れた寄生体を見つけ出せ。スマホ1台を回して遊ぶ、正体隠匿ゲーム。", players: "みんなで", tags: ["パーティー"], href: "games/hakobune/", cover: "assets/covers/hakobune.svg", tone: "space" },
    { id: "ponpon-rhythm", title: "ぽんぽんリズム", subtitle: "PONPON RHYTHM", description: "カエルのリズムをまねして、タイミングよくタップ。音を出して楽しむリズムゲーム。", players: "1人", tags: ["リズム"], href: "games/ponpon-rhythm/", cover: "assets/covers/ponpon-rhythm.svg", tone: "lime", note: "音あり推奨" },
    { id: "himitsu-no-hana", title: "ひみつの花の謎", subtitle: "THE SECRET FLOWER", description: "3つの謎を解くと、最後の扉がひらく。ひらめきを頼りに進む、小さな謎解きの物語。", players: "1人", tags: ["謎解き", "パズル"], href: "games/himitsu-no-hana/", cover: "assets/covers/himitsu-no-hana.svg", tone: "rose" }
  ];
  games.forEach(game => { Object.freeze(game.tags); Object.freeze(game); });
  const catalog = Object.freeze({ games: Object.freeze(games), allTag: "すべて" });
  if (typeof module !== "undefined" && module.exports) module.exports = catalog;
  else root.GameShelfCatalog = catalog;
})(globalThis);
