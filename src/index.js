const path = require("path");
const http = require("http");

const express = require("express");
const sockio = require("socket.io");
const Filter = require("bad-words");

const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeAUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

/*
//create a raw http server (the express framework does this behind the scene, we only do this for socket.io functionality[when express implicitly creates the server behind the scene, we dont have access to pass it so the socketio call])
const server = http.createServer(app);
const io = sockio(server);

//load the client-side of the socket.io library into index.html using the script tag to enable our client-side js have access to all the stuff from the socket.io library it needs to set up effective communication

let count = 0;

//1.use io to create an event listener for whenever a new connection is established by a client with the socket.io server
io.on("connection", socket => {
  console.log("New WebSocket connection");
  
  //2. emit the countUpdated event with the current count data to a specific connected client (we dont use io to emit to all clients connected coz that means whenever a new client connects to the server then the cb func of io.on exeutes again, then the count is sent to both the old connected client(s) and the new. This is not desired as the count should only be emitted to the newly connected client).
  socket.emit("countUpdated", count);
  
  //2. listen for an increment event that sent from the client. When such event is received the cb func runs and its code executed
  socket.on("increment", () => {
    count++;
    //3. emit the countUpdated event with the updated count data to all connected clients as the count is changed and all connected clients should be notified
    io.emit("countUpdated", count);
  });
});
*/

const server = http.createServer(app);
const io = sockio(server);

io.on("connection", socket => {
  //socket.id is the unique id for a particular connection between the server and a connected client
  const userId = socket.id;

  socket.on("join", ({ username, room }, feedback) => {
    const { error, newUser } = addUser({ id: userId, username, room });
    if (error) {
      return feedback(error);
    }

    //if the code gets here, then the username and room data received from the sender client are valid
    socket.join(newUser.room); //socket.join method can only be used on the server

    //emit a message event to the newly connected client in a room
    socket.emit("message", generateMessage("Admin", "Welcome!"));

    //emit a message event to only the clients connected to a room aside the current client
    socket.broadcast
      .to(newUser.room)
      .emit(
        "message",
        generateMessage("Admin", `${newUser.username} has joined!`)
      );

    //emit a roomData event to everyone in a room including the newly added user
    io.to(newUser.room).emit("roomData", {
      room: newUser.room,
      users: getUsersInRoom(newUser.room),
    });

    //feedback of no error
    feedback();
  });

  //listen for sendMessage event to be received by the server and emit message to all connected clients in the room
  socket.on("sendMessage", (message, feedback) => {
    const user = getUser(userId);

    const filter = new Filter();

    if (filter.isProfane(message)) {
      return feedback("No profanity allowed!");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));

    //a cb func called to acknowlege the event sent from the client (great use case: validation) has been duly received by the server and in most cases provide a feedback to the emitter/sender
    feedback();
  });

  socket.on("sendLocation", (location, feedback) => {
    const user = getUser(userId);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${location.lat},${location.long}`
      )
    );
    feedback();
  });

  //listen for when the current connected client get disconnected then remove such user and emit message event to the other clients still connected in the room
  socket.on("disconnect", () => {
    const removedUser = removeAUser(userId);

    if (removedUser) {
      io.to(removedUser.room).emit(
        "message",
        generateMessage("Admin", `${removedUser.username} has left!`)
      );

      io.to(removedUser.room).emit("roomData", {
        room: removedUser.room,
        users: getUsersInRoom(removedUser.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});
