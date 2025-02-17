// server/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Invia un messaggio
router.post('/', async (req, res) => {
  const { sender, recipients, content, songId } = req.body;
  try {
    const message = new Message({ sender, recipients, content, songId });
    await message.save();
    res.status(201).json({ message: 'Messaggio inviato', data: message });
  } catch(err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Ottieni i messaggi tra due utenti
router.get('/', async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, recipients: user2 },
        { sender: user2, recipients: user1 }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch(err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
