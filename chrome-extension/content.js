let lastSentPGN = "";
let lastMoveCount = 0; 
let playerColor = 'white';
let isNewGame = false; 

const checkPlayerColor = () => {
    const blackPlayerElement = document.querySelector('div.player.color-icon.is.black.text a[href="/@/oops04"]');
    if (blackPlayerElement) {
        playerColor = 'black';
    }

    const whitePlayerElement = document.querySelector('div.player.color-icon.is.white.text a[href="/@/oops04"]');
    if (whitePlayerElement) {
        playerColor = 'white';
    }

    console.log(playerColor)
};

const handleMoveListChange = (mutationsList, observer) => {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            console.log('Mutation detected in the move list.');

            // Generate the PGN string
            const moves = [];
            mutation.target.querySelectorAll('kwdb').forEach((moveNode, index) => {
                const move = moveNode.textContent.trim();
                if (move) {
                    moves.push(move);
                }
            });

            const pgnMoves = moves.map((move, index) => {
                if (index % 2 === 0) {
                    return `${(index / 2) + 1}. ${move}`;
                } else {
                    return move;
                }
            }).join(' ').trim();

            const currentMoveCount = moves.length;

            if (currentMoveCount + 3 < lastMoveCount) {
                console.log("Detected a new game!");
                isNewGame = true;
            }

            if (pgnMoves !== lastSentPGN) {
                lastSentPGN = pgnMoves;

                console.log(`Generated PGN: ${pgnMoves}`);
                fetch('http://localhost:3000/pgn', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ pgn: pgnMoves, color: playerColor })
                })
                .then(response => response.json())
                .then(data => {
                    console.log(`PGN sent to server. Response: ${JSON.stringify(data)}`);
                })
                .catch(error => {
                    console.error(`Error sending PGN to server: ${error}`);
                });

                // Reset the isNewGame flag after processing
                if (isNewGame) {
                    isNewGame = false;
                }
            }

            // Update the lastMoveCount
            lastMoveCount = currentMoveCount;
        }
    }
};


const setupMoveListObserver = (moveList) => {
    console.log('Setting up move list observer...');    
    new MutationObserver(handleMoveListChange).observe(moveList, { childList: true, subtree: true });
};

const watchForMoveListAppearance = () => {
    console.log('Checking for move list appearance...');
    checkPlayerColor();
    const parentContainer = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6');
    
    if (parentContainer) {
        new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    let moveList = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > l4x');
                    if (!moveList) {
                        moveList = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > div.col1-moves > l4x');
                    }
                    if (moveList) {
                        observer.disconnect();  // Disconnect this observer once the move list appears
                        setupMoveListObserver(moveList);
                    }
                }
            }
        }).observe(parentContainer, { childList: true });
    }
};

const handleMainObservation = (mutationsList, mainObserver) => {
    console.log('Main observation callback triggered.');
    for (let mutation of mutationsList) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            console.log('Node added to main.');
            for (let node of mutation.addedNodes) {
                if (node.querySelector && node.querySelector('div.round__app.variant-standard')) {
                    console.log('Game in progress detected.');
                    // Do not disconnect the main observer anymore
                    watchForMoveListAppearance();
                    break;
                }
            }
        }
    }
};

const startObservingGameProgress = () => {
    const mainObservationTarget = document.querySelector('#main-wrap > main');
    console.log('Main observation target:', mainObservationTarget);
    
    if (mainObservationTarget) {
        console.log('Main observation target found. Starting observation...');
        new MutationObserver(handleMainObservation).observe(mainObservationTarget, { childList: true, subtree: true });
    }
};

function gameInProgressButNoMovesYet() {
    const gameInProgress = document.querySelector('div.round__app.variant-standard');
    let moveList = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > l4x');
    if (!moveList) {
        moveList = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > div.col1-moves > l4x');
    }
    return gameInProgress && !moveList;
}

function initializeObservers() {
    // Before starting observation, check if a game is already in progress
    if (gameInProgressButNoMovesYet()) {
        console.log('Game already in progress upon loading extension, but no move list yet.');
        watchForMoveListAppearance();
    } else if (document.querySelector('div.round__app.variant-standard')) {
        console.log('Game already in progress upon loading extension.');
        let moveList = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > l4x');
        if (!moveList) {
            moveList = document.querySelector('#main-wrap > main > div.round__app.variant-standard > rm6 > div.col1-moves > l4x');
        }
        if (moveList) {
            setupMoveListObserver(moveList);
        } else {
            console.error('Expected move list not found.');
        }
    } else {
        console.log('Starting main observation...');
        startObservingGameProgress();
    }
}

initializeObservers();