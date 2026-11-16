# hoshimurayuto.com

[hoshimurayuto.com](https://hoshimurayuto.com)のソースです。東京の今の空(太陽・月・星・天気)を背景に、作ったもの・書いたもの・使っている道具を並べた個人サイトです。Astroで静的に生成し、Cloudflare Workersで配信しています。

## 入れ方

Node.jsとpnpmの版は[mise](https://mise.jdx.dev/)で揃えます。

```sh
mise install
pnpm install
```

## 使い方

```sh
pnpm dev      # 開発サーバー(http://localhost:4321)
pnpm check    # 型・書式・lint・markup・CSS・文章・秘密情報・未使用コード
pnpm test     # 単体テスト
pnpm e2e      # 本番ビルドに対するPlaywrightのテスト
pnpm build    # dist/に出力
```

## 配信

Cloudflare Workersの静的アセットで配信します。設定は`wrangler.jsonc`で、Workers Buildsがビルドコマンド`pnpm run build`とデプロイコマンド`pnpm run deploy`を実行します。ビルド環境のNode.jsは変数`NODE_VERSION`で指定します。`public/_headers`がセキュリティヘッダーとキャッシュを指定します。Cloudflare Web AnalyticsのbeaconはCloudflareが配信時に挿入し、リポジトリにはありません。

## 中身

- `src/lib/sky/`: 日時と場所から空を計算する。[README](src/lib/sky/README.md)
- `src/lib/weather/`: 羽田の観測と気象庁の予報から天気を読む。[README](src/lib/weather/README.md)

## ライセンス

MIT([LICENSE](LICENSE))です。別のライセンスのファイルは[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)にまとめています。
