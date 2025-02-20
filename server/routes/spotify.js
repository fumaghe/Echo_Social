// server/routes/spotify.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
require('dotenv').config();
const User = require('../models/User');
const ListenedTrack = require('../models/ListenedTrack');
const getArtistsGenres = require('../utils/getArtistsGenres');

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

// Token client_credentials
async function getSpotifyTokenClientCreds() {
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    qs.stringify({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      }
    }
  );
  return response.data.access_token;
}

// Refresh dell'access token utente
async function refreshAccessToken(refreshToken) {
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      }
    }
  );
  return response.data;
}

// ======================
// Ricerca brani
// ======================
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const token = await getSpotifyTokenClientCreds();
    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        q: query,
        type: 'track',
        limit: 5
      }
    });
    res.json(searchResponse.data);
  } catch (error) {
    console.error('Errore in /api/spotify/search:', error.response?.data || error.message);
    res.status(500).json({ error: 'Errore interno' });
  }
});

// ======================
// Now playing: salva con generi, evita duplicati ravvicinati, incrementa count
// ======================
router.get('/nowplaying', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Manca userId' });
    }
    let user = await User.findById(userId);
    if (!user || !user.spotifyAccessToken) {
      return res.status(404).json({ error: 'Utente non trovato o non autenticato con Spotify' });
    }

    console.log('spotify.js -> nowplaying -> user._id:', user._id);

    // 1) Chiamata now playing
    let nowPlayingRes;
    try {
      nowPlayingRes = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${user.spotifyAccessToken}`
        }
      });
    } catch (err) {
      // 401 -> token scaduto, refresh
      if (err.response && err.response.status === 401 && user.spotifyRefreshToken) {
        console.log('Access token scaduto, provo il refresh...');
        const refreshed = await refreshAccessToken(user.spotifyRefreshToken);
        user.spotifyAccessToken = refreshed.access_token;
        if (refreshed.refresh_token) {
          user.spotifyRefreshToken = refreshed.refresh_token;
        }
        await user.save();

        // riprova
        nowPlayingRes = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: { 'Authorization': `Bearer ${user.spotifyAccessToken}` }
        });
      } else {
        if (err.response && (err.response.status === 404 || err.response.status === 204)) {
          return res.json({ currentlyPlaying: null });
        }
        console.error('Errore in /api/spotify/nowplaying:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Errore interno' });
      }
    }

    // Se non ci sono dati, nessun brano in riproduzione
    if (!nowPlayingRes || nowPlayingRes.status === 204 || !nowPlayingRes.data) {
      return res.json({ currentlyPlaying: null });
    }

    // 2) Estrai i dati del brano
    const trackData = nowPlayingRes.data.item;
    const trackId = trackData.id;
    const trackName = trackData.name;
    const artists = trackData.artists.map(a => a.name);
    const artistIds = trackData.artists.map(a => a.id);
    const albumName = trackData.album.name;
    const albumCoverUrl = trackData.album.images[0]?.url || '';

    // 3) Recupero generi
    let genres = [];
    try {
      genres = await getArtistsGenres(user.spotifyAccessToken, artistIds);
    } catch (gErr) {
      console.error('Errore nel recupero generi:', gErr);
    }

    // 4) Gestione ascolto e controllo duplicati ravvicinati (4 minuti)
    const now = new Date();
    const threeMinAgo = new Date(now.getTime() - 4 * 60 * 1000);

    let listenedDoc = await ListenedTrack.findOne({ user: user._id, trackId });
    if (listenedDoc) {
      // Controlla se l'ultimo ascolto è avvenuto da meno di 3 minuti
      const lastListenDate = listenedDoc.listenedDates[listenedDoc.listenedDates.length - 1];
      if (lastListenDate && lastListenDate > threeMinAgo) {
        console.log('Ascolto ravvicinato, non incremento');
      } else {
        listenedDoc.count += 1;
        listenedDoc.listenedDates.push(now);
        // Se desideri aggiornare anche i generi, decommenta la linea seguente:
        // listenedDoc.genres = genres;
        await listenedDoc.save();
        console.log('Ascolto incrementato di', trackName);
      }
    } else {
      // Nessun documento esistente: crea il primo ascolto
      listenedDoc = await ListenedTrack.create({
        user: user._id,
        trackId,
        trackName,
        artists,
        albumName,
        albumCoverUrl,
        genres,
        count: 1,
        listenedDates: [now]
      });
      console.log('Salvato primo ascolto di', trackName);
    }

    return res.json({ currentlyPlaying: nowPlayingRes.data });
  } catch (error) {
    console.error('Errore in /api/spotify/nowplaying:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Errore interno nel recupero del brano in riproduzione' });
  }
});

// ======================
// Salva brano nella libreria
// ======================
router.post('/saveTrack', async (req, res) => {
  try {
    const { userId, trackId } = req.body;
    if (!userId || !trackId) {
      return res.status(400).json({ error: 'userId e trackId sono richiesti' });
    }
    const user = await User.findById(userId);
    if (!user || !user.spotifyAccessToken) {
      return res.status(404).json({ error: 'Utente non trovato o non autenticato con Spotify' });
    }

    // Salvataggio su Spotify
    await axios.put(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, null, {
      headers: {
        'Authorization': `Bearer ${user.spotifyAccessToken}`
      }
    });
    res.json({ message: 'Traccia aggiunta ai preferiti' });
  } catch (error) {
    console.error('Errore in /api/spotify/saveTrack:', error.response?.data || error.message);
    res.status(500).json({ error: 'Errore interno nel salvataggio del brano' });
  }
});

module.exports = router;
