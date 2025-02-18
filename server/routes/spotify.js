// server/routes/spotify.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
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

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const token = await getSpotifyToken();
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
    console.error('Errore in /api/spotify/search:', error);
    res.status(500).json({ error: 'Errore interno' });
  }
});

module.exports = router;
