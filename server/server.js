const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const audioRouter = require("./controllers/audio");

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

app.use("/api/audio", audioRouter);

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

    // before any user join specific room we will handle an event "user:joined" to that room so that everyone in that room get notified
    io.to(roomId).emit("user:joined", { emailId, id: socket.id });

    socket.join(roomId);

    // we are sending response to client by saying that you are allowed to join room after "join:room" event handled
    io.to(socket.id).emit("join:room", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:res:to:caller", ({ to, ans }) => {
    io.to(to).emit("notify:res:to:caller", { from: socket.id, ans });
  });

  socket.on("peer:negotiation:needed", ({ to, offer }) => {
    io.to(to).emit("incomming:peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:negotiation:done", ({ to, ans }) => {
    io.to(to).emit("peer:negotiation:final", { from: socket.id, ans });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
