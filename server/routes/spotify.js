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

/**
 * Token client_credentials per /search
 */
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

/**
 * Refresh dell'access token utente
 */
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
// Now playing: salva con generi, evita duplicati ravvicinati,
// e incrementa count e listenedDates
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

    // 1) Chiamata now playing
    let nowPlayingRes;
    try {
      nowPlayingRes = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${user.spotifyAccessToken}`
        }
      });
    } catch (err) {
      // 401 -> token scaduto, provo refresh
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
          headers: {
            'Authorization': `Bearer ${user.spotifyAccessToken}`
          }
        });
      } else {
        // Altri errori (404, 204, etc.)
        if (err.response && (err.response.status === 404 || err.response.status === 204)) {
          return res.json({ currentlyPlaying: null });
        }
        console.error('Errore in /api/spotify/nowplaying:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Errore interno' });
      }
    }

    // Se comunque non abbiamo dati => nessun brano
    if (!nowPlayingRes || nowPlayingRes.status === 204 || !nowPlayingRes.data) {
      return res.json({ currentlyPlaying: null });
    }

    // 2) Estraggo i dati
    const trackData = nowPlayingRes.data.item;
    const trackId = trackData.id;
    const trackName = trackData.name;
    // Array di artisti "nome"
    const artists = trackData.artists.map(a => a.name);
    // Array di artisti "id", ci serve per prendere i generi
    const artistIds = trackData.artists.map(a => a.id);
    const albumName = trackData.album.name;
    const albumCoverUrl = trackData.album.images[0]?.url || '';

    // 3) Recupero i generi da tutti gli artisti (unione)
    let genres = [];
    try {
      genres = await getArtistsGenres(user.spotifyAccessToken, artistIds);
    } catch (gErr) {
      console.error('Errore nel recupero generi:', gErr);
    }

    // 4) Trova se esiste già un doc con (user, trackId)
    let listenedDoc = await ListenedTrack.findOne({ user: user._id, trackId }).sort({ _id: -1 });

    // 5) Se già esiste, controlla duplicato negli ultimi 2 minuti
    const now = new Date();
    const twoMinAgo = new Date(now.getTime() - 3 * 60 * 1000);

    if (!listenedDoc) {
      // Primo ascolto
      listenedDoc = new ListenedTrack({
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
      await listenedDoc.save();

    } else {
      // Esiste già => controlla ultima data
      // Se la ultima data di listenedDates è più recente di 2 min, non incrementiamo
      const lastListenDate = listenedDoc.listenedDates.length
        ? listenedDoc.listenedDates[listenedDoc.listenedDates.length - 1]
        : null;

      if (lastListenDate && lastListenDate > twoMinAgo) {

      } else {
        // Aggiorniamo count, push data
        listenedDoc.count += 1;
        listenedDoc.listenedDates.push(now);

        // Eventualmente aggiorna i generi se vuoi (o lasciali se preferisci)
        // listenedDoc.genres = genres; 

        await listenedDoc.save();

      }
    }

    // Restituisci i dati
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
