let mainObserver = null;
let bodyObserver = null;
let lastSentPGN = "";
let isReset = false; // Indicates if the game has been reset
let gameHasEnded = false;  // Add this at the top of your script


console.log("content script loaded");

// Check if a game has ended
function checkForEndOfGame() {
    const largeWindowSelector = "#main-wrap > main > div.round__app.variant-standard > rm6 > l4x > div > p.result";
    const smallWindowSelector = "#main-wrap > main > div.round__app.variant-standard > rm6 > div.col1-moves > l4x > div > p.result";
    if (document.querySelector(largeWindowSelector)) {
        console.log("Game end detected using large window selector.");
        return true;
    } 
    
    if (document.querySelector(smallWindowSelector)) {
        console.log("Game end detected using small window selector.");
        return true;
    }
    return false;
}

function startNewGameForAnalysis() {
    console.log("Start observation action triggered.");
    if (!mainObserver) {
        initializeObservers();
    } else {
        isReset = true;
    }
}


//Add listeners
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("Message received:", message.action);
    console.log("Initializing runtime message listener...");

    if (message.action === "startObservation") {
        startNewGameForAnalysis();
        sendResponse({status: "Observing"});
    } else if (message.action === "flipBoard") {
        console.log("Flip board action triggered.");

        fetch('http://localhost:3000/flip', { method: 'POST' })
            .then(() => console.log('Sent flip command to server.'))
            .catch(error => console.error(`Error sending flip command to server: ${error}`));
    } else if (message.action === "resetObservation") {
        console.log("Reset observation action triggered.");

        // Disconnect existing observers
        if (mainObserver) {
            mainObserver.disconnect();
            mainObserver = null;
        }
        if (bodyObserver) {
            bodyObserver.disconnect();
        }
        
        // Reset the last sent PGN
        lastSentPGN = "";
        
        // Re-initialize observers
        initializeObservers();

        sendResponse({status: "Reset and Observing"});
    } else if (message.action === "gameEnded") {
        console.log("Game ended action received. Simulating pressing the 'start' button...");
        simulateStartButtonPress();
    }
});



const checkForMoveList = () => {
    return document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > l4x') || 
           document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > div.col1-moves > l4x');
};

const handleBodyChange = (mutationsList, observer) => {
    const moveListElement = checkForMoveList();
    if (moveListElement) {
        console.log('Move list detected.');
        observer.disconnect(); // Disconnect from observing the entire body once the move list is found.
        console.log("Initializing main observer...");
        mainObserver = new MutationObserver(handleMoveListChange);
        mainObserver.observe(moveListElement, { childList: true, subtree: true });
    }
};

const handleMoveListChange = (mutationsList) => {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            console.log('Mutation detected in the move list.');

            // Get the move list element, first trying the larger window selector, then the small one
            const moveListElement = checkForMoveList();

            // Ensure the element was found
            if (!moveListElement) {
                console.error("Could not find move list element.");
                return;
            }

            // Extract moves and numbers from the move list element
            const moves = [];
            moveListElement.childNodes.forEach(child => {
                const text = child.textContent.trim();
                // Check if the text is a move or a move number
                if (text && (child.tagName.toLowerCase() === 'kwdb' || child.tagName.toLowerCase() === 'i5z')) {
                    moves.push(text);
                }
            });

            // Construct the PGN string
            const pgnMoves = moves.map((move, index) => {
                // If the move is a number, add a period after it
                if (!isNaN(move)) {
                    return `${move}.`;
                }
                return move;
            }).join(' ').trim();

            // Check if the generated PGN is different from the last sent PGN
            if (pgnMoves !== lastSentPGN) {
                lastSentPGN = pgnMoves;
                sendPGNToServer(pgnMoves);

                if (isReset) {
                    chrome.runtime.sendMessage({ action: "gameStarted" });
                    isReset = false;
                }
            }

            if (checkForEndOfGame() && !gameHasEnded) {
                gameHasEnded = true;
                console.log("Game has ended. Starting a new game for analysis.");
                startNewGameForAnalysis();  // Start a new game for analysis.
                chrome.runtime.sendMessage({ "action": "gameEnded" });
            }            
        }
    }
};

const sendPGNToServer = (pgn) => {
    fetch('http://localhost:3000/pgn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pgn: pgn })
    })
    .then(response => response.json())
    .then(data => {
        console.log(`PGN sent to server. Response: ${JSON.stringify(data)}`);
        
        // Send message to popup to update status
        chrome.runtime.sendMessage({ action: "moveDetected" });
    })
    .catch(error => {
        console.error(`Error sending PGN to server: ${error}`);
    });
};


const initializeObservers = () => {
    // Initially, set up an observer on the entire document to look for the appearance of the move list.
    console.log("Initializing body observer...");

    bodyObserver = new MutationObserver(handleBodyChange);
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // If the move list is already there, set up the main observer immediately.
    const existingMoveListElement = checkForMoveList();
    if (existingMoveListElement) {
        console.log("Initializing main observer...");

        mainObserver = new MutationObserver(handleMoveListChange);
        mainObserver.observe(existingMoveListElement, { childList: true, subtree: true });
        bodyObserver.disconnect();
    }
    if (checkForEndOfGame()) {
        chrome.runtime.sendMessage({ "action": "gameEnded" });
    }
};