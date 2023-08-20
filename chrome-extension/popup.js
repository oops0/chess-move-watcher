document.addEventListener('DOMContentLoaded', function() {
    const startObservationButton = document.getElementById('startObservation');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');

    function updateStatusUI(isObserving, isNewGame = false) {
        if (isObserving) {
            if (isNewGame) {
                statusText.textContent = "New game (waiting)";
            } else {
                statusIcon.src = "assets/green-circle-icon.png";
                statusText.textContent = "Watching";
            }
        } else {
            statusIcon.src = "assets/red-circle-icon.png";
            statusText.textContent = "Inactive...";
        }
    }

    startObservationButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: "getObservationState" }, function(response) {
            if (response.isObserving) {
                // When the user clicks the button while it's already "Watching"
                updateStatusUI(true, true);

                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    const activeTab = tabs[0];
                    chrome.tabs.sendMessage(activeTab.id, { "action": "resetObservation" });
                });
            } else {
                fetch('http://localhost:3000/ping')
                    .then(response => {
                        if (response.status === 200) {
                            chrome.runtime.sendMessage({ action: "toggleObservation" }, function(response) {
                                updateStatusUI(response.isObserving);
                            });
                            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                                const activeTab = tabs[0];
                                chrome.tabs.sendMessage(activeTab.id, { "action": "startObservation" });
                            });
                        } else {
                            statusText.textContent += " (server)";
                        }
                    })
                    .catch(error => {
                        console.error("Server check failed:", error);
                        statusText.textContent += " (server)";
                    });
            }
        });
    });

    // Fetch the initial observation state when the popup loads
    chrome.runtime.sendMessage({ action: "getObservationState" }, function(response) {
        updateStatusUI(response.isObserving);
    });

    // Handle the "Flip" button click action
    document.getElementById('flip-board').addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { "action": "flipBoard" });
        });
    });
});

// Handle messages received from content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "moveDetected") {
        updateStatusUI(true);
    }
    if (message.action === "gameStarted") {
        updateStatusUI(true, true);
    }
});
