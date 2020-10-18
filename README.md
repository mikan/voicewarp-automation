voicewarp-automation
====================

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mikan/voicewarp-automation)

NTT 東日本のひかり電話のボイスワープの転送先設定の切り替え作業を自動化します。

## 必要なもの

[Heroku](https://jp.heroku.com/) で動作させることを前提としており、Heroku へデプロイした後に Heroku Add-ons の [Temporise Scheduler](https://elements.heroku.com/addons/temporize) でスケジュールを設定し、転送先設定を切り替えることで動作します。

また、将来的にパスワードの自動更新を行う際には Heroku の config vars をアプリから直接変更することを考えています。

## 基本設定

以下の config vars が必要です:

- `PHONE_NO` - ログインに使う電話番号
- `PASSWORD` - ログインに使う現在のパスワード

ローカルで動かす場合は以下のような `.env` ファイルを作ると便利です:

```
PHONE_NO=xxxxxxxxxx
PASSWORD=xxxxxxxxxx
```

## スケジュール設定

Temporise Scheduler の Recurring event で以下を登録することで、切り替えが実行されます。

- URL: `https://<HOST>/switch/<LIST_NO>`
- HTTP Method: `GET`

例えば、リスト番号 3 に切り替える URL は `https://<HOST>/switch/3` になります。

## Slash Command

Slack の Slash Command で操作することが可能です。
設定すると、 `/<設定したコマンド> <LIST_NO>` (例: `/voicewarp 3`) のような形式で利用できます。

- URL: `https://<HOST>/slack/slash`
- Method: `POST`

なお、Slash Command は 3 秒以内に最初の応答を返す必要があるため、Heroku の Free Dyno でスリープしているとタイムアウトしてしまいます。
利用には外形監視などで常に起こしておくか、Hobby Dyno 等のスリープしない Dyno を選ぶ必要があります。

なお、Slash Command 作成時に発行するトークンを `SLACK_SLASH_TOKEN` config vars に設定すると、そのトークン以外からの呼び出しをブロックすることができます。
セキュリティのため設定をお勧めします。

## ライセンス

[ISC](LICENSE)

## 作者

[mikan](https://github.com/mikan)
