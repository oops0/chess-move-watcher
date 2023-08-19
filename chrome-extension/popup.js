document.addEventListener('DOMContentLoaded', function() {
    const startObservationButton = document.getElementById('startObservation');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');

    function updateStatusUI(isObserving) {
        if (isObserving) {
            statusIcon.src = "assets/green-circle-icon.png";
            statusText.textContent = "Watching..";
        } else {
            statusIcon.src = "assets/red-circle-icon.png";
            statusText.textContent = "Inactive";
        }
    }

    startObservationButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: "toggleObservation" }, function(response) {
            updateStatusUI(response.isObserving);
        });

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { "action": "startObservation" });
        });
    });

    chrome.runtime.sendMessage({ action: "getObservationState" }, function(response) {
        updateStatusUI(response.isObserving);
    });

    document.getElementById('flip-board').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {"action": "flipBoard"});
        });
    });
});
