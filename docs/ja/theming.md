# テーマ・CSS 変数システム

## 概要

このプロジェクトは CSS カスタムプロパティ（変数）を2層構造で管理している。

```
--brand-*（外部からブランドカラーを注入）
    ↓ フォールバックとして
--主要変数（styles.css で定義）
    ↓ コンポーネントが使用
```

AEM Author の「ページプロパティ」でテーマを切り替えると、`--brand-*` 変数が上書きされる。

---

## CSS 変数一覧

### カラー変数

```css
:root {
  /* ブランドカラー（--brand-* でフォールバック） */
  --background-color:  var(--brand-background-color, #ffffff);
  --dark-color:        var(--brand-dark-color,        #131313);
  --light-color:       var(--brand-light-color,       #dcdcdc);
  --text-color:        var(--brand-text-color,        #131313);
  --text-light:        var(--brand-light-text-color,  #ffffff);
  --link-color:        var(--brand-link-color,        #131313);
  --link-hover-color:  var(--brand-link-hover-color,  #F97316);
  --main-accent-color: var(--brand-theme-color,       #FB923C);

  /* 透明度バリアント */
  --dark-color-opacity:  rgba(0, 0, 0, 0.55);
  --light-color-opacity: rgba(255, 255, 255, 0.5);
}
```

### ヘッダー・フッター変数

```css
:root {
  --nav-background-color:    var(--brand-nav-background-color,    #0000008c);
  --nav-text-color:          var(--brand-nav-text-color,          #ffffff);
  --footer-background-color: var(--brand-footer-background-color, #000);
  --footer-text-color:       var(--brand-footer-text-color,       #ffffff);
  --nav-height: 64px;
}
```

### フォント変数

```css
:root {
  --body-font-family:    'Adobe Clean',            roboto, sans-serif;
  --heading-font-family: 'Adobe Clean Bold',       roboto-condensed, sans-serif;
  --light-font-family:   'Adobe Clean Light',      roboto, sans-serif;
  --extra-font-family:   'Adobe Clean Extra Bold', roboto, sans-serif;
  --black-font-family:   'Adobe Clean Black',      roboto, sans-serif;
}
```

### フォントサイズ変数

```css
:root {
  /* ボディ */
  --body-font-size-m: 22px;
  --body-font-size-s: 19px;
  --body-font-size-xs: 17px;

  /* 見出し */
  --heading-font-size-xxl: 55px;
  --heading-font-size-xl:  44px;
  --heading-font-size-l:   34px;
  --heading-font-size-m:   27px;
  --heading-font-size-s:   24px;
  --heading-font-size-xs:  22px;
}

/* デスクトップ（≥900px）では小さくなる */
@media (width >= 900px) {
  :root {
    --heading-font-size-xxl: 45px;
    --heading-font-size-xl:  36px;
    /* ... */
  }
}
```

### スペーシング変数

```css
:root {
  --spacing-none:    0rem;
  --spacing-xtiny:   0.125rem;
  --spacing-tiny:    0.25rem;
  --spacing-xxsmall: 0.5rem;
  --spacing-xsmall:  0.75rem;
  --spacing-small:   1rem;
  --spacing-regular: 1.5rem;
  --spacing-medium:  2rem;
  --spacing-large:   2.5rem;
  --spacing-xlarge:  3rem;
  --spacing-xxlarge: 4rem;
  --spacing-huge:    5rem;
  --spacing-xhuge:   6rem;

  --global-gutter:          1.5rem;
  --global-section-padding: 5rem;
  --section-gutter-space:   28px;
}
```

### ボーダー・角丸変数

```css
:root {
  --border-radius-none:    0rem;
  --border-radius-small:   0.125rem;
  --border-radius-base:    0.25rem;
  --border-radius-medium:  0.5rem;
  --border-radius-large:   1rem;
  --border-radius-x-large: 2rem;
}
```

---

## テーマ切り替え

### 利用可能なテーマ

| テーマ名 | value | 用途 |
|---------|-------|------|
| Default | `""` | デフォルトのオレンジ系テーマ |
| Mango Haze | `mango-haze` | マンゴー系ウォームカラー |
| Lavender Chill | `lavender-chill` | ラベンダー系クールカラー |
| Meadow Light | `meadow-light` | グリーン系ナチュラルカラー |

### テーマの適用方法

**Universal Editor（推奨）:**
ページプロパティ → `theme` フィールドでテーマを選択するだけ。

**CSS で手動上書き:**

```css
/* ブランドカラーを直接指定する場合 */
:root {
  --brand-theme-color:       #your-accent-color;
  --brand-dark-color:        #your-dark-color;
  --brand-light-color:       #your-light-color;
  --brand-text-color:        #your-text-color;
  --brand-light-text-color:  #your-light-text-color;
  --brand-link-color:        #your-link-color;
  --brand-link-hover-color:  #your-hover-color;
  --brand-nav-background-color: #your-nav-bg;
  --brand-footer-background-color: #your-footer-bg;
}
```

---

## レスポンシブブレークポイント

```css
/*
  Desktop: width >= 1024px
  Tablet:  768px - 1023px
  Mobile:  width <= 767px
*/

/* タブレット以上 */
@media (width >= 768px) { ... }

/* デスクトップ以上 */
@media (width >= 900px) { ... }
@media (width >= 1024px) { ... }

/* タブレット以下 */
@media (width < 1024px) { ... }

/* モバイル */
@media (width < 768px) { ... }
```

---

## セクションのスタイルオプション

`models/_section.json` で定義されたセクション設定。

### スペーシング（上下）

`top-spacing` / `bottom-spacing` フィールドで選択可能な値：

| 値 | 説明 |
|-----|------|
| `no-space` | スペースなし |
| `xtiny` | 極小 |
| `tiny` | 小さい |
| `xxsmall` | |
| `xsmall` | |
| `small` | |
| `regular` | |
| `medium` | |
| `large` | |
| `xlarge` | |
| `xxlarge` | |
| `huge` | |
| `xhuge` | 極大 |

### 背景スタイル（`backgroundstyle` フィールド）

| 値 | 説明 |
|-----|------|
| `default` | 通常背景 |
| `color-primary` | プライマリカラー背景 |
| `color-secondary` | セカンダリカラー背景 |
| `color-tertiary` | テーシャリカラー背景 |
| `image-background` | 画像背景（条件設定が追加で必要） |
| `gradient-light` | ライトグラデーション |
| `gradient-dark` | ダークグラデーション |

---

## ブロック固有のテーマ対応

ブロックに `theme-dark` / `theme-light` クラスを追加することで背景テーマを適用できる（Hero ブロックの例）：

```css
/* hero.css */
.hero.theme-dark {
  background: var(--dark-color);
}
.hero.theme-dark h1, .hero.theme-dark p {
  color: var(--light-color);
}

.hero.theme-light {
  background: var(--light-color);
}
.hero.theme-light h1, .hero.theme-light p {
  color: var(--dark-color);
}
```

---

## 新しいテーマカラーパレットを追加する方法

1. `styles/styles.css` に新テーマのクラスを追加：

```css
/* styles.css */
.theme-ocean-blue {
  --brand-theme-color:      #0077B6;
  --brand-dark-color:       #03045E;
  --brand-light-color:      #CAF0F8;
  --brand-link-hover-color: #00B4D8;
}
```

2. `models/_component-models.json` の `page-metadata` モデルの `theme` セレクトに追加：

```json
{
  "component": "select",
  "name": "theme",
  "label": "Theme",
  "options": [
    { "name": "default",       "value": "" },
    { "name": "Mango Haze",    "value": "mango-haze" },
    { "name": "Lavender Chill","value": "lavender-chill" },
    { "name": "Meadow Light",  "value": "meadow-light" },
    { "name": "Ocean Blue",    "value": "ocean-blue" }   ← 追加
  ]
}
```

3. `npm run build:json` を実行。

---

## アイコン

`icons/` ディレクトリに SVG を配置し、Markdown や HTML で `:icon-name:` 記法で参照できる。
`scripts/aem.js` の `decorateIcons()` が `img` 要素に変換する。

```html
<!-- 使用例 -->
<span class="icon icon-arrow-right"></span>
```

```
icons/
├── arrow-right.svg
├── facebook.svg
└── ...
```
