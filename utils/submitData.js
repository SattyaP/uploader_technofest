import fs from "fs";
import path from 'path';
import puppeteer from "puppeteer";
import { readExcel } from "./excelController.js";
import { delay } from "./sleep.js";

export async function submitData() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"],
    });

    const inputData = async (data) => {
        const page = (await browser.pages())[0]

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
            document.querySelector(".checkbox > input[name='printed']").click();
            document.querySelector("input[name='link_video']").value = data.videoLink;
            document.querySelector('textarea[name="project_desc"]').value = data.deskripsi;
        }, data)

        const member = await page.$('#form-submit > div.card-body > div:nth-child(3) > div:nth-child(2) > div:nth-child(1) > span > span.selection > span > ul > li > input')
        await member.type(data.teamName);

        await delay(2000)

        const memberList = await page.$('.select2-results__option')
        if (memberList) {
            await page.evaluate((page, data) => {
                const option = document.querySelectorAll('.select2-results__option')
                option.forEach(async (el) => {
                    if (el.innerText.includes(data)) {
                        await page.select('.select2-results__options', el.value)
                    } else {
                        document.querySelector('#form-submit > div.card-body > div:nth-child(3) > div:nth-child(2) > div:nth-child(1) > span > span.selection > span > ul > li > input').value = ""
                    }
                })
            }, page, data.teamName)
        }

        await uploadCover(page, data.teamName);

        console.log("Data: ", data.teamName + " has been inputted");

        await delay(3000);
    };

    const uploadCover = async (page, name) => {
        const directoryPath = './data/images/IF/';

        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }

            const filteredFiles = files.filter(file => file.includes(name));

            if (filteredFiles.length > 0) {
                filteredFiles.forEach(async (file) => {
                    const fileInput = await page.waitForSelector('input[name="image[]"]');
                    const filePath = path.join(directoryPath, file);
                    await fileInput.uploadFile(filePath);
                })
            }
        });
    }

    const proccesFile = async () => {
        try {
            const files = readExcel("data/fill.xlsx", 2);
            for (let i = 0; i < files.length ; i++) {
                const data = files[i];

                let _data = {}
                

                Object.keys(data).forEach(async (key) => {
                    if (key === "__EMPTY_2" && data[key]) {
                        _data.teamName = data[key].trim();
                    } else if (key === "__EMPTY_4" && data[key]) {
                        _data.projectName = data[key];
                    } else if (key === "__EMPTY_10" && data[key]) {
                        _data.fileLink = data[key];
                    } else if (key === "__EMPTY_5" && data[key]) {
                        const value = data[key];
                        let filteredData;

                        if (value.includes("Pembimbing") && !value.includes("Co Pembimbing")) {
                            const modifiedValue = value.replace("Pembimbing :", "").trim();
                            filteredData = modifiedValue;
                        } else {
                            filteredData = value;
                        }
                        _data.supervisor = filteredData;
                    } else if (key === "__EMPTY_6" && data[key]) {
                        _data.videoLink = data[key];
                    } else if (key === "__EMPTY_9" && data[key]) {
                        _data.deskripsi = data[key];
                    }
                });

                await inputData(_data);
            }

            console.log("All data has been inputted");
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    await proccesFile()
};
