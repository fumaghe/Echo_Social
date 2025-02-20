const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET: Recupera le notifiche per un utente, ordinate dal più recente al meno recente
router.get('/', async (req, res) => {
  const { userId } = req.query;
  try {
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// POST: Crea una nuova notifica
router.post('/', async (req, res) => {
  const { user, message, type, partnerId } = req.body;
  try {
    const notification = new Notification({ user, message, type, partnerId });
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// PATCH: Marca tutte le notifiche come lette per un utente
router.patch('/mark-read', async (req, res) => {
  const { userId } = req.body;
  try {
    await Notification.updateMany({ user: userId, read: false }, { read: true });
    res.json({ message: 'Notifiche marcate come lette' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
