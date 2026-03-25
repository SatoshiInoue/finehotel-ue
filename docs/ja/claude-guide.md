# プロジェクト作業ガイド（日本語）— finehotel-ue

> 英語版（Claude 用）: [CLAUDE.md](../../CLAUDE.md)

## プロジェクト概要

**finehotel-ue** は Adobe Experience Manager Edge Delivery Services (AEM EDS) + Universal Editor (XWalk) で構築されたウェブサイトです。

- **コンテンツ配信:** AEM EDS（CDN エッジ）
- **コンテンツ編集:** AEM Universal Editor（ビジュアル編集）
- **コンテンツソース:** AEM Author (`author-p161901-e1740392.adobeaemcloud.com`)

---

## ディレクトリ構造

```
blocks/    # ブロックコンポーネント（各: {name}.js, {name}.css, _{name}.json）
models/    # UE コンポーネント定義ソース（_*.json）— ここを編集する
scripts/   # コアスクリプト（aem.js, scripts.js, utils.js）
styles/    # グローバルスタイル・CSS 変数（styles.css, fonts.css）
docs/      # 開発者ドキュメント（英語: docs/*.md / 日本語: docs/ja/*.md）
.claude/skills/eds/  # Claude の EDS 開発スキル
```

---

## よく使うコマンド

```bash
# JSON ファイルを生成（blocks/ と models/ の _*.json を結合）
npm run build:json

# 個別生成
npm run build:json:definitions   # component-definition.json
npm run build:json:models        # component-models.json
npm run build:json:filters       # component-filters.json

# Lint チェック
npm run lint:js   # JavaScript/JSON
npm run lint:css  # CSS
npm run lint      # 両方
```

> **重要:** `_*.json` を編集したら必ず `npm run build:json` を実行すること。

---

## 重要なルール

| ルール | 理由 |
|-------|------|
| ルートの `component-*.json` は直接編集しない | ビルドで上書きされる生成ファイル |
| ブロック JSON は `blocks/{name}/_{name}.json` を編集 | ソースファイルが正 |
| 新規ブロックは `models/_component-filters.json` の `section` フィルターに追加 | これがないと UE に表示されない |
| DOM を組み替えるときは `moveInstrumentation()` を必ず呼ぶ | `data-aue-*` 属性（UE が使用）を保持するため |
| テーマの CSS は `body.{theme-name}` でスコープする | aem.js が body にクラスを付与するため |

---

## ブロック追加の手順

1. `blocks/{name}/` ディレクトリを作成
2. `{name}.js` — `export default function decorate(block)` を実装
3. `{name}.css` — スタイルを実装
4. `_{name}.json` — definitions / models / filters を記述
5. `models/_component-filters.json` の `section` フィルターに `"{name}"` を追加
6. `npm run build:json` を実行

---

## ドキュメント一覧

| ファイル | 内容 |
|---------|------|
| [project-overview.md](./project-overview.md) | アーキテクチャ・ディレクトリ構造・ビルドシステム |
| [block-development.md](./block-development.md) | ブロック開発ガイド・デコレーターパターン |
| [component-models.md](./component-models.md) | JSON 定義・モデル・フィルターの編集方法 |
| [theming.md](./theming.md) | CSS 変数・テーマシステム・レスポンシブ |

---

## CLAUDE.md について

`CLAUDE.md`（英語）は Claude Code が自動読み込みする作業指針です。このファイル（`docs/ja/claude-guide.md`）は**人間向けの日本語版**です。内容を更新するときは両方を合わせて更新してください。

---

## EDS スキル

`/eds` コマンドでブロック開発・モデル編集・テーマ変更のガイドが受けられます。
スキルソース: `.claude/skills/eds/SKILL.md`
