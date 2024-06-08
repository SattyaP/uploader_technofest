import fs from "fs";
import puppeteer from "puppeteer";
import { delay } from "./sleep.js";

export async function editData() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"],
    });

    let page = await browser.newPage()
    const pages = await browser.pages();
    if (pages[0].url() === "about:blank") {
        pages[0].close()
    };

    try {
        const files = fs.readFileSync("./credentials/cookies.json", "utf8");
        const cookies = JSON.parse(files);

        await page.setCookie(...cookies);

        await page.goto("https://icie.stiki.ac.id/user/event/detail?id=2", {
            waitUntil: ["networkidle2", "domcontentloaded"],
            timeout: 120000,
        });

        await page.waitForSelector('a[title="Detail Judge"]')

        await page.select('select[name="data-table_length"]', "100")
        await delay(3000)

        await page.$$eval('a[title="Detail Judge"]', (el) => el.map((e => e.setAttribute("target", "_blank"))))

        await delay(3000)
        await page.$$eval('a[title="Detail Judge"]', (elements) => {
            elements.forEach(e => e.click());
        });

    } catch (error) {
        console.error(error)
        await browser.close()
    }
}