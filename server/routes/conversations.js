const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  
  try {
    // Trova tutti i messaggi che coinvolgono l'utente
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipients: userId }
      ]
    }).sort({ createdAt: -1 });
    
    // Raggruppa i messaggi per conversazione (supponiamo chat 1-to-1)
    const conversationsMap = {};
    messages.forEach(msg => {
      let partnerId;
      if (msg.sender.toString() === userId) {
        // Assumiamo che ci sia un solo destinatario
        partnerId = msg.recipients[0].toString();
      } else {
        partnerId = msg.sender.toString();
      }
      if (!conversationsMap[partnerId]) {
        conversationsMap[partnerId] = msg;
      }
    });
    
    const conversations = Object.keys(conversationsMap).map(partnerId => ({
      partnerId,
      lastMessage: conversationsMap[partnerId]
    }));
    
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
