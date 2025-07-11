const ws = require('ws');

const wss = new ws.Server({ port: 3001 });

let clients = []
console.log("WebSocket server started on ws://localhost:3001");
wss.on('connection', (ws) => {
    clients.push(ws);
    console.log('New client connected');
    console.log(`Total clients connected: ${clients.length}`);

    ws.on('message', (message) => {
        console.log(`Server Received message: ${message}`);
        // Broadcast the message to all connected clients
        clients.forEach(client => {
            console.log(`Sending message to client: ${client.readyState}`);
            if (client !== ws && client.readyState === 1) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        clients = clients.filter(c => c !== ws);
        console.log("Client disconnected.");
    });
})