// server/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Ricerca utenti
router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    const regex = new RegExp(q, 'i');
    const users = await User.find({ $or: [{ username: regex }, { fullName: regex }] });
    res.json(users);
  } catch(err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Ottieni utente per id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user);
  } catch(err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Aggiorna profilo
router.put('/:id', async (req, res) => {
  const { fullName, bio, avatarUrl } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, bio, avatarUrl },
      { new: true }
    );
    if(!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user);
  } catch(err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
