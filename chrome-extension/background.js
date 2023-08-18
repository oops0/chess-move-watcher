chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message);

    // Placeholder for handling any other future messages you might want to send between parts of your extension

    return true; // keeps the message channel open for async sendResponse if needed in the future
});
