let isObserving = false;

function updateIcon() {
    const iconPath = isObserving ? "assets/green-circle-icon.png" : "assets/red-circle-icon.png";
    chrome.action.setIcon({ path: {16: iconPath} });    
}

// Fetch the initial state from storage when the background script starts
chrome.storage.local.get("isObserving", function(data) {
    isObserving = data.isObserving || false;
    updateIcon(); // Set the initial icon based on fetched state
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "toggleObservation") {
        isObserving = !isObserving; // Toggle the observation state
        
        // Save the new observation state to storage
        chrome.storage.local.set({ isObserving: isObserving });

        // Update the icon
        updateIcon();

        // Send the updated state back to the popup script
        sendResponse({ isObserving: isObserving });
        
    } else if (message.action === "getObservationState") {
        sendResponse({ isObserving: isObserving });
    }
});
