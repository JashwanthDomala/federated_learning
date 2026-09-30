const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { handleConnection } = require('./src/orchestrator');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allows any frontend to connect (great for local testing)
        methods: ["GET", "POST"]
    }
});

// Bind WebSocket connections to the Orchestrator logic
io.on('connection', (socket) => {
    handleConnection(io, socket);
});

server.listen(3000, () => {
    console.log('Global Orchestrator running on port 3000');
});