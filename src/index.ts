import express from "express"
import * as fs from "fs"
import * as dotenv from "dotenv"
import switchListNumber, {successPrefix} from "./switch"
import slackPost from "./slack"
import updateHerokuConfigVar from "./heroku"

dotenv.config()
const listNumbers = ["1", "2", "3", "4"]
const defaultPort = "3000"
const endpoint = process.env.ENDPOINT || "https://www.hikari.ntt-east.net/"
const phoneNumber = process.env.PHONE_NO
if (!phoneNumber) {
    console.error("環境変数 PHONE_NO を設定してください")
    process.exit(1)
}
const password = process.env.PASSWORD
if (!password) {
    console.error("環境変数 PASSWORD を設定してください")
    process.exit(1)
}

const selfUrl = (req: express.Request): string => {
    const host = req.header("Host")
    if (!host || host.includes("localhost")) {
        return `http://localhost:${defaultPort}/`
    }
    return `https://${host}/`
}

const fileResponse = (res: express.Response, path: string) => {
    if (fs.existsSync(path)) {
        res.setHeader("Content-Type", "image/png")
        res.sendFile(__dirname.replace("/dist", "/").replace("/src", "/") + path)
    } else {
        res.status(404).send("Not found")
    }
}

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.get("/", (req, res) => {
    res.send("It works!")
})
app.get("/switch/:listNumber", (req, res) => {
    const switchTo = req.params["listNumber"]
    if (!listNumbers.includes(switchTo)) {
        res.status(404).send("Not found")
        return
    }
    void (async () => {
        const result = await switchListNumber(endpoint, phoneNumber, password, switchTo) || "不明なエラーです"
        if (!result.startsWith(successPrefix)) {
            res.status(500).send(result)
            return
        }
        res.send(result)
    })()
})
app.get("/latest-result.png", (req, res) => {
    fileResponse(res, "./result.png")
})
app.get("/latest-error.png", (req, res) => {
    fileResponse(res, "./error.png")
})
app.post("/slack/slash", (req, res) => {
    const expectedToken = process.env.SLACK_SLASH_TOKEN
    if (expectedToken && expectedToken != req.body["token"]) {
        res.status(403).send("Forbidden")
        return
    }
    const text = req.body["text"]
    if (text === "") {
        res.send("リスト番号 (" + listNumbers.join(", ") + ") 指定してください")
        return
    }
    const responseUrl = req.body["response_url"]
    if (text.startsWith("heroku PASSWORD=")) {
        const newPassword = text.replace("heroku PASSWORD=", "")
        if (newPassword === "") {
            res.send("パスワードを指定してください")
            return
        }
        const result = updateHerokuConfigVar("PASSWORD", newPassword)
        slackPost(responseUrl, JSON.stringify({
            response_type: "in_channel",
            text: result,
        }))
        return
    }
    if (!listNumbers.includes(text)) {
        res.send("不正なリスト番号です: " + text)
        return
    }
    res.json({
        response_type: "in_channel",
        text: "", // タイムアウト対策として一旦空を返却し、後で response_url に本文を POST します
    })
    void (async () => {
        const result = await switchListNumber(endpoint, phoneNumber, password, text) || "不明なエラーです"
        if (!result.startsWith(successPrefix)) {
            slackPost(responseUrl, JSON.stringify({
                response_type: "in_channel",
                text: result,
                attachments: [{
                    image_url: selfUrl(req) + "latest-error.png",
                }],
            }))
            return
        }
        slackPost(responseUrl, JSON.stringify({
            response_type: "in_channel",
            text: result,
        }))
    })()
})

const port = process.env.PORT || defaultPort
const server = app.listen(port, () => {
    console.log(`server listening at port ${port}`)
})
const gracefulShutdown = function () {
    server.close(function () {
        process.exit()
    })
}
process.on("SIGTERM", gracefulShutdown)
process.on("SIGINT", gracefulShutdown)
