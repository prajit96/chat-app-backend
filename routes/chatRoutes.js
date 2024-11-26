const express = require('express');
const Chat = require('../models/Chat');
const authenticateUser = require('../middleware/authMiddleware');

const router = express.Router();

// Get all chats for the logged-in user //
router.get('/', authenticateUser, async (req, res) => {
  try {
    const chats = await Chat.find({
      contactId: { $in: [req.user.id] },
    });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

// Get messages with a specific contact //
router.get('/:contactId', authenticateUser, async (req, res) => {
  const { contactId } = req.params;

  try {
    const chat = await Chat.findOne({
      contactId: { $in: [req.user.id, contactId] },
    });

    if (!chat) {
      return res.json({ messages: [] });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Send a message to a specific contact //
router.post('/:contactId/messages', authenticateUser, async (req, res) => {
  const { contactId } = req.params;
  const { text } = req.body;
  const sender = req.user.id;

  if (!text || !sender) {
    return res.status(400).json({ message: "Text and sender are required" });
  }

  try {
    let chat = await Chat.findOne({
      contactId: { $in: [sender, contactId] },
    });

    const message = { sender, text, timestamp: new Date() };

    if (!chat) {
      chat = new Chat({
        contactId: [sender, contactId],
        messages: [message],
      });
    } else {
      chat.messages.push(message);
    }

    await chat.save();
    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;
