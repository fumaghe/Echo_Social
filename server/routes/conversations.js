const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipients: userId }
      ]
    }).sort({ createdAt: -1 });
    
    const conversationsMap = {};
    messages.forEach(msg => {
      let partnerId;
      if (msg.sender.toString() === userId) {
        partnerId = msg.recipients[0].toString();
      } else {
        partnerId = msg.sender.toString();
      }
      if (!conversationsMap[partnerId]) {
        conversationsMap[partnerId] = { lastMessage: msg, unreadCount: 0 };
      }
      // Se il messaggio è inviato dall'altro utente e non è letto, incrementa unreadCount
      if (msg.sender.toString() !== userId && !msg.read) {
        conversationsMap[partnerId].unreadCount++;
      }
    });
    
    const conversations = Object.keys(conversationsMap).map(partnerId => ({
      partnerId,
      lastMessage: conversationsMap[partnerId].lastMessage,
      unreadCount: conversationsMap[partnerId].unreadCount
    }));
    
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
