const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

const room = document.getElementById("room");
room.hidden = true;

let roomName = '';

const addMessage = (message) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
};

const handleSendMessage = (e) => {
  e.preventDefault();
  const input = room.querySelector("#message input");
  socket.emit("new_message", input.value, roomName, (msg) => {
    addMessage(`You: ${msg}`);    
    input.value = "";
  });  
};

const showRoom = (currentRoom, count) => {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${currentRoom} (${count})`;  
  roomName = currentRoom;
  const messageForm = room.querySelector("#message"); 
  messageForm.addEventListener("submit", handleSendMessage); 
};

const handleRoomSubmit = (e) => {
  e.preventDefault();
  const roomname = form.querySelector("#roomname").value;
  const nickname = form.querySelector("#nickname").value;
  socket.emit("enter_room", roomname, nickname, showRoom);
  roomname = "";
  nickname = "";
};

form.addEventListener("submit", handleRoomSubmit)

socket.on("welcome", (user, newCount) => {  
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} Join`);
})

socket.on("bye", (user, newCount)=> {  
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} Left`);
})

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerText = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach(room => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  })
})