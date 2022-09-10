import http from 'http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import express from 'express';

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const PORT = 3000;
const handleListen = (port) => console.log(`Listening on.. http://localhost:${port}`);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  }
});

instrument(io, {
  auth: false
});

const publicRooms = () => {
  const { sockets: { adapter: { sids, rooms } } } = io;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (!sids.get(key)) {
      publicRooms.push(key);
    }
  })
  return publicRooms;
};

const countRoom = (roomName) => {
  return io.sockets.adapter.rooms.get(roomName)?.size;
};

io.on("connection", socket => {
  socket["nickname"] = "none";
  socket.onAny((event) => {
    console.log(`SocketIO Event: ${event}`);
  });
  socket.on("enter_room", (roomName, nickname, done) => {    
    socket["nickname"] = nickname
    socket.join(roomName);   
    done(roomName, countRoom(roomName));
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    io.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach(room =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    io.sockets.emit("room_change", publicRooms());    
  })
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done(msg);
  });
  socket.on("nickname", nickname => socket["nickname"] = nickname);
});

server.listen(PORT, handleListen(PORT));