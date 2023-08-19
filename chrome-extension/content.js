let mainObserver = null;
let lastSentPGN = "";

console.log("content script loaded");


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("Message received:", message.action);  // Add this line
    if (message.action === "startObservation") {
        if (!mainObserver) {
            initializeObservers();
        }
        sendResponse({status: "Observing"});
    } 

    if (message.action === "flipBoard") {
        fetch('http://localhost:3000/flip', { method: 'POST' }) // Choose an endpoint for the flip command
            .then(() => console.log('Sent flip command to server.'))
            .catch(error => console.error(`Error sending flip command to server: ${error}`));
    }

    // ... rest of the message listeners ...
});

// Handle detected mutations
const handleMoveListChange = (mutationsList) => {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            console.log('Mutation detected in the move list.');

            // Get the move list element, first trying the larger window selector, then the small one
            const moveListElement = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > l4x') || document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > div.col1-moves > l4x');

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


// Function to send PGN to server
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
    // Try to select the "small" move list first.
    let moveList = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > div.col1-moves > l4x');

    // If not found, try the "big" move list.
    if (!moveList) {
        moveList = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > l4x');
    }

    if (moveList) {
        mainObserver = new MutationObserver(handleMoveListChange);
        mainObserver.observe(moveList, { childList: true, subtree: true });
    } else {
        console.log("Could not find move list element to observe.");
    }
};


