const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Hello from the server side...");
});

// this line of code is for tracking which emailId is in which room
const emailToSocketMapping = new Map();
const socketidToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("Socket connection established...");

  socket.on("join:room", (data) => {
    const { roomId, emailId } = data;
    console.log("user: ", emailId, "joinedRoom: ", roomId);

    emailToSocketMapping.set(emailId, socket.id);
    socketidToEmailMapping.set(socket.id, emailId);

    // we are sending response to client by saying that you are allowed to join room after "join:room" event handled
    io.to(socket.id).emit("join:room", data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
