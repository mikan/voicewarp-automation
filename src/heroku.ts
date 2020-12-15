import https from "https"
import {failurePrefix, successPrefix} from "./switch"

export default function updateHerokuConfigVar(key: string, password: string): string {
    if (!process.env.HEROKU_APP_NAME) {
        return failurePrefix + "Dyno Metadata を有効にしてください"
    }
    if (!process.env.PLATFORM_TOKEN) {
        return failurePrefix + "Heroku Platform API 用トークンを設定してください"
    }
    const content = JSON.stringify({
        PASSWORD: password,
    })
    const options = {
        host: "api.heroku.com",
        port: 443,
        path: "/apps/" + process.env.HEROKU_APP_NAME + "/config-vars",
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(content),
            "Accept": "application/vnd.heroku+json; version=3",
            "Authorization": "Bearer " + process.env.PLATFORM_TOKEN,
        },
    }
    const req = https.request(options, (res) => res.setEncoding("utf8"))
    req.on("error", (e) => {
        return failurePrefix + "Config Var の設定に失敗しました: " + e.message
    })
    req.write(content)
    req.end()
    return successPrefix + "Config Var を正常に更新しました"
}
