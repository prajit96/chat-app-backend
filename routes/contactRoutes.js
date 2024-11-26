const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get all contacts (all users except the logged-in user) //
router.get('/', async (req, res) => {
  try {
    const contacts = await User.find({ _id: { $ne: req.user.id } }).select(
      'username email'
    );
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});

module.exports = router;
