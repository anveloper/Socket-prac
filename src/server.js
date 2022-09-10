import http from "http";
import WebSocket from "ws";
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
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  console.log("Conneted to Browser");
  socket.on("close", () => console.log("Disconnected from the Browser"));
  socket.on("message", (message) => {
    sockets.forEach(s=>s.send(message.toString()));
  });
});

server.listen(PORT, handleListen(PORT));