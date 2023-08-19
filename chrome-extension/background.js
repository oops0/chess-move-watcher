// This is for when the extension is installed or updated.
chrome.runtime.onInstalled.addListener((details) => {
    cleanupObserversOnAllTabs();

    // Additional code you might have for initialization on install/update...
});

// This is for when Chrome starts up (and when the extension is reloaded).
chrome.runtime.onStartup.addListener(() => {
    cleanupObserversOnAllTabs();
});

function cleanupObserversOnAllTabs() {
    // Send a message to content scripts to cleanup.
    chrome.tabs.query({url: "https://lichess.org/*"}, (tabs) => {
        for (let tab of tabs) {
            try {
                chrome.tabs.sendMessage(tab.id, {command: "cleanupObservers"}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                    } else {
                        // Handle the response, if needed.
                    }
                });
            } catch (error) {
                console.error("Failed sending message to tab:", error);
            }
        }
    });
}
