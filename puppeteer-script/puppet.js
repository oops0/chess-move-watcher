const puppeteer = require('puppeteer');
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

let page;
let lastKnownColor = 'white';  // initialize with default

async function startBrowser() {
    const browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
    await page.goto('https://lichess.org/analysis/standard');
    await page.keyboard.press('L');

    // Listen to PGN updates
    socket.on('pgn_update', async (data) => {
        const { pgn, color } = data;
        console.log('Received PGN update:', pgn);

        if (color !== lastKnownColor) {
            if (color === 'black') {
                await page.keyboard.press('F');
            }
            lastKnownColor = color;
        }

        await updatePGNInAnalysis(page, pgn);
    });
}

async function updatePGNInAnalysis(page, pgn) {
    try {
        const selector = '#main-wrap > main > div.analyse__underboard > div > div.pgn > div > textarea';

        // Wait for the PGN textarea to appear
        await page.waitForSelector(selector, { visible: true });

        // Set the PGN value instantly
        await page.evaluate((selector, pgn) => {
            document.querySelector(selector).value = pgn;
        }, selector, pgn);

        // Press Enter to update the analysis board
        await page.focus(selector);
        await page.keyboard.press('Enter');

    } catch (error) {
        console.error('Error while trying to update PGN:', error);
    }
}

startBrowser();
