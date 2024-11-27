const express = require('express');
const Chat = require('../models/Chat');
const authenticateUser = require('../middleware/authMiddleware');

const router = express.Router();

// Get all chats for the logged-in user
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

// Get messages with a specific contact
router.get('/:contactId', authenticateUser, async (req, res) => {
  const { contactId } = req.params;

  try {
    const chat = await Chat.findOne({
      contactId: { $all: [req.user.id, contactId] }, // Two-way match
    }).populate({
      path: 'messages.sender',
      select: 'username', // Include only the username field
    });
    // console.log('Populated chat:', JSON.stringify(chat, null, 2));
    if (!chat) {
      return res.json({ messages: [] });
    }

    res.json({ messages: chat.messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send a message to a specific contact
router.post('/:contactId/messages', authenticateUser, async (req, res) => {
  const { contactId } = req.params;
  const { text } = req.body;
  const sender = req.user.id;

  if (!text || !sender) {
    return res.status(400).json({ message: 'Text and sender are required' });
  }

  try {
    let chat = await Chat.findOne({
      contactId: { $all: [sender, contactId] },
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

    // Populate `sender` field for the newly added message
    const populatedMessage = await Chat.findOne({
      _id: chat._id,
    })
      .populate('messages.sender', 'username')
      .then((result) => result.messages.pop()); // Fetch the latest message

    res.json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});


module.exports = router;
