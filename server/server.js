const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Create an HTTP server
const server = http.createServer(app);

// Attach the WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(cors());
app.get('/ping', (req, res) => {
    res.json({status: "Server Active"});
});

wss.on('connection', (ws) => {
    console.log('Client connected');
    // You might want to keep track of connected clients to broadcast to them later
});

app.post('/pgn', (req, res) => {
    const pgnData = req.body.pgn;
    console.log(`Received PGN: ${pgnData}`);

    // Broadcast the new PGN to all connected WebSocket clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ pgn: pgnData }));  // Use pgnData, not newPGN
        }
    });

    res.json({status: "Received", data: pgnData});
});

app.post('/flip', (req, res) => {
    // Broadcast the flip command to all connected WebSocket clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ action: "flipBoard" }));
        }
    });
    res.json({status: "Flip command received"});
});


server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
