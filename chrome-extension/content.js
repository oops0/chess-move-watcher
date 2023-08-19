let mainObserver = null;
let bodyObserver = null;
let lastSentPGN = "";

console.log("content script loaded");

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("Message received:", message.action);

    if (message.action === "startObservation") {
        if (!mainObserver) {
            initializeObservers();
        }
        sendResponse({status: "Observing"});
    } else if (message.action === "flipBoard") {
        fetch('http://localhost:3000/flip', { method: 'POST' })
            .then(() => console.log('Sent flip command to server.'))
            .catch(error => console.error(`Error sending flip command to server: ${error}`));
    } else if (message.command === "cleanupObservers") {
        if (mainObserver) {
            mainObserver.disconnect();
            mainObserver = null;
        }
        if (bodyObserver) {
            bodyObserver.disconnect();
            bodyObserver = null;
        }
    }
    // ... rest of the message listeners ...
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
    })
    .catch(error => {
        console.error(`Error sending PGN to server: ${error}`);
    });
};

const initializeObservers = () => {
    // Initially, set up an observer on the entire document to look for the appearance of the move list.
    bodyObserver = new MutationObserver(handleBodyChange);
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // If the move list is already there, set up the main observer immediately.
    const existingMoveListElement = checkForMoveList();
    if (existingMoveListElement) {
        mainObserver = new MutationObserver(handleMoveListChange);
        mainObserver.observe(existingMoveListElement, { childList: true, subtree: true });
        bodyObserver.disconnect();
    }
};