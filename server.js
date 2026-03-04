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

// Serve master page
app.get("/master", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "master.html"));
});

var connectedUsers = {};

// Mixer state: 24 channels, each with cut (toggle), aux1-4 (momentary)
var mixerState = {};
for (var i = 1; i <= 24; i++) {
  mixerState[i] = {
    cut: false,
    aux1: false,
    aux2: false,
    aux3: false,
    aux4: false
  };
}

io.on("connection", function (socket) {
  console.log("User connected: " + socket.id);

  socket.emit("users-update", Object.values(connectedUsers));

  socket.on("join", function (userId) {
    connectedUsers[socket.id] = userId;
    console.log("User " + userId + " joined");
    io.emit("users-update", Object.values(connectedUsers));
    socket.emit("mixer-state", mixerState);
  });

  socket.on("join-master", function () {
    console.log("Master connected: " + socket.id);
    socket.emit("mixer-state", mixerState);
  });

  socket.on("cut-toggle", function (channel) {
    mixerState[channel].cut = !mixerState[channel].cut;
    io.emit("cut-update", { channel: channel, state: mixerState[channel].cut });
  });

  socket.on("aux-down", function (data) {
    mixerState[data.channel][data.aux] = true;
    io.emit("aux-update", { channel: data.channel, aux: data.aux, state: true });
  });

  socket.on("aux-up", function (data) {
    mixerState[data.channel][data.aux] = false;
    io.emit("aux-update", { channel: data.channel, aux: data.aux, state: false });
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
