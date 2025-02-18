// server/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const axios = require('axios');
require('dotenv').config();

// Registrazione classica
router.post('/register', async (req, res) => {
  const { username, password, fullName } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Utente già esistente' });
    
    const newUser = new User({ username, password, fullName });
    await newUser.save();
    res.status(201).json({ message: 'Registrazione avvenuta con successo', user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Login classico
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Credenziali non valide' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Credenziali non valide' });
    res.json({ message: 'Login effettuato', user });
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

/**
 * 1) GET /api/auth/spotify
 *    Reindirizza l'utente alla pagina di autorizzazione di Spotify
 */
router.get('/spotify', (req, res) => {
  const scopes = [
    'user-read-email',
    'user-read-private',
    // Se vuoi riprodurre brani, aggiungi scope come "streaming", "user-modify-playback-state", ecc.
  ];
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,  // es: "http://localhost:5000/api/auth/spotify/callback"
    scope: scopes.join(' '),
  });
  // reindirizza a https://accounts.spotify.com/authorize?client_id=...&...
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

/**
 * 2) GET /api/auth/spotify/callback
 *    Riceve 'code' da Spotify, scambia il code per un access token e crea/aggiorna l'utente
 */
router.get('/spotify/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Manca il code di Spotify' });
  
  try {
    // Scambia 'code' per token
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code.toString(),
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    // Ora recupera i dati dell'utente da Spotify
    const userProfileRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const spotifyId = userProfileRes.data.id;
    const spotifyEmail = userProfileRes.data.email || 'unknown@spotify.com';
    const displayName = userProfileRes.data.display_name || 'Senza Nome';

    // Se l'utente esiste già (ad es. via email o via un campo "spotifyId"), aggiorna
    let user = await User.findOne({ spotifyId });
    if (!user) {
      // Se non esiste, potresti controllare se esiste con quell'email, altrimenti creare un nuovo utente
      user = new User({
        username: spotifyEmail,  // o un naming a tua scelta
        fullName: displayName,
        password: 'spotify-login',  // un placeholder
        spotifyId,
        spotifyAccessToken: access_token,
        spotifyRefreshToken: refresh_token
      });
      await user.save();
    } else {
      // Aggiorna i token
      user.spotifyAccessToken = access_token;
      user.spotifyRefreshToken = refresh_token;
      await user.save();
    }

    // A questo punto l'utente è loggato con Spotify
    // reindirizza al frontend (ad es. "http://localhost:5173?spotify=ok")
    // Oppure restituisci un token JWT, dipende dalla tua logica
    res.redirect(`${process.env.FRONTEND_URL}/?spotifyLogin=success`);
  } catch (err) {
    console.error('Errore callback Spotify:', err);
    res.redirect(`${process.env.FRONTEND_URL}/?spotifyLogin=error`);
  }
});

module.exports = router;
