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
    origin: "*", 
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

// Socket.io
io.on('connection', (socket) => {
  console.log('New client connected');

  // for messages
  socket.on('sendMessage', async ({ contactId, text, sender }) => {
    if (!text || !sender || !contactId) {
      console.error('Missing required fields: sender, text, or contactId');
      return;
    }

    const message = { text, sender, timestamp: new Date() };

    // Find the chat between the sender and the contact
    let chat = await Chat.findOne({ contactId: { $in: [sender, contactId] } });

    if (!chat) {
      // Create a new chat if it doesn't exist
      const newChat = new Chat({
        contactId: [sender, contactId],
        messages: [message],
      });
      await newChat.save();
    } else {
      // Add the message to the existing chat
      chat.messages.push(message);
      await chat.save();
    }

    // Emit the message to the recipient
    io.emit('receiveMessage', { contactId, message });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
