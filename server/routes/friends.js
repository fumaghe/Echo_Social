// server/routes/friends.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Invia richiesta di amicizia
router.post('/request', async (req, res) => {
  const { fromUserId, toUserId } = req.body;
  try {
    const toUser = await User.findById(toUserId);
    if(!toUser) return res.status(404).json({ message: 'Utente non trovato' });
    
    if(toUser.friends.includes(fromUserId)) {
      return res.status(400).json({ message: 'Siete già amici' });
    }
    if(toUser.friendRequests.includes(fromUserId)) {
      return res.status(400).json({ message: 'Richiesta già inviata' });
    }
    
    toUser.friendRequests.push(fromUserId);
    await toUser.save();
    res.json({ message: 'Richiesta di amicizia inviata' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Accetta richiesta di amicizia
router.post('/accept', async (req, res) => {
  const { userId, fromUserId } = req.body;
  try {
    const user = await User.findById(userId);
    const requester = await User.findById(fromUserId);
    if(!user || !requester) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    if(!user.friendRequests.includes(fromUserId)) {
      return res.status(400).json({ message: 'Nessuna richiesta da questo utente' });
    }
    user.friends.push(fromUserId);
    requester.friends.push(userId);
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== fromUserId);
    
    await user.save();
    await requester.save();
    res.json({ message: 'Richiesta accettata' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Ottieni richieste di amicizia
router.get('/requests/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('friendRequests', 'username fullName avatarUrl');
    if(!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user.friendRequests);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Ottieni la lista di amici
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('friends', 'username fullName avatarUrl');
    if(!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user.friends);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
