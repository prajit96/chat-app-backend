const express = require('express');
require('dotenv').config();
const Chat = require('./models/Chat');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const authenticateUser = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // You can restrict this to your frontend's URL later
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/contacts', authenticateUser, contactRoutes);
app.use('/api/chats', authenticateUser, chatRoutes);
app.use('/api/users', userRoutes);

// Connect DB
connectDB();

// Socket.IO Setup
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on('sendMessage', (message) => {
    const chatId = message.chatId;
    socket.broadcast.to(chatId).emit('receiveMessage', message);
    console.log(`Message sent to chat: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));