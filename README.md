voicewarp-automation
====================

NTT 東日本のひかり電話のボイスワープの転送先設定の切り替え作業を自動化します。

## 必要なもの

Heroku Add-ons の [Temporise Scheduler](https://elements.heroku.com/addons/temporize) でスケジュールを設定し、転送先設定を切り替えます。
本アドオンの導入と Recurring event の登録が必要です。

なお、将来的にパスワードの自動更新を行う際には Heroku の config vars をアプリから直接変更することを考えています。

## 基本設定

以下の config vars が必要です:

- `PHONE_NO` - ログインに使う電話番号
- `PASSWORD` - ログインに使う現在のパスワード

## 使い方

Temporise Scheduler で以下を登録することで、切り替えが実行されます。

- URL: `https://<HOST>/switch/<LIST_NO>`
- HTTP Method: `GET`

例えば、リスト番号 3 に切り替える URL は `https://<HOST>/switch/3` になります。

## ライセンス

[ISC](LICENSE)

## 作者

[mikan](https://github.com/mikan)
