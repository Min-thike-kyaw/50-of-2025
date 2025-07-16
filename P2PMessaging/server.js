const ws = require('ws');
const express = require('express');
const http = require('http');


const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ port: 3001 });

app.use(express.static('public'));

const clients = new Map();
console.log("WebSocket server started on ws://localhost:3001");
wss.on('connection', (ws) => {
    const clientId = generateId()
    clients.set(clientId, ws);
    console.log('New client connected');
    console.log(`Total clients connected: ${clients.size}`);

    // Send the client their own ID
    ws.send(JSON.stringify({
        type: 'your-id',
        data: clientId
    }));

    // Broadcast the updated peer list to all clients
    broadcastPeerList()

    ws.on('message', (message) => {
        console.log(`Server Received message: ${message}`);
        const parsedMessage = JSON.parse(message);
        // Broadcast the message to all connected clients
        clients.forEach((client, key) => {
            if (client !== ws && client.readyState === 1 && parsedMessage.target == key) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        clients.delete(clientId);
        console.log("Client disconnected.");
    });
})

const broadcastPeerList = () => {
    const peerList = Array.from(clients.keys())
    const message = JSON.stringify({
        type: 'peer-list',
        data: peerList
    });
    clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(message);
        }
    });
}

const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
}

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
