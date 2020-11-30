import puppeteer from "puppeteer"

export const successPrefix = "[成功] "
export const failurePrefix = "[失敗] "

export default async function switchListNumber(endpoint: string, phone: string, password: string, switchTo: string): Promise<string> {
    const browser = await puppeteer.launch({args: ["--no-sandbox"]}) // Heroku の制約により sandbox 無効化
    const page = await browser.newPage()

    console.log("ログイン画面を開いています...")
    await page.goto(endpoint + "AGL_Disp.do")

    console.log("電話番号とパスワードを入力しています...")
    await page.type("input[name=phoneNo]", phone)
    await page.type("input[name=pass]", password)

    console.log("\"ログイン\" ボタンをクリックしています...")
    const loginButton = await page.$("input[alt=ログイン]")
    if (!loginButton) {
        return await failure(browser, page, "\"ログイン\" ボタンを発見できませんでした")
    }
    await loginButton.click()
    await page.waitForNavigation()
    if (!page.url().endsWith("AGL_Login.do")) {
        return await failure(browser, page, "サービス選択画面への遷移に失敗しました")
    }

    // TODO: パスワード有効期限切れ画面に遭遇した場合は、新しいパスワードを自動生成、設定、保存する

    const passwordNotice = await page.$(".mes_error_center_new")
    if (passwordNotice) {
        console.log("パスワード期限予告の \"OK\" ボタンをクリックしています...")
        const okButton = await page.$("input[alt=OK]")
        if (!okButton) {
            return await failure(browser, page, "パスワード期限予告の \"OK\" ボタンを発見できませんでした")
        }
        await okButton.click()
        await page.waitForNavigation()
        if (!page.url().endsWith("AGS_Disp.do")) {
            return await failure(browser, page, "サービス選択画面への遷移に失敗しました")
        }
    }

    console.log("\"ボイスワープ\" ボタンをクリックしています...")
    const voiceWarpButton = await page.$("input[alt=ボイスワープ]")
    if (!voiceWarpButton) {
        return await failure(browser, page, "\"ボイスワープ\" ボタンを発見できませんでした")
    }
    await voiceWarpButton.click()
    await page.waitForNavigation()
    if (!page.url().endsWith("VUM_Disp.do")) {
        return await failure(browser, page, "サービスメニュー画面への遷移に失敗しました")
    }

    console.log("\"転送先電話番号設定\" ボタンをクリックしています...")
    const transferSettingButton = await page.$("input[alt=転送先電話番号設定]")
    if (!transferSettingButton) {
        return await failure(browser, page, "\"転送先電話番号設定\" ボタンを発見できませんでした")
    }
    await transferSettingButton.click()
    await page.waitForNavigation()
    if (!page.url().endsWith("VUL_Disp.do")) {
        return await failure(browser, page, "転送先電話番号設定画面への遷移に失敗しました")
    }

    console.log("現在選択されているリスト番号を取得しています...")
    const checked = await page.$("input[checked=checked]")
    if (!checked) {
        return await failure(browser, page, "現在チェックされているリスト番号を取得できませんでした")
    }
    const checkedValue = await page.evaluate(el => el.getAttribute("value"), checked)
    if (checkedValue === switchTo) {
        return await success(browser, page, "指定されたリスト番号はすでに選択されていました")
    }

    console.log(`リスト番号を ${checkedValue} から ${switchTo} に切り替えています...`)
    const target = await page.$(`input[value="${switchTo}"]`)
    if (!target) {
        return await failure(browser, page, `リスト番号 ${switchTo} を取得できませんでした`)
    }
    await target.click()

    console.log("\"設定\" ボタン (設定画面) をクリックしています...")
    const confirmSettingButton = await page.$("input[alt=設定]")
    if (!confirmSettingButton) {
        return await failure(browser, page, "\"設定\" ボタンを発見できませんでした")
    }
    await confirmSettingButton.click()
    await page.waitForNavigation()
    if (!page.url().endsWith("VUL_Confirm.do")) {
        return await failure(browser, page, "転送先電話番号設定確認画面への遷移に失敗しました")
    }

    console.log("\"設定\" ボタン (確認画面) をクリックしています...")
    const doSettingButton = await page.$("input[alt=設定]")
    if (!doSettingButton) {
        return await failure(browser, page, "\"設定\" ボタンを発見できませんでした")
    }
    await doSettingButton.click()
    await page.waitForNavigation()
    if (!page.url().endsWith("VUL_Regist.do")) {
        return await failure(browser, page, "転送先電話番号設定完了画面への遷移に失敗しました")
    }

    console.log("設定が完了しました")
    return await success(browser, page, `リスト番号を ${checkedValue} から ${switchTo} に切り替えました`)
}

async function success(browser: puppeteer.Browser, page: puppeteer.Page, msg: string) {
    await page.screenshot({path: "result.png"})
    await browser.close()
    return successPrefix + msg
}

async function failure(browser: puppeteer.Browser, page: puppeteer.Page, msg: string) {
    console.error(page.url() + ": " + msg)
    await page.screenshot({path: "error.png"})
    await browser.close()
    return failurePrefix + msg
}
