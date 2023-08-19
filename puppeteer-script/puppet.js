const puppeteer = require('puppeteer');
const WebSocket = require('ws');
let flipPending = false;

// Function to set the value of the PGN textarea and press "Enter"
async function pastePGNAndPressEnter(page, pgnString) {
    const PGN_INPUT_SELECTOR = '#main-wrap > main > div.analyse__underboard > div > div.pgn > div > textarea';

    // Set the value of the textarea to the PGN string
    await page.evaluate((selector, value) => {
        const textarea = document.querySelector(selector);
        if (textarea) {
            textarea.value = value;
        }
    }, PGN_INPUT_SELECTOR, pgnString);

    // Now focus on the textarea and press "Enter"
    await page.focus(PGN_INPUT_SELECTOR);
    await page.keyboard.press('Enter');
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });    
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('https://lichess.org/analysis');
    await page.waitForSelector('#main-wrap');
    await page.keyboard.press('L');    

    const ws = new WebSocket('ws://localhost:3000');

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
    
        if (data.action === "flipBoard") {
            await page.evaluate(() => {
                document.activeElement.blur();  // Remove focus from the currently focused element
            });
            await page.keyboard.press('F');        // Flip the board with F
            flipPending = true;  // Set the flip flag to true after flipping
            return;
        } 
    
        if (data.pgn) {
            const currentPGN = data.pgn;
            await pastePGNAndPressEnter(page, currentPGN); 
            
            // Check if a flip is pending after pasting the PGN
            if (flipPending) {
                await page.evaluate(() => {
                    document.activeElement.blur();  // Remove focus from the currently focused element
                });
                await page.keyboard.press('F');        // Flip the board with F
                flipPending = false;  // Reset the flip flag
            }
        }
    });
    
    
    

})();
