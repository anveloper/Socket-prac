import http from 'http';
import SocketIO from 'socket.io';
import express from 'express';

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const PORT = 3000;

const server = http.createServer(app);
const io = SocketIO(server);

io.on("connection", socket => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  })
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  })
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  })
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  })
})

const handleListen = (port) => console.log(`Listening on.. http://localhost:${port}`);
server.listen(PORT, handleListen(PORT));