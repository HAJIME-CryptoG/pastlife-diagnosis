# Cloudflare Workers (pastlife-worker)

このディレクトリは Cloudflare Workers + KV を使ったバックエンドです。`wrangler deploy` でそのまま動かせる構成にしています。

## できること

- `POST /api/generate` で前世診断テキストを生成
- `GET /api/result?id=xxx` で保存済み結果を取得
- 結果は KV に **7日間** 保存（TTL = 604800）

## 必要な準備

### 1. Wrangler を用意

```bash
npm install
```

### 2. KV を作成

Cloudflare ダッシュボードまたは CLI で KV を作り、ID を `wrangler.toml` に設定します。

```bash
wrangler kv:namespace create RESULTS
```

出力される `id` を `wrangler.toml` の `kv_namespaces` に貼り付けてください。

### 3. OpenAI API キーを登録

Workers の secret として保存します。

```bash
wrangler secret put OPENAI_API_KEY
```

## 起動方法

```bash
npm run dev
```

## デプロイ

```bash
npm run deploy
```

## API 仕様

### POST /api/generate

**入力（JSON）**

```json
{
  "birthdate": "1994-03-12",
  "answers": [0, 2, 1, 3, 0, 2, 1, 0]
}
```

**出力（JSON）**

```json
{
  "result_id": "uuid",
  "result": {
    "summary": "...",
    "daily_life": ["...", "...", "..."],
    "key_event": "...",
    "carryover_traits": ["...", "...", "..."],
    "advice": ["...", "...", "..."]
  }
}
```

### GET /api/result?id=xxx

**出力（JSON）**

```json
{
  "result_id": "uuid",
  "result": { "...": "..." },
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**補足**
- `OPENAI_API_KEY` はコードに直書きせず、Workers の secret を使います。
- CORS は `Access-Control-Allow-Origin: *` で GitHub Pages からのアクセスに対応しています。
