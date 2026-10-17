const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
});

io.on('disconnect', (socket) => {
    console.log('a user disconnected');
});

app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

server.listen(3000, () => console.log('Server is up and running on localhost:3000'));
