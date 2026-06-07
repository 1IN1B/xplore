const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
}));

app.get("/health", (req, res) => res.send("OK"));

const port = process.env.PORT;
if (!port) {
  throw new Error("PORT environment variable is required");
}
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust this to your Next.js URL for security
    methods: ["GET", "POST"],
  },
});

// Sockets & Signaling Logic
let waitingUsers = [];
const socketRoomMap = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", () => {
    if (waitingUsers.length > 0) {
      const partnerSocket = waitingUsers.pop();

      if (partnerSocket.id === socket.id) {
        waitingUsers.push(socket);
        return;
      }

      const roomId = `${partnerSocket.id}#${socket.id}`;
      socket.join(roomId);
      partnerSocket.join(roomId);

      socketRoomMap.set(socket.id, roomId);
      socketRoomMap.set(partnerSocket.id, roomId);

      socket.emit("chat-start", { roomId, initiator: false });
      partnerSocket.emit("chat-start", { roomId, initiator: true });
    } else {
      waitingUsers.push(socket);
      socket.emit("waiting");
    }
  });

  socket.on("signal", (data) => {
    socket.to(data.roomId).emit("signal", data.signal);
  });

  socket.on("message", (data) => {
    socket.to(data.roomId).emit("message", data.message);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    waitingUsers = waitingUsers.filter((user) => user.id !== socket.id);

    const roomId = socketRoomMap.get(socket.id);
    if (roomId) {
      io.to(roomId).emit("user-disconnected");
      socketRoomMap.delete(socket.id);
    }
  });
});

httpServer.listen(port, () => {
  console.log(`> Socket server ready on http://localhost:${port}`);
});
