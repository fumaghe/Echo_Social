// server/utils/getArtistsGenres.js
const axios = require('axios');

/**
 * Ottiene un array con i generi di tutti gli artisti passati.
 * @param {string} accessToken - Il token Spotify dell'utente.
 * @param {string[]} artistIds - Array di ID di artisti.
 * @returns {Promise<string[]>} - Array di generi uniti.
 */
async function getArtistsGenres(accessToken, artistIds) {
  if (!artistIds || artistIds.length === 0) {
    return [];
  }
  try {
    // /v1/artists?ids=id1,id2,id3
    const idsParam = artistIds.join(',');
    const response = await axios.get(`https://api.spotify.com/v1/artists?ids=${idsParam}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    // response.data.artists è un array
    const allArtists = response.data.artists || [];
    // unisci tutti i generi
    const allGenres = new Set();
    for (const artist of allArtists) {
      (artist.genres || []).forEach(g => allGenres.add(g));
    }
    return Array.from(allGenres);
  } catch (error) {
    console.error('Errore getArtistsGenres:', error.response?.data || error.message);
    return [];
  }
}

module.exports = getArtistsGenres;
