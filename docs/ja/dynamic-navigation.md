# ダイナミックナビゲーション — 使い方ガイド

ダイナミックナビゲーションは、`nav.html` にリンクを手動で書かずに、AEM のページ階層からナビゲーションメニューを自動生成する機能です。新しいページを作成すると、ナビゲーションに自動的に追加されます。

---

## 仕組みの概要

環境ごとにデータ取得元が異なります。

| 環境 | データ取得元 | 表示されるページ |
|---|---|---|
| Author（`adobeaemcloud.com`）| AEM JCR（Sling GET `.2.json`）| 下書き・未公開を含む全ページ |
| EDS Preview（`*.aem.page`）| `/{lang}/query-index.json` | 公開済みページのみ |
| EDS Live（`*.aem.live`）| `/{lang}/query-index.json` | 公開済みページのみ |
| ローカル（`localhost:3000`）| `/{lang}/query-index.json` | 公開済みページのみ |

Author 環境では下書きページも表示されるため、実際の公開状態と異なる場合があります。

---

## 有効化方法

`nav.html` のテキストブロック内の `<ul>` リスト（ナビゲーション項目）を **空にする**だけで、ダイナミックモードが有効になります。

- リストが空 → ダイナミックナビゲーション（ページ階層から自動生成）
- リストに項目あり → 静的ナビゲーション（後方互換）

`nav.html` を空にして EDS に公開した後は、常にダイナミックモードになります。

---

## ナビゲーション項目の制御

各ページの **ページプロパティ**（Universal Editor のプロパティパネル）で以下のフィールドを設定できます。

| フィールド | 種別 | 説明 |
|---|---|---|
| **Nav Order** | 数値 | ナビゲーション内での表示順（昇順）。未設定のページはアルファベット順で末尾に並ぶ。 |
| **Hide in Nav** | トグル | `true` にするとナビゲーションから除外される。 |

### 並び順のルール

1. `navOrder` が設定されているページを昇順に並べる（例: 1 → 2 → 3）
2. `navOrder` が未設定のページはアルファベット順で末尾に追加

例えば「About Us」に `navOrder = 1`、「News」に `navOrder = 2` を設定し、「Campaigns」は未設定にすると、順番は `About Us → News → Campaigns` になります。

---

## ページプロパティの設定手順

1. Universal Editor でページを開く
2. 右パネル上部の「ページ」をクリック（ページプロパティを開く）
3. **Nav Order**（数値）と **Hide in Nav**（トグル）を設定
4. 変更を保存し、ページを EDS に公開する

> **重要:** `navOrder` や `hideInNav` を設定してもページを**再公開しない限り**、EDS の `query-index.json` には反映されません。設定後は必ずページを公開してください。

---

## `helix-query.yaml` のインデックス設定

EDS のクエリインデックスに `navOrder` と `hideInNav` を含めるには、`helix-query.yaml` の各言語インデックスに以下のプロパティが必要です。

```yaml
navOrder:
  select: head > meta[name="navorder"]
  value: attribute(el, "content")
hideInNav:
  select: head > meta[name="hideinnav"]
  value: attribute(el, "content")
```

> **注意:** AEM XWalk はページプロパティのフィールド名を**すべて小文字**のメタタグとして HTML に出力します（例: `navOrder` → `<meta name="navorder">`）。ハイフン区切り（`nav-order`）や camelCase（`navOrder`）のセレクターは一致しないため注意してください。

このプロパティが `&base-site` アンカーに定義されていれば、全言語インデックス（`site-en`、`site-ja` 等）に自動的に継承されます。

---

## 新しい言語を追加する場合

新しい言語（例: `/de`）のページもダイナミックナビゲーションを使用する場合、`helix-query.yaml` に対応する言語インデックスエントリを追加してください。

```yaml
site-de:
  <<: *base-site
  include:
    - '/de'
    - '/de/**'
  exclude:
    - /de/nav
    - /de/footer
    - /de/search
  target: /de/query-index.json
```

`<<: *base-site` で `navOrder`・`hideInNav` を含む全プロパティが継承されます。

---

## 注意事項・制限

- **直接の子ページのみ**がナビゲーションに表示されます。孫ページ以下はサポート外です。
- **言語ルートページ（`/en.html`）**での表示も正しく動作します。Author 環境でのパス解決は `.html` を自動的に除去して処理します。
- **新規公開ページ**は EDS がインデックスを更新するまでナビゲーションに反映されません（リアルタイムではありません）。
- **`navOrder` / `hideInNav` の変更**は再公開後に EDS へ反映されます。Author 環境ではリアルタイムで反映されます。
- **サブナビゲーション**（ドロップダウン）は現在スコープ外です。
- **ディレクトリ順**（AEM Sites コンソールでのドラッグ順）は EDS の `query-index.json` に含まれないため、EDS 環境では利用できません。`navOrder` による明示的な順序付けを推奨します。

---

## Author ワークフロー

1. AEM Sites コンソールまたは Universal Editor でページを `/content/.../en/` 配下に作成する
2. 必要に応じてページプロパティで `navOrder`（表示順）と `hideInNav`（非表示）を設定する
3. ページを EDS に公開する → `query-index.json` が更新される → ナビゲーションに反映される
4. Author 環境では、下書き（未公開）ページも含めてリアルタイムでナビゲーションに表示される
