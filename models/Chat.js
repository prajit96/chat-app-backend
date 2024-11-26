const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = mongoose.Schema({
  contactId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [messageSchema],
});

module.exports = mongoose.model('Chat', chatSchema);
