const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const e = require('express');
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  const searchingSockets = Array.from(
    io.of('/').adapter.rooms.get('searching') || []
  );
  io.emit('users', io.of('/').sockets.size);

  if (searchingSockets.length >= 1) {
    const roomID = socket.id + searchingSockets[0];
    socket.to(searchingSockets[0]).emit('found', roomID);
    socket.emit('found', roomID);
  } else {
    socket.join('searching');
  }

  socket.on('join', (roomID) => {
    socket.leave('searching');
    socket.join(roomID);
  });

  socket.on('choice', (data) => {
    socket.broadcast.to(data.roomID).emit('choice', data.choice);
  });

  socket.on('disconnecting', (reason) => {
    const rooms = Array.from(socket.rooms);
    const gameRoom = rooms.find((room) => room.length > 20);
    socket.to(gameRoom).emit('opponentLeft');
    console.log(gameRoom);
  });

  socket.on('disconnect', (socket) => {
    console.log('socket disconnected', io.of('/').sockets.size);
    io.emit('users', io.of('/').sockets.size);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
