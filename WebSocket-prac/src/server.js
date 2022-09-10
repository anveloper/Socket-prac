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
  socket["nickname"] = "none";
  socket.on("close", () => console.log("Disconnected from the Browser"));
  socket.on("message", (message) => {
    const { type, payload } = JSON.parse(message);
    console.log(type, payload);
    switch (type) {
      case "new_message":
        sockets.forEach(s => s.send(`${socket.nickname}: ${payload}`));
        break;
      case "nickname":
        socket["nickname"] = payload;
        break;
    } 
  });
});

server.listen(PORT, handleListen(PORT));