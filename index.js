import fs from "fs";
import path from 'path';
import puppeteer from "puppeteer";
import { readExcel } from "./utils/excelController.js";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const inputData = async (data) => {
        let page = await browser.newPage()
        const [pages] = await browser.pages();
        if (pages.url() === "about:blank") {
            pages.close()
        };

        const files = fs.readFileSync("./credentials/cookies.json", "utf8");
        const cookies = JSON.parse(files);

        await page.setCookie(...cookies);

        await page.goto("https://icie.stiki.ac.id/user/event/form?id=2", {
            waitUntil: ["networkidle2", "domcontentloaded"],
            timeout: 120000,
        });

        await page.evaluate((data) => {
            document.querySelector("input[name='nama']").value = data.teamName;
            document.querySelector("input[name='project']").value = data.projectName;
            document.querySelector("input[name='link_file']").value = data.fileLink;
            document.querySelector("input[name='superv']").value = data.supervisor;
            document.querySelector('input[name="matkul"]').value = "Tugas Akhir Mata Kuliah"
            document.querySelector("input[name='printed']").click();
        }, data)

        const member = await page.$('#form-submit > div.card-body > div:nth-child(3) > div:nth-child(2) > div:nth-child(1) > span > span.selection > span > ul > li > input')
        await member.type(data.teamName);

        await delay(2000)

        const memberList = await page.$('.select2-results__option')
        if (memberList) {
            await page.evaluate((data) => {
                const option = document.querySelectorAll('.select2-results__option')
                option.forEach((el) => {
                    if (el.textContent.includes(data)) {
                        el.click();
                    } else {
                        document.querySelector('#form-submit > div.card-body > div:nth-child(3) > div:nth-child(2) > div:nth-child(1) > span > span.selection > span > ul > li > input').value = ""
                    }
                })
            }, data.teamName)
        }

        await uploadCover(page, data.teamName);
        
        console.log("Data: ", data.teamName + " has been inputted");

        await delay(3000);
    };

    const uploadCover = async (page, name) => {
        const directoryPath = './data/images/';

        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }

            const filteredFiles = files.filter(file => file.includes(name));

            if (filteredFiles.length > 0) {
                filteredFiles.forEach(async (file) => {
                    // Note: kalo mau enak gambarnya disiapin semuanya dulu di folder images
                    const fileInput = await page.waitForSelector('input[name="image[]"]');
                    const filePath = path.join(directoryPath, file);
                    await fileInput.uploadFile(filePath);
                })
            }
        });
    }

    const proccesFile = async () => {
        try {
            const files = readExcel("data/SI.xlsx");
            for (let i = 2; i < 5; i++) {
                const data = files[i];

                let _data = {}

                Object.keys(data).forEach(async (key) => {
                    if (key === "__EMPTY_2" && data[key]) {
                        _data.teamName = data[key];
                    } else if (key === "__EMPTY_3" && data[key]) {
                        _data.projectName = data[key];
                    } else if (key === "__EMPTY_7" && data[key]) {
                        _data.fileLink = data[key];
                    } else if (key === "__EMPTY_6" && data[key]) {
                        _data.supervisor = data[key];
                    }
                    // TODO: Need to translate deskripsi with AI
                });

                await inputData(_data);
            }

            console.log("All data has been inputted");
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    proccesFile()
})();