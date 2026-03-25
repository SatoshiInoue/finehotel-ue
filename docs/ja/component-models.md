# コンポーネントモデル・定義ガイド

## 3つの JSON ファイルの役割

| ファイル | 役割 |
|---------|------|
| `component-definition.json` | Universal Editor にどのコンポーネントを表示するかを登録 |
| `component-models.json` | 各コンポーネントのフィールド定義（エディターのプロパティパネル） |
| `component-filters.json` | コンポーネントの合成ルール（どの親に何を追加できるか） |

> **注意:** ルートの `component-*.json` は生成ファイル。直接編集せず、`models/` や `blocks/` の `_*.json` を編集して `npm run build:json` で生成する。

---

## ファイル構造とビルドの仕組み

### ソースファイルの場所

```
models/
├── _component-definition.json   # グループ定義 + 共通コンポーネント参照
├── _component-models.json       # 共通モデル（page-metadata, image, title など）
├── _component-filters.json      # セクション・主要フィルター
├── _section.json                # セクションの定義・モデル・フィルター
├── _page.json                   # ページメタデータ定義
├── _image.json
├── _text.json
├── _title.json
└── _button.json

blocks/
└── {block-name}/
    └── _{block-name}.json       # ブロック固有の定義・モデル・フィルター
```

### `_component-definition.json` の構造

```json
{
  "groups": [
    {
      "title": "Default Content",
      "id": "default",
      "components": [
        { "...": "./_text.json#/definitions" },
        { "...": "./_image.json#/definitions" }
      ]
    },
    {
      "title": "Sections",
      "id": "sections",
      "components": [
        { "...": "./_section.json#/definitions" }
      ]
    },
    {
      "title": "Blocks",
      "id": "blocks",
      "components": [
        { "...": "../blocks/*/_*.json#/definitions" }   ← blocks/ を glob で取り込む
      ]
    }
  ]
}
```

---

## component-definition.json（コンポーネント登録）

Universal Editor のコンポーネント挿入パネルに表示されるコンポーネントを定義する。

### 1コンポーネントの構造

```json
{
  "title": "Hero",          // エディターに表示される名前
  "id": "hero",             // 一意の識別子（ブロック名と一致させる）
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Hero",   // AEM コンテンツ作成時のノード名
          "model": "hero"   // 使用するモデル ID
        }
      }
    }
  }
}
```

### コンポーネントグループ

現在のプロジェクトのグループ構成：

| グループ | ID | 内容 |
|---------|-----|------|
| Default Content | `default` | Button, Image, Text, Title |
| Sections | `sections` | Section |
| Blocks | `blocks` | 全ブロック（Hero, Cards, etc.） |
| Custom Form Components | `custom-form` | フォームフィールド |
| Healthcare | `healthcare` | Find a Doctor |
| BFSI | `bfsi` | Forex |

---

## component-models.json（フィールド定義）

プロパティパネルに表示されるフィールドを定義する。

### モデルの構造

```json
{
  "id": "my-block",    // component-definition の model と一致させる
  "fields": [
    {
      "component": "text",
      "valueType": "string",
      "name": "title",        // HTML/JCR のプロパティ名
      "label": "Title",       // エディターに表示されるラベル
      "required": false,
      "value": ""             // デフォルト値
    }
  ]
}
```

### フィールドコンポーネント一覧

#### テキスト系

```json
// 1行テキスト
{ "component": "text", "valueType": "string", "name": "title", "label": "Title" }

// 複数行テキスト
{ "component": "richtext", "name": "text", "label": "Body", "valueType": "string" }
```

#### 選択系

```json
// ドロップダウン
{
  "component": "select",
  "name": "layout",
  "label": "Layout",
  "options": [
    { "name": "Default", "value": "default" },
    { "name": "Dark",    "value": "dark" }
  ]
}

// チェックボックス
{
  "component": "boolean",
  "name": "showTitle",
  "label": "Show Title",
  "value": "true",
  "valueType": "boolean"
}

// 複数選択
{
  "component": "multiselect",
  "name": "categories",
  "label": "Categories",
  "options": [...]
}
```

#### アセット・参照系

```json
// 画像・アセット参照
{
  "component": "reference",
  "valueType": "string",
  "name": "image",
  "label": "Image",
  "multi": false
}

// AEM コンテンツパス
{
  "component": "aem-content",
  "name": "fragmentPath",
  "label": "Content Fragment"
}

// タグブラウザー
{
  "component": "aem-tag",
  "name": "cq:tags",
  "label": "Tags",
  "valueType": "string",
  "rootPath": "/content/cq:tags/my-project"
}
```

#### UI 整理

```json
// タブ区切り（フィールドをタブで整理）
{ "component": "tab", "label": "Settings", "name": "tab-settings" }
```

---

## component-filters.json（合成ルール）

親コンポーネントに追加できる子コンポーネントを制限する。

### フィルターの構造

```json
{
  "id": "cards",                  // 親コンポーネントの ID
  "components": ["card"]          // 追加できる子の ID 一覧
}
```

### 現在の主要フィルター

```json
[
  { "id": "main",      "components": ["section"] },
  { "id": "section",   "components": ["accordion", "cards", "carousel", "columns", "hero", "...（全ブロック）"] },
  { "id": "accordion", "components": ["accordion-item"] },
  { "id": "cards",     "components": ["card"] },
  { "id": "columns",   "components": ["column"] },
  { "id": "tabs",      "components": ["tabs-item"] }
]
```

### 新ブロック追加時のフィルター更新

新しいブロックをページに追加可能にするには `models/_component-filters.json` の `section` フィルターを更新する：

```json
{
  "id": "section",
  "components": [
    "accordion", "cards", "carousel", "columns", "hero",
    "my-new-block"   ← ここに追加
  ]
}
```

---

## ブロック JSON の完全構造（`_{block}.json`）

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
        { "component": "text",      "name": "title",  "label": "Title",  "valueType": "string" },
        { "component": "richtext",  "name": "text",   "label": "Text",   "valueType": "string" },
        { "component": "reference", "name": "image",  "label": "Image",  "multi": false },
        {
          "component": "select",
          "name": "style",
          "label": "Style",
          "options": [
            { "name": "Default", "value": "" },
            { "name": "Dark",    "value": "dark" }
          ]
        }
      ]
    }
  ],
  "filters": []
}
```

---

## page-metadata モデル（ページ設定）

`models/_component-models.json` に定義されている特別なモデル。
ページプロパティを UE で編集するために使用。

| フィールド | 型 | 用途 |
|-----------|-----|------|
| `jcr:title` | text | ページタイトル（必須） |
| `jcr:pagetitle` | text | ページタイトル表示名 |
| `jcr:description` | text | メタディスクリプション |
| `cq:tags` | aem-tag | タグ付け |
| `theme` | select | テーマ選択（default/mango-haze/lavender-chill/meadow-light） |
| `pageName` | text | ページ識別名 |
| `pageCategory` | text | ページカテゴリ |

---

## JSON 生成コマンド

```bash
# 全 JSON を生成（通常はこれだけ）
npm run build:json

# 個別生成
npm run build:json:definitions   # component-definition.json のみ
npm run build:json:models        # component-models.json のみ
npm run build:json:filters       # component-filters.json のみ
```

生成後は AEM Author でページを再読み込みすると変更が反映される（キャッシュに注意）。
