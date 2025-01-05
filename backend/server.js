const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require("socket.io");
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());

const mongoURI = process.env.MONGO_URI;
// console.log(mongoURI);
//  mongoose.connect(mongoURI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");  // SUCCESS LOG ADDED HERE
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
  let onlineUsers = {};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`);
        onlineUsers[data.sender] = true; // Mark user as online when they join
         io.to(data.room).emit("update_online_users", onlineUsers);
    });

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
    socket.on("typing", (data) => { // New "typing" event handler
        socket.to(data.room).emit("user_typing", data);
    });
});

app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));