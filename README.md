# ゲーム棚 (game-shelf)

ブラウザで遊べる自作ゲーム集。`index.html` がホーム画面で、各ゲームは `games/<名前>/index.html` に入っています。

| フォルダ | ゲーム |
|---|---|
| `games/trigger-tactics` | 陣取りトリガー戦 |
| `games/dice-dungeon` | ダイス・ダンジョン |
| `games/kadotori` | カドトリ |
| `games/mofuru-gym` | 開拓の島 モフルジム |
| `games/hakobune` | 方舟の寄生体 |
| `games/ponpon-rhythm` | ぽんぽんリズム |
| `games/himitsu-no-hana` | ひみつの花の謎 |

## ゲームを追加するには

1. `games/<新しい名前>/index.html` を置く
2. ルートの `index.html` 内の `GAMES` 配列に1行追加する

## 公開

Settings → Pages → Branch を `main` / `(root)` にすると `https://tm550120.github.io/game-shelf/` で公開されます。
