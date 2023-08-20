let isObserving = false;

// Fetch the initial state from storage when the background script starts
chrome.storage.local.get("isObserving", function(data) {
    isObserving = data.isObserving || false;
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "toggleObservation") {
        isObserving = !isObserving; // Toggle the observation state
        
        // Save the new observation state to storage
        chrome.storage.local.set({ isObserving: isObserving });

        // Send the updated state back to the popup script
        sendResponse({ isObserving: isObserving });
        
    } else if (message.action === "getObservationState") {
        sendResponse({ isObserving: isObserving });
    }
});
