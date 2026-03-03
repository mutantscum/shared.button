var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

var app = express();
var server = http.createServer(app);
var io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, "public")));

var buttonState = false;
var connectedUsers = {};

io.on("connection", function (socket) {
  console.log("User connected: " + socket.id);

  socket.on("join", function (userId) {
    connectedUsers[socket.id] = userId;
    console.log("User " + userId + " joined");
    io.emit("users-update", Object.values(connectedUsers));
    socket.emit("button-state", buttonState);
  });

  socket.on("button-down", function () {
    buttonState = true;
    socket.broadcast.emit("button-state", true);
  });

  socket.on("button-up", function () {
    buttonState = false;
    socket.broadcast.emit("button-state", false);
  });

  socket.on("disconnect", function () {
    var userId = connectedUsers[socket.id];
    if (userId) {
      console.log("User " + userId + " disconnected");
    }
    delete connectedUsers[socket.id];
    io.emit("users-update", Object.values(connectedUsers));
  });
});

var PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
  console.log("Server running on port " + PORT);
});
