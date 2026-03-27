# List ブロック — 使い方ガイド

List ブロックは、指定したパス配下の子ページを自動取得して一覧表示するブロックです。Universal Editor でフィールドを設定するだけで、ページ一覧をさまざまなレイアウトで表示できます。

---

## Universal Editor での設定

ページに `List` ブロックを配置し、右パネルで以下のフィールドを設定します。

| フィールド | 種別 | 説明 |
|---|---|---|
| **Root Path** | テキスト | 一覧表示する親パス（例: `/en/news`）。このパスの直下の子ページが取得されます。 |
| **Sort By** | 選択 | 並び順。`Alphabetical`（タイトル昇順）、`Last Modified`（更新日降順）、`List Order`（数値順）。 |
| **Show Description** | トグル | ページの説明文を表示するかどうか。 |
| **Show Image** | トグル | ページのサムネイル画像（`og:image`）を表示するかどうか。 |
| **Show Date** | トグル | 最終更新日を表示するかどうか。 |
| **Max Items** | 数値 | 表示件数の上限。`0` は制限なし。 |
| **Enable Pagination** | トグル | ページネーション（前へ / 次へ）を有効にするかどうか。 |
| **Items Per Page** | 数値 | 1ページあたりの表示件数（デフォルト: `5`）。ページネーション有効時のみ使用。 |
| **Persist Page in URL** | トグル | 現在のページ番号を `?page=N` としてURLに記録する。リンク共有やブラウザの戻るボタンが正しく動作するようになる。ページネーション有効時のみ意味を持つ。 |
| **List Style** | 選択 | 表示レイアウト。`Card`、`Small`、`Medium` から選択。 |

---

## List Style（レイアウト）の種類

### Card（デフォルト）

レスポンシブなグリッドレイアウト。画像が上部に 16:9 で表示され、タイトル・説明・日付がその下に並びます。

- モバイル: 1列
- タブレット（600px 以上）: 2列
- デスクトップ（900px 以上）: 3列

### Small

コンパクトな縦並びリスト。各行の左端に小さなサムネイル（3rem 正方形）が表示されます。記事数が多い場合や省スペースで一覧を見せたい場合に適しています。

### Medium

横長のカード型リスト。左側に大きめの画像（10〜12rem）、右側にタイトル・説明・日付が表示されます。行ごとにボーダーと hover 時のシャドウが付きます。

---

## Sort By（並び順）の詳細

### Alphabetical

タイトルのアルファベット昇順（日本語はロケール順）。

### Last Modified

更新日の降順（新しいページが上に来る）。ニュースやお知らせ一覧に適しています。

### List Order

各ページの `listOrder` メタデータ（数値）の昇順。値が設定されていないページはリストの末尾にアルファベット順で並びます。

`listOrder` を設定するには、各記事ページのページプロパティ（Universal Editor > ページプロパティ）で **List Order** フィールドに数値を入力します。

---

## 表示環境による動作の違い

List ブロックはアクセス環境に応じてデータ取得先を自動的に切り替えます。

| 環境 | データ取得元 | 表示されるページ |
|---|---|---|
| Author（`adobeaemcloud.com`）| AEM JCR（Sling GET `.2.json`）| 下書き・未公開ページも含むすべてのページ |
| EDS（`*.aem.page` / `*.aem.live`）| `{rootPath}/query-index.json`（ffetch） | 公開済みページのみ |
| ローカル（`localhost:3000`）| EDS と同じ | 公開済みページのみ |

Author 環境では下書きページも表示されるため、実際の公開状態とは異なる場合があります。

---

## ページネーション

**Enable Pagination** をオンにすると、一覧が複数ページに分割され「← Previous」「Next →」ボタンが表示されます。

- **Max Items** と **Items Per Page** を組み合わせて使用できます。例: Max Items=20、Items Per Page=5 とすると最大4ページ表示されます。
- すべてのアイテムが1ページに収まる場合（Items Per Page 以下）はページネーションボタンは表示されません。
- **Persist Page in URL** をオンにすると、現在のページ番号が `?page=N`（1始まり）としてURLに追加されます。ページ1のURLにはパラメータが付きません。

> **注意:** Persist Page in URL は同一ページに List ブロックが1つだけの場合にのみ使用してください。複数の List ブロックがある場合、どちらも同じ `?page=N` パラメータを参照するため誤動作する可能性があります。

---

## 新しいリストパスを追加するときの手順（`helix-query.yaml` の更新）

EDS 環境では、List ブロックはまず `{rootPath}/query-index.json` というスコープ付きインデックスを取得しようとします。このファイルは EDS が自動生成するのではなく、**`helix-query.yaml` に明示的にエントリを追加する**ことで初めて生成されます。

### 追加が必要なケース

新しいパスを Root Path に設定する場合（例: `/en/events` を新たにリスト表示したい場合）は、`helix-query.yaml` に対応するエントリを追加してください。

### `helix-query.yaml` への追加例

```yaml
events-en:
  include:
    - '/en/events/**'
  target: /en/events/query-index.json
  properties:
    <<: *base-site
```

- `include`: 対象とするページのパスパターン
- `target`: 生成されるインデックスファイルのパス（Root Path + `/query-index.json`）
- `properties`: `*base-site` アンカーを継承することで `title`、`description`、`image`、`lastModified`、`listOrder` などの共通プロパティが含まれます

言語ごとに別エントリが必要です。例えば `/ja/events` を追加する場合は `events-ja` として同様に追加してください。

### エントリを追加しない場合の動作

`{rootPath}/query-index.json` が存在しない場合、List ブロックは自動的に `/{lang}/query-index.json`（言語全体のインデックス）にフォールバックし、パスプレフィックスでフィルタリングします。この場合も一覧は表示されますが、**言語全体のインデックスをダウンロードするためデータ量が増加**します。本番環境では各セクションにスコープ付きインデックスを用意することを推奨します。

---

## 注意事項・制限

- **直接の子ページのみ** 取得されます。孫ページ以下は対象外です。
- **scoped query index**: EDS 環境では `{rootPath}/query-index.json` を参照します。このファイルが存在しない場合は `/{lang}/query-index.json` 全体をパスでフィルタしてフォールバックします（データ量が多くなる場合があります）。
- **JS レンダリング**: リストは JavaScript で描画されます。JavaScript を実行しないクローラー（AI 概要生成クローラー等）にはリスト内のリンクが見えません。SEO 上の重要なリンクは記事ページ本文内や静的なナビゲーションで確保してください。
- **新規公開ページ**: EDS でインデックスが更新されるまで一覧に反映されません（リアルタイムではありません）。
- **Root Path を言語ルートページに設定する場合**: `/en.html` のような言語ルートページに List ブロックを配置しても正しく動作します（URL の `.html` を自動的に除去して処理します）。

---

## 設定例

### ニュース一覧（画像・日付あり、新しい順、ページネーション付き）

| フィールド | 値 |
|---|---|
| Root Path | `/en/news` |
| Sort By | `Last Modified` |
| Show Image | オン |
| Show Date | オン |
| Enable Pagination | オン |
| Items Per Page | `10` |
| List Style | `Card` |

### リンクリスト（コンパクト表示）

| フィールド | 値 |
|---|---|
| Root Path | `/en/services` |
| Sort By | `Alphabetical` |
| List Style | `Small` |

### 注目記事（件数制限あり）

| フィールド | 値 |
|---|---|
| Root Path | `/en/news` |
| Sort By | `List Order` |
| Show Description | オン |
| Show Image | オン |
| Max Items | `4` |
| List Style | `Medium` |
