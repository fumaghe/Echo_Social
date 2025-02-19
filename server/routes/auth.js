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
 * GET /api/auth/spotify
 * Reindirizza l'utente alla pagina di autorizzazione di Spotify.
 * Aggiungi le scope necessarie per leggere e salvare brani, e vedere il now playing.
 */
router.get('/spotify', (req, res) => {
  const scopes = [
    'user-read-email',
    'user-read-private',
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-library-modify', // per aggiungere brani alla libreria
  ];
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: scopes.join(' ')
  });
  // reindirizza a Spotify
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

/**
 * GET /api/auth/spotify/callback
 * Riceve il 'code' da Spotify, scambia il code per i token e crea/aggiorna l'utente.
 * Al termine, reindirizza al frontend includendo l'ID dell'utente nella query string.
 */
router.get('/spotify/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Manca il code di Spotify' });
  
  try {
    // Scambia il code con i token
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
    const { access_token, refresh_token } = tokenRes.data;

    // Recupera i dati dell'utente da Spotify (profile)
    const userProfileRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const spotifyId = userProfileRes.data.id;
    const spotifyEmail = userProfileRes.data.email || 'unknown@spotify.com';
    const displayName = userProfileRes.data.display_name || 'Senza Nome';

    // Cerca l'utente tramite spotifyId. Se non esiste, lo crea.
    let user = await User.findOne({ spotifyId });
    if (!user) {
      user = new User({
        username: spotifyEmail,
        fullName: displayName,
        password: 'spotify-login', // placeholder
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

    // Redirect al frontend (puoi cambiare la query a piacere)
    res.redirect(`${process.env.FRONTEND_URL}/?spotifyLogin=success&userId=${user._id}`);
  } catch (err) {
    console.error('Errore callback Spotify:', err);
    res.redirect(`${process.env.FRONTEND_URL}/?spotifyLogin=error`);
  }
});

/**
 * GET /api/auth/me
 * Ritorna i dati dell'utente in base a userId passato come query param.
 */
router.get('/me', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(401).json({ message: 'Non autenticato' });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
