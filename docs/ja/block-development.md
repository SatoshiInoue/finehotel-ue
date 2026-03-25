# ブロック開発ガイド

## ブロックの基本構造

各ブロックは `blocks/{block-name}/` ディレクトリに以下のファイルを持つ。

```
blocks/my-block/
├── my-block.js      # デコレーター（AEM EDS がブロック装飾時に呼ぶ）
├── my-block.css     # スタイル
└── _my-block.json   # Universal Editor コンポーネント定義
```

---

## デコレーター関数（JS）

AEM EDS はページ読み込み時に `blocks/{name}/{name}.js` の `default export` 関数を呼び出す。

### 最小構成

```javascript
export default function decorate(block) {
  // block = .my-block 要素（div）
  // ここで DOM を操作してブロックをレンダリングする
}
```

### DOM 構造

AEM EDS がコンテンツから生成する DOM 構造：

```html
<div class="my-block block" data-block-name="my-block">
  <div>              <!-- 行 1 -->
    <div>フィールド1の値</div>
    <div>フィールド2の値</div>
  </div>
  <div>              <!-- 行 2 -->
    <div>...</div>
  </div>
</div>
```

- 外側の `div` が行（モデルの1インスタンス）
- 内側の `div` がフィールド（モデルのフィールド順）

---

## Hero ブロック — レイアウトクラスパターン

`blocks/hero/hero.js` の例。設定値を読み取ってクラスを追加する。

```javascript
export default function decorate(block) {
  // 特定の div からフィールド値を読み取る
  const layoutStyle = block.querySelector(':scope div:nth-child(4) > div')
    ?.textContent?.trim() || 'overlay';

  // クラスとして追加（CSS で制御）
  if (layoutStyle) {
    block.classList.add(layoutStyle);
  }

  // 設定用 div を非表示にしてクリーンな DOM を保つ
  const layoutStyleDiv = block.querySelector(':scope div:nth-child(4)');
  if (layoutStyleDiv) layoutStyleDiv.style.display = 'none';
}
```

CSS では `.hero.fullscreen-vertical { ... }` のようにクラスの組み合わせでスタイルを適用。

---

## Cards ブロック — 子要素変換パターン

`blocks/cards/cards.js` の例。テーブル構造を ul/li リストに変換する。

```javascript
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    // Universal Editor の計装属性を li に移動（重要！）
    moveInstrumentation(row, li);

    // 子要素を li に移動
    while (row.firstElementChild) li.append(row.firstElementChild);

    // 各 div に意味のあるクラスを付与
    [...li.children].forEach((div, index) => {
      if (index === 0) div.className = 'cards-card-image';
      else if (index === 1) div.className = 'cards-card-body';
      else div.style.display = 'none'; // 設定用フィールドを非表示
    });

    ul.append(li);
  });

  // 画像を最適化
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
```

---

## Universal Editor 対応

### `moveInstrumentation` の重要性

Universal Editor は DOM 要素に `data-aue-*` 属性を付与してコンポーネントを識別する。
DOM を組み替えるとき（行→li 変換など）は必ずこの属性を移動させる。

```javascript
import { moveInstrumentation } from '../../scripts/scripts.js';

// row（元の div）から li（新しい要素）へ属性を移動
moveInstrumentation(row, li);
```

移動される属性: `data-aue-*` と `data-richtext-*` で始まるすべての属性。

### Author 環境の判定

```javascript
import { isAuthorEnvironment } from '../../scripts/scripts.js';

export default function decorate(block) {
  if (isAuthorEnvironment()) {
    // エディター専用の処理
  }
}
```

---

## ブロック JSON 定義 (`_block-name.json`)

各ブロックの JSON ファイルには3つのセクションがある。

```json
{
  "definitions": [...],   // UE コンポーネント登録
  "models": [...],        // フィールド定義
  "filters": [...]        // 子コンポーネントのルール
}
```

### 最小構成の例

