const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.post('/pgn', (req, res) => {
    const pgn = req.body.pgn;
    const color = req.body.color || 'white';  // default to 'white' if no color provided
    console.log('Received PGN:', pgn);
    console.log('Player Color:', color);

    // Emit the new PGN and color to any connected clients
    io.emit('pgn_update', { pgn, color });

    res.json({ status: 'success', message: 'PGN received' });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
