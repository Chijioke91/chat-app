const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const Filter = require('bad-words');
const {
  generateMessage,
  generateLocationMessage
} = require('./utils/messages');

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

const io = socketio(server);

app.use(express.static('public'));

io.on('connection', socket => {
  console.log('New connection established');

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'welcome!'));

    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('Admin', `${user.username} just joined ${user.room}`)
      );

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  });

  socket.on('sendLocation', ({ longitude, latitude }, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${latitude},${longitude}`
      )
    );
    callback('Location shared');
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} has left`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, console.log(`server is up on port ${port}`));
