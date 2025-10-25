const { Server } = require('socket.io');

let io;
function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id);

    socket.on('join-room', ({ room }) => {
      socket.join(room);
    });

    socket.on('chat-message', ({ room, message }) => {
      // broadcast message to room
      io.to(room).emit('chat-message', { id: socket.id, message });
    });

    socket.on('game-action', ({ room, action }) => {
      // relay game actions to room participants
      io.to(room).emit('game-action', { id: socket.id, action });
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected:', socket.id);
    });
  });
}

module.exports = { initSocket };