```json
{
  "definitions": [
    {
      "title": "My Block",
      "id": "my-block",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "My Block",
              "model": "my-block"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "my-block",
      "fields": [
        {
          "component": "text",
          "valueType": "string",
          "name": "title",
          "label": "Title"
        },
        {
          "component": "richtext",
          "name": "text",
          "label": "Body Text",
          "valueType": "string"
        },
        {
          "component": "reference",
          "valueType": "string",
          "name": "image",
          "label": "Image",
          "multi": false
        },
        {
          "component": "select",
          "name": "style",
          "label": "Style",
          "options": [
            { "name": "Default", "value": "default" },
            { "name": "Dark", "value": "dark" }
          ]
        }
      ]
    }
  ],
  "filters": []
}
```

### 子コンポーネントを持つ場合（Cards の例）

```json
{
  "definitions": [
    {
      "title": "Cards",
      "id": "cards",
      "plugins": { "xwalk": { "page": { "resourceType": "...", "template": { "name": "Cards", "model": "cards" } } } }
    },
    {
      "title": "Card",
      "id": "card",
      "plugins": { "xwalk": { "page": { "resourceType": "...", "template": { "name": "Card Item", "model": "card" } } } }
    }
  ],
  "models": [
    { "id": "cards", "fields": [] },
    {
      "id": "card",
      "fields": [
        { "component": "reference", "name": "image", "label": "Image" },
        { "component": "richtext", "name": "text", "label": "Text", "valueType": "string" }
      ]
    }
  ],
  "filters": [
    { "id": "cards", "components": ["card"] }
  ]
}
```

---

## 利用可能なフィールドコンポーネント

| コンポーネント | 用途 | 主なオプション |
|--------------|------|--------------|
| `text` | 1行テキスト | `valueType: "string"` |
| `richtext` | リッチテキスト | `valueType: "string"` |
| `boolean` | チェックボックス | `value: "true"/"false"` |
| `select` | ドロップダウン | `options: [{name, value}]` |
| `reference` | 画像・アセット参照 | `multi: false/true` |
| `aem-content` | AEM コンテンツパス | — |
| `aem-tag` | タグブラウザー | `rootPath` |
| `tab` | タブ区切り（UI 整理用） | — |
| `multiselect` | 複数選択 | `options` |

---

## よく使う aem.js ユーティリティ

```javascript
import {
  createOptimizedPicture,   // 画像最適化（レスポンシブ picture 要素生成）
  decorateButtons,          // a タグを .button クラス付きにする
  decorateIcons,            // :icon-name: を SVG/img に変換
  getMetadata,              // ページメタデータ取得
  loadCSS,                  // CSS 動的ロード
  loadScript,               // JS 動的ロード
  fetchPlaceholders,        // i18n テキスト取得
  readBlockConfig,          // ブロック設定読み取り（key-value テーブル）
  toClassName,              // 文字列をクラス名に変換
} from '../../scripts/aem.js';
```

---

## 新規ブロック追加手順

### Step 1: ディレクトリとファイルを作成

```bash
mkdir blocks/my-block
touch blocks/my-block/my-block.js
touch blocks/my-block/my-block.css
touch blocks/my-block/_my-block.json
```

### Step 2: `_my-block.json` を記述

上記「最小構成の例」を参考に definitions / models / filters を定義。

### Step 3: `models/_component-filters.json` を更新

`section` フィルターに新ブロックを追加：

```json
{
  "id": "section",
  "components": [
    "accordion", "cards", "...",
    "my-block"   ← 追加
  ]
}
```

### Step 4: JSON を生成

```bash
npm run build:json
```

### Step 5: デコレーターと CSS を実装

`my-block.js` と `my-block.css` を実装する。

---

## CSS 命名規則

```css
/* ブロック全体 */
.my-block { }

/* ブロック内要素 */
.my-block .my-block-image { }
.my-block .my-block-body { }

/* バリエーション（クラスの組み合わせ） */
.my-block.dark { }
.my-block.large { }

/* レスポンシブ */
@media (width >= 900px) {
  .my-block { }
}
```

---

## デバッグ Tips

- **DOM 確認:** ブラウザ DevTools で `.block` 要素の構造を確認
- **Author/Live 判定:** URL に `author` が含まれるかで判定（`isAuthorEnvironment()`）
- **ブロック未デコレート:** `block.classList` に `is-decorated` がつく前の状態を確認
- **JSON 反映確認:** `npm run build:json` 後に AEM Author でキャッシュクリアが必要な場合がある
