import * as puppeteer from "puppeteer"

export default async function switchListNumber(endpoint: string, phone: string, password: string, switchTo: string) {
    const browser = await puppeteer.launch({args: ['--no-sandbox']}) // Heroku の制約により sandbox 無効化
    const page = await browser.newPage()

    console.log("ログイン画面を開いています...")
    await page.goto(endpoint + "AGL_Disp.do")

    console.log("電話番号とパスワードを入力しています...")
    await page.type("input[name=phoneNo]", phone)
    await page.type("input[name=pass]", password)

    console.log("\"ログイン\" ボタンをクリックしています...")
    const loginButton = await page.$("input[alt=ログイン]")
    if (!loginButton) {
        return await fatal(browser, page, "\"ログイン\" ボタンを発見できませんでした")
    }
    await loginButton.click()
    await page.waitForNavigation()

    // TODO: パスワード有効期限接近画面に遭遇した場合は新しいパスワードを自動生成、設定、保存する

    console.log("\"ボイスワープ\" ボタンをクリックしています...")
    const voiceWarpButton = await page.$("input[alt=ボイスワープ]")
    if (!voiceWarpButton) {
        return await fatal(browser, page, "\"ボイスワープ\" ボタンを発見できませんでした")
    }
    await voiceWarpButton.click()
    await page.waitForNavigation()

    console.log("\"転送先電話番号設定\" ボタンをクリックしています...")
    const transferSettingButton = await page.$("input[alt=転送先電話番号設定]")
    if (!transferSettingButton) {
        return await fatal(browser, page, "\"転送先電話番号設定\" ボタンを発見できませんでした")
    }
    await transferSettingButton.click()
    await page.waitForNavigation()

    console.log("現在選択されているリスト番号を取得しています...")
    const checked = await page.$("input[checked=checked]")
    if (!checked) {
        return await fatal(browser, page, "現在チェックされているリスト番号を取得できませんでした")
    }
    const checkedValue = await page.evaluate(el => el.getAttribute("value"), checked)
    if (checkedValue === switchTo) {
        return await fatal(browser, page, "指定されたリスト番号はすでに選択されています")
    }

    console.log(`リスト番号を ${checkedValue} から ${switchTo} に切り替えています...`)
    const target = await page.$(`input[value="${switchTo}"]`)
    if (!target) {
        return await fatal(browser, page, `リスト番号 ${switchTo} を取得できませんでした`)
    }
    await target.click()

    console.log("\"設定\" ボタン (リスト設定画面) をクリックしています...")
    const confirmSettingButton = await page.$("input[alt=設定]")
    if (!confirmSettingButton) {
        return await fatal(browser, page, "\"設定\" ボタンを発見できませんでした")
    }
    await confirmSettingButton.click()
    await page.waitForNavigation()

    console.log("\"設定\" ボタン (確認画面) をクリックしています...")
    const doSettingButton = await page.$("input[alt=設定]")
    if (!doSettingButton) {
        return await fatal(browser, page, "\"設定\" ボタンを発見できませんでした")
    }
    await doSettingButton.click()
    await page.waitForNavigation()

    if (!page.url().endsWith("VUL_Regist.do")) {
        return await fatal(browser, page, "設定に失敗しました")
    }
    console.log("設定が完了しました")
    await page.screenshot({path: "result.png"})

    await browser.close()
    return ""
}

async function fatal(browser: puppeteer.Browser, page: puppeteer.Page, msg: string) {
    console.error(page.url() + ": " + msg)
    await page.screenshot({path: "error.png"})
    await browser.close()
    return msg
}
