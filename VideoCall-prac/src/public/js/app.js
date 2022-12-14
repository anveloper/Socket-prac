const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label)
        option.selected = true;
      camerasSelect.appendChild(option);
    })
  } catch(e){
    console.log(e);
  }
};

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  }
  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? initialConstrains : cameraConstrains
    );
    myFace.srcObject = myStream;
    if(!deviceId)
      await getCameras()
  } catch(e){
    console.log(e);
  }
};

const handleMuteClick = () => {
  myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
};

const handleCameraOffClick = () => {
  myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
};

const handleCameraChange = async() => {
  await getMedia(camerasSelect.value)
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find(sender => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
};

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraOffClick);
camerasSelect.addEventListener("input", handleCameraChange);


// Welcome

const welcome = document.getElementById("welcome");
const call = document.getElementById("call");

call.hidden = true;

const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
};

const handleWelcomeSubmit = async (e) => {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// socket

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
})

socket.on("offer", async offer => {
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", async answer => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
  myPeerConnection.addIceCandidate(ice);
})
// webRTC

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [{
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ]
    }]
  });
  myPeerConnection.addEventListener("icecandidate", hadleIce);
  myPeerConnection.addEventListener("addstream", handleAddstream);
  myStream
    .getTracks()
    .forEach(track => {
      myPeerConnection.addTrack(track, myStream);
    });
}

const hadleIce = (data) => {
  socket.emit("ice",data.cadidate, roomName);
}

const handleAddstream = (data) => {
  const peersFace = document.getElementById("peersFace");
  peersFace.srcObject = data.stream;
  console.log(data.stream)  
}