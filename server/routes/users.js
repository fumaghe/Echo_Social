// server/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Ricerca utenti (username o fullName)
router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { username: regex },
        { fullName: regex }
      ]
    });
    res.json(users);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Ottieni utente per ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
