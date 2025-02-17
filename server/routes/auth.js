// server/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Registrazione
router.post('/register', async (req, res) => {
  const { username, password, fullName } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if(existingUser) return res.status(400).json({ message: 'Utente già esistente' });
    
    const newUser = new User({ username, password, fullName });
    await newUser.save();
    res.status(201).json({ message: 'Registrazione avvenuta con successo', user: newUser });
  } catch(err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if(!user) return res.status(400).json({ message: 'Credenziali non valide' });
    const isMatch = await user.comparePassword(password);
    if(!isMatch) return res.status(400).json({ message: 'Credenziali non valide' });
    res.json({ message: 'Login effettuato', user });
  } catch(err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
