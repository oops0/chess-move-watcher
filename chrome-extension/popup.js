document.addEventListener('DOMContentLoaded', function() {
    const startObservationButton = document.getElementById('startObservation');

    if(startObservationButton) {
        startObservationButton.addEventListener('click', function() {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, { "action": "startObservation" });
            });
        });
    } else {
        console.error("Start Observation button not found.");
    }
});

document.getElementById('flip-board').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"action": "flipBoard"});
    });
});
