import https from "https"
import {URL} from "url"

export default function slackPost(url: string, content: string): void {
    const parsedUrl = new URL(url)
    const options = {
        host: parsedUrl.host,
        port: 443,
        path: parsedUrl.pathname,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(content),
        },
    }
    const req = https.request(options, (res) => res.setEncoding("utf8"))
    req.on("error", (e) => {
        console.error("failed to post slack: " + e.message)
    })
    req.write(content)
    req.end()
}
