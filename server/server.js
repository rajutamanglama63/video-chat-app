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

const emailToSocketMapping = new Map();

io.on("connection", (socket) => {
  console.log("Socket connection established...");

  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    console.log("user: ", emailId, "joinedRoom: ", roomId);

    emailToSocketMapping.set(emailId, socket.id);

    socket.join(roomId);

    // room joined successfully to roomId which client provide from frontend
    socket.emit("joined-room", { roomId });

    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
