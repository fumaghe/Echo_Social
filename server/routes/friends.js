// server/routes/friends.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');

// Invia richiesta di amicizia
router.post('/request', async (req, res) => {
  const { fromUserId, toUserId } = req.body;
  try {
    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(404).json({ message: 'Utente non trovato' });
    
    if (toUser.friends.includes(fromUserId)) {
      return res.status(400).json({ message: 'Siete già amici' });
    }
    if (toUser.friendRequests.includes(fromUserId)) {
      return res.status(400).json({ message: 'Richiesta già inviata' });
    }
    
    toUser.friendRequests.push(fromUserId);
    await toUser.save();

    // Crea una notifica per il destinatario
    const notif = new Notification({
      user: toUserId,
      message: 'Hai ricevuto una richiesta di amicizia.',
      type: 'friend_request'
    });
    await notif.save();

    res.json({ message: 'Richiesta di amicizia inviata' });
  } catch (err) {
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
    if (!user || !requester) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    if (!user.friendRequests.includes(fromUserId)) {
      return res.status(400).json({ message: 'Nessuna richiesta da questo utente' });
    }
    user.friends.push(fromUserId);
    requester.friends.push(userId);
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== fromUserId);
    
    await user.save();
    await requester.save();

    // Crea notifiche per entrambe le parti
    const notifForRequester = new Notification({
      user: fromUserId,
      message: `${user.username} ha accettato la tua richiesta di amicizia.`,
      type: 'friend_accept'
    });
    await notifForRequester.save();

    res.json({ message: 'Richiesta accettata' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Rimuovi amicizia
router.post('/remove', async (req, res) => {
  const { userA, userB } = req.body;
  try {
    const user1 = await User.findById(userA);
    const user2 = await User.findById(userB);
    if (!user1 || !user2) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    user1.friends = user1.friends.filter(id => id.toString() !== userB);
    user2.friends = user2.friends.filter(id => id.toString() !== userA);
    await user1.save();
    await user2.save();
    res.json({ message: 'Amicizia rimossa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Endpoint per verificare se due utenti sono amici
router.get('/isFriend', async (req, res) => {
  const { userA, userB } = req.query;
  try {
    const user = await User.findById(userA);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    const isFriend = user.friends.some(friendId => friendId.toString() === userB);
    res.json({ isFriend });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Ottieni richieste di amicizia
router.get('/requests/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('friendRequests', 'username fullName avatarUrl');
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user.friendRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Ottieni la lista di amici (questa rotta viene dopo /isFriend)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('friends', 'username fullName avatarUrl');
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user.friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
