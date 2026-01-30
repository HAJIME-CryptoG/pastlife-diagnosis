# pastlife-diagnosis

前世診断（AI生成）＋オーラ画像生成のサンプルです。フロントは GitHub Pages で静的配信し、Cloudflare Workers が OpenAI API と保存処理を担当します。

## ディレクトリ構成

- `web/` : 静的フロント（GitHub Pages）
- `worker/` : Cloudflare Workers（OpenAI API 呼び出し＋KV保存）
- `shared/` : JSON Schema・プロンプト

## GitHub Pages 公開手順

1. リポジトリの `web/` を Pages の公開ディレクトリとして指定する、または `web/` の内容をルートにビルド/コピーします。
2. `web/app.js` の `WORKER_URL` をデプロイした Workers のURLに変更します。
3. GitHub の Settings → Pages で `main` ブランチ / `web` ディレクトリを選択して保存します。

## Cloudflare Workers デプロイ手順

1. `wrangler.toml` を作成し、以下のように設定します。

```toml
name = "pastlife-diagnosis"
main = "worker/index.js"
compatibility_date = "2024-10-01"

kv_namespaces = [
  { binding = "PASTLIFE_KV", id = "<KV_NAMESPACE_ID>" }
]
```

2. 環境変数を設定します。

```bash
wrangler secret put OPENAI_API_KEY
```

3. デプロイします。

```bash
wrangler deploy
```

## 環境変数

| 変数名 | 用途 |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI APIキー（Workers側のみ） |

## KV 設定

- `PASTLIFE_KV` を Workers にバインドします。
- 保存内容: `result_json`、`aura_image`（base64）、`created_at`
- 生年月日などの個人情報は保存しません。

## ローカル確認方法

1. `wrangler dev` を使って Workers をローカル起動します。

```bash
wrangler dev --local
```

2. `web/` を静的サーバーで開きます（例: `python -m http.server`）。
3. `web/app.js` の `WORKER_URL` を `http://127.0.0.1:8787` に変更します。

## データ編集方法

- 生成スキーマを変更する場合は `shared/schema.json` を修正し、Workers の `schema` インポートが正しいか確認します。
- プロンプト調整は `shared/prompt.md` を編集し、`worker/index.js` の `BASE_PROMPT` と方針を合わせます。
- 質問内容は `web/app.js` の `QUESTIONS` を編集します。

## API

### `POST /generate`

- リクエスト: `birth_date`, `birth_time`, `birth_place`, `answers` を含むJSON
- レスポンス: `result_id`, `result_json`, `aura_image`

### `GET /result?id=...`

- 保存済みの結果を返します。
