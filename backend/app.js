const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

let amountOfPlayers = 0;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, '..', 'frontend'));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));


const ping = require('ping');

io.on('connection', (socket) => {
    console.log('a user connected');
    amountOfPlayers += 1;
    
    socket.on('screen refresh', (data) => {
        socket.broadcast.emit('player update', {
            id: socket.id,
            username: data.username,
            borderX: data.borderX,
            borderY: data.borderY,
            radius: data.radius
        });
        console.log(data);
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
        socket.broadcast.emit('disconnection', socket.id);
        amountOfPlayers -= 1;
    });
});

async function checkPing() {
    const host = 'google.com';
    const res = await ping.promise.probe(host, {
        timeout: 10,
    });

    return res;
}

app.get('/', async (req, res) => {
    const pingStatus = await checkPing();
    res.render('home', {ping: pingStatus.time.toFixed(2), numOnline: amountOfPlayers });
});

app.get('/game', (req, res) => {
    res.render('game');
});

server.listen(3000, () => console.log('Server is up and running on localhost:3000'));
