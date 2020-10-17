import * as http from "http"
import * as fs from "fs"
import * as dotenv from "dotenv"
import switchListNumber from "./switch";

dotenv.config()
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

const handleSwitch = (res: http.ServerResponse, switchTo: string) => {
    void (async () => {
        const msg = await switchListNumber(endpoint, phoneNumber, password, switchTo)
        if (msg === "") {
            res.writeHead(200, {"Content-Type": "text/plain"})
            res.write("Success")
            res.end()
        } else {
            res.writeHead(500, {"Content-Type": "text/plain"})
            res.write(msg || "不明なエラーです")
            res.end()
        }
    })()
}

const handleFile = (res: http.ServerResponse, path: string) => {
    if (fs.existsSync(path)) {
        res.writeHead(200, {"Content-Type": "image/png"})
        fs.createReadStream(path).pipe(res)
    } else {
        res.writeHead(404, {"Content-Type": "text/plain"})
        res.write("Not found")
        res.end()
    }
}

const server = http.createServer()
server.on("request", function (req, res) {
    switch (req.url) {
        case "/":
            res.writeHead(200, {"Content-Type": "text/plain"})
            res.write("Hello, world!")
            res.end()
            break
        case "/switch/1":
            handleSwitch(res, "1")
            break
        case "/switch/2":
            handleSwitch(res, "2")
            break
        case "/switch/3":
            handleSwitch(res, "3")
            break
        case "/switch/4":
            handleSwitch(res, "4")
            break
        case "/latest-result.png":
            handleFile(res, "result.png")
            break
        case "/latest-error.png":
            handleFile(res, "error.png")
            break
        default:
            res.writeHead(404, {"Content-Type": "text/plain"})
            res.write("Not found")
            res.end()
            break
    }
})
const port = process.env.PORT || "8080"
console.log(`server listening at port ${port}`)
server.listen(port)
