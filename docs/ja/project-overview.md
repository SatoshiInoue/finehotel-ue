# プロジェクト概要 — finehotel-ue

## アーキテクチャ

```
AEM Author (Cloud Service)
    │  コンテンツ編集（Universal Editor）
    │
    ▼
AEM EDS (Edge Delivery Services)
    │  Franklin Delivery API でコンテンツを HTML として配信
    │  fstab.yaml でマウントポイントを設定
    │
    ▼
CDN エッジ
    │  静的 JS/CSS/HTML をキャッシュ・高速配信
    │
    ▼
ブラウザ
    │  aem.js + scripts.js でブロックをデコレート
    ▼
```

### コンテンツフロー

1. **編集:** AEM Author で Universal Editor を使ってページを編集
2. **プレビュー:** `*.aem.page` ドメインで確認
3. **本番公開:** `*.aem.live` ドメインで配信

---

## ディレクトリ詳細

### `blocks/`

各ブロックは独立したディレクトリを持つ。

```
blocks/
├── hero/
│   ├── hero.js          # デコレーター（必須）
│   ├── hero.css         # スタイル（必須）
│   └── _hero.json       # UE コンポーネント定義（必須）
├── cards/
│   ├── cards.js
│   ├── cards.css
│   └── _cards.json
└── ...（26 ブロック）
```

**全ブロック一覧:**

| ブロック名 | 用途 |
|-----------|------|
| accordion | 折りたたみセクション |
| action-button | アクションボタン |
| cards | カードグリッド |
| carousel | カルーセル |
| columns | 複数カラムレイアウト |
| content-fragment | AEM コンテンツフラグメント |
| dynamic-media-image | Dynamic Media 画像 |
| dynamic-media-video | Dynamic Media 動画 |
| dynamicmedia-image | DM 画像（別バリアント） |
| dynamicmedia-template | DM テンプレート |
| embed-adaptive-form | AEM フォーム埋め込み |
| find-a-doctor | 医師検索（医療向け） |
| footer | サイトフッター |
| forex | 為替レート（金融向け） |
| form | アダプティブフォーム |
| fragment | コンテンツフラグメント参照 |
| header | サイトヘッダー・ナビ |
| hero | ヒーローセクション |
| iframe | 埋め込み iframe |
| quote | 引用・証言 |
| search | 検索機能 |
| separator | 区切り線 |
| tabs | タブナビゲーション |
| teaser | ティーザー・CTA |
| video | 動画プレイヤー |

---

### `models/`

Universal Editor 用コンポーネント定義のソースファイル（`_*.json`）。
ビルド時に `component-*.json`（ルートの生成ファイル）へ結合される。

```
models/
├── _component-definition.json  # コンポーネントグループ定義
├── _component-models.json      # 共通モデル（page-metadata, image, title など）
├── _component-filters.json     # セクション・合成ルール
├── _image.json
├── _text.json
├── _title.json
├── _button.json
├── _section.json
└── _page.json
```

> **注意:** `blocks/` 配下の `_*.json` も自動的に結合される（glob: `blocks/*/_*.json#/...`）

---

### `scripts/`

| ファイル | 役割 |
|---------|------|
| `aem.js` | AEM EDS コアライブラリ（ブロックデコレート、DOM ヘルパー） |
| `scripts.js` | アプリエントリーポイント（ページ初期化、テーマ適用） |
| `utils.js` | ユーティリティ（言語判定、日付フォーマット） |
| `ffetch.js` | コンテンツフェッチ抽象化 |
| `dom-helpers.js` | DOM ユーティリティ |
| `editor-support.js` | Universal Editor サポート |
| `delayed.js` | 遅延ロードハンドラー |
| `slider.js` | スライダー・カルーセルロジック |

---

### `styles/`

| ファイル | 役割 |
|---------|------|
| `styles.css` | グローバルスタイル・CSS 変数（25KB） |
| `fonts.css` | フォント宣言・インポート |
| `slider.css` | カルーセル専用スタイル |
| `lazy-styles.css` | 遅延ロードスタイル |

---

## 設定ファイル

### `fstab.yaml`

AEM Author からのコンテンツマウントポイント。

```yaml
mountpoints:
  /:
    url: "https://author-p161901-e1740392.adobeaemcloud.com/bin/franklin.delivery/SatoshiInoue/finehotel-ue/main"
    type: "markup"
    suffix: ".html"
```

### `paths.json`

多言語 URL マッピング。

```json
{
  "/": "/content/finehotel-ue/us/en",
  "/en/": "/content/finehotel-ue/us/en",
  "/fr/": "/content/finehotel-ue/us/fr",
  "/es/": "/content/finehotel-ue/us/es",
  "/de/": "/content/finehotel-ue/us/de",
  "/ja/": "/content/finehotel-ue/us/ja"
}
```

### `helix-query.yaml`

クエリインデックス設定。各言語のページメタデータを JSON として提供する。
`/query-index.json` でカード一覧やサイトマップ生成に使用。

---

## ページ階層とコンポーネント構造

```
Page（page-metadata モデル）
└── Section（section モデル: 背景・スペーシング制御）
    ├── Hero
    ├── Cards
    │   └── Card（1対多）
    ├── Columns
    │   └── Column（1対多）
    │       ├── Button
    │       ├── Image
    │       └── Text
    ├── Accordion
    │   └── Accordion Item（1対多）
    ├── Tabs
    │   └── Tab Item（1対多）
    └── ... （その他 20+ ブロック）
```

---

## ビルドシステム

`package.json` の `build:json` スクリプトが `merge-json-cli` を使って
`models/_*.json` と `blocks/**/_*.json` をルートの `component-*.json` に結合する。

```
models/_component-definition.json  ─┐
blocks/hero/_hero.json             ─┤─▶ component-definition.json
blocks/cards/_cards.json           ─┘

models/_component-models.json      ─┐
blocks/hero/_hero.json (models)    ─┤─▶ component-models.json
blocks/cards/_cards.json (models)  ─┘

models/_component-filters.json     ─┐
blocks/cards/_cards.json (filters) ─┘─▶ component-filters.json
```

---

## 多言語対応

サポート言語: EN / FR / ES / DE / JA

- `scripts/utils.js` の `getLanguage()` / `PATH_PREFIX` で言語判定
- `scripts/placeholders.js` で i18n テキスト管理
- 各言語に `query-index.json` が存在
