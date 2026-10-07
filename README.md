# ゲーム棚 (game-shelf)

ブラウザですぐ遊べる自作ゲームのカタログです。
公開先: https://tm550120.github.io/game-shelf/

HTML / CSS / JavaScript だけで動きます。アプリ本体に npm 依存やビルドはありません。ゲームをコピーせず、別リポジトリの公開版へ案内することもできます。

## できること

- タイトル・説明・ジャンル・プレイ人数のキーワード検索
- ジャンルによる絞り込み、表示件数、見つからないときのリセット
- 表示中の作品から「おまかせ」で1作品を選ぶ（自動でゲームは開始しません）
- URL に検索条件を保存し、戻る・進む・再読み込みで復元
- スマートフォン表示、キーボード操作、ダークモード、動きを減らす設定への対応
- 画像やフォントの外部配信に依存しない軽量な SVG カバー

## 構成

| 場所 | 役割 |
| --- | --- |
| `index.html` | 棚のレイアウトと JavaScript 無効時のリンク一覧 |
| `assets/catalog.js` | 作品名・説明・タグ・リンク・カバーの一覧 |
| `assets/shelf.js` | カード表示、検索、フィルター、履歴復元 |
| `assets/shelf.css` | レスポンシブな見た目とアクセシビリティ |
| `assets/covers/` | 各作品をイメージした装飾用 SVG（実際のゲーム画面ではありません） |
| `games/<名前>/index.html` | このリポジトリで管理するゲーム本体 |
| `games/mofuru-gym/index.html` | 旧 URL 用の案内・転送ページ |
| `assets/redirect.js` | モフルジム公開版への履歴を置き換える転送 |

既存の6作品（陣取りトリガー戦、ダイス・ダンジョン、カドトリ、方舟の寄生体、ぽんぽんリズム、ひみつの花の謎）のゲーム本体は変更していません。

## モフルジムの連携方式

- 管理元: https://github.com/tm550120/mofuru-gym
- 開くページ: https://tm550120.github.io/mofuru-gym/index.html
- 棚のカードとピックアップは `assets/catalog.js` の `href` を使い、公開版を同じタブで直接開きます
- **ソースのコピー、submodule、iframe、GitHub API の実行時呼び出しは行いません**
- モフルジム側で更新・Pages 公開が成功すれば、棚から開く本編にもその更新が反映されます。棚の再公開や同期処理は不要です
- ソース変更だけでは公開版は変わりません。モフルジム側の公開処理とブラウザキャッシュの影響を受けます
- 棚の説明やカバーは自動取得ではありません。内容変更時はカタログを更新してください
- モフルジムのサービス状態やオンライン対戦サーバーの稼働は、棚では保証・監視しません

以前の `games/mofuru-gym/` のブックマークも残ります。JavaScript が有効なら `location.replace` で公開版へ移動します。`?room=...` などのクエリとハッシュを引き継ぎ、ブラウザの「戻る」で転送ページに戻るループを防ぎます。転送先はカタログの固定 URL であり、ユーザー入力の URL に転送しません。JavaScript が無効・読込失敗の場合も、公開版と棚に戻るリンクを表示します。

モフルジム本編の「ホーム」は本編のタイトル画面です。プレイ中にブラウザで戻ると、先にタイトルへ戻る場合があります。以前のコピー版で開いていたプレイ途中の状態を、新しい本編へ引き継ぐ機能はありません。

## ゲームを追加する

1. この棚で管理する場合は `games/<新しい名前>/index.html` を置きます。別管理の場合は、先に公開 URL を確認します
2. `assets/catalog.js` の `games` 配列に追加します。`id` は重複しない英数字とハイフン、`href` はローカルの相対 URL または公開先の HTTPS URL を指定します
3. `assets/covers/` に SVG カバーを追加し、`cover` に相対パスを指定します
4. `index.html` の `noscript` 一覧と初期表示の作品数も更新します
5. `npm run check` を実行します。作品数を増やしたときはテストの期待値も更新してください

外部ゲームの例:

```js
{ id: "my-game", title: "新しいゲーム", subtitle: "MY GAME",
  description: "どんな遊びかを短く紹介。", players: "1人", tags: ["パズル"],
  href: "https://example.com/my-game/", repository: "https://github.com/owner/my-game",
  cover: "assets/covers/my-game.svg", tone: "green", external: true }
```

## ローカル確認

ルートで静的サーバーを立ち上げます。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

http://127.0.0.1:8000/ を開きます。棚は `index.html` を直接開いても表示できますが、履歴・遷移を含む確認には HTTP サーバーを使ってください。

## テスト

Node.js 22 以上を使用します。基本検査に依存パッケージのインストールは不要です。

```sh
npm run check
```

構文検査と Node.js 標準テストで、カタログの整合性、リンク先、検索・フィルター・復元・キーボード・転送などを検査します。DOM 契約テストは実ブラウザの描画検証の代わりにはなりません。

実ブラウザ検査は Playwright を別途用意します。

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
npm run test:browser
```

`CHROMIUM_PATH` を設定するとインストール済み Chromium を使用できます。ブラウザ検査は loopback のテストサーバーを起動するため、ソケットが許可された環境が必要です。320 / 375 / 390 / 768 / 1024 / 1440 px 幅、検索とフィルター、戻る、空状態、ダークモード、動きを減らす設定、旧 URL、JavaScript 無効時の導線を確認し、`test-results/` に画像を保存します。外部モフルジムへの遷移は固定のテスト応答に差し替え、実際の対戦には接続しません。公開後は本番 URL も別途確認してください。

`.github/workflows/check.yml` は PR・main 更新・手動実行時に基本検査とブラウザ検査を行い、画像を Actions の成果物として保存します。この workflow はデプロイやリポジトリへの書き込みを行いません。

## 公開

既存の GitHub Pages 設定（Settings → Pages → Branch: `main` / `(root)`）を継続して使用できます。公開設定変更、Actions による自動デプロイの追加は不要です。

変更をブランチと draft PR で確認してから、承認後に main に反映します。公開後はゲーム棚とモフルジムのリンク、古いブックマーク、スマートフォンの実表示を確認してください。
