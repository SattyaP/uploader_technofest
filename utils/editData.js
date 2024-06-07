import fs from "fs";
import puppeteer from "puppeteer";
import {
    readExcel
} from "./excelController.js";
import {
    delay
} from "./sleep.js";

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

    const readData = (index) => {
        return readExcel("./data/fill.xlsx", index)
    }

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

        const editBtn = await page.$$('a[title="Detail Judge"]')

        for (let j = 20; j < editBtn.length; j++) {
            const idKarya = await page.evaluate((el) => el.getAttribute('href').split('id_karya=')[1], editBtn[j])

            const newPage = await browser.newPage()
            await newPage.goto(`https://icie.stiki.ac.id/user/event/form?id=2&id_karya=${idKarya}`, {
                waitUntil: ["networkidle2", "domcontentloaded"],
                timeout: 120000,
            });

            await newPage.waitForSelector('input[name="nama"]', {
                waitUntil: 120000
            })

            const name = await newPage.$eval('input[name="nama"]', (el) => el.value.trim());

            console.log(`Editing Data ${name}...`);

            let data = readData(1)

            const valid = data.find((el) => el.__EMPTY_2 === name)

            if (valid) {
                let teamName = valid.__EMPTY_10

                await newPage.$eval('input[name="project"]', (el, teamName) => {
                    el.value = teamName
                }, teamName);

                await newPage.$eval('input[name="printed"]', (el) => el.checked ? "" : el.checked = true)

                const submit = await newPage.$('button[type="submit"]')
                await submit.click()

                await delay(5000)

                await newPage.close()

                console.log(`Data ${name} Already Edited!`);
            } else {
                data = readData(2)
                const valid = data.find((el) => el.__EMPTY_2 === name)

                if (valid) {
                    let teamName = valid.__EMPTY_11
                    await newPage.$eval('input[name="project"]', (el, teamName) => {
                        el.value = teamName
                    }, teamName);
    
                    await newPage.$eval('input[name="printed"]', (el) => el.checked ? "" : el.checked = true)
    
                    const submit = await newPage.$('button[type="submit"]')
                    await submit.click()
    
                    await delay(5000)
    
                    await newPage.close()
    
                    console.log(`Data ${name} Already Edited!`);
                }
            }
        }

    } catch (error) {
        console.error(error)
        await browser.close()
    }
}