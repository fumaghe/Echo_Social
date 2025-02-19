// server/routes/stats.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ListenedTrack = require('../models/ListenedTrack');

/**
 * GET /api/stats/listening?userId=<idUtente>
 * Restituisce debug plus dati di aggregazione, così puoi loggarli nel client.
 */
router.get('/listening', async (req, res) => {
  try {
    const { userId } = req.query;

    // Se manca userId
    if (!userId) {
      return res.status(400).json({ error: 'Manca userId' });
    }

    // Converto userId in ObjectId
    let matchId;
    try {
      matchId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({ error: 'userId non valido come ObjectId' });
    }

    // Faccio un find per vedere i doc
    const foundDocs = await ListenedTrack.find({ user: matchId });
    // Mappo i doc per esportarli in debug
    const mappedDocs = foundDocs.map(doc => ({
      _id: doc._id,
      user: doc.user,
      trackId: doc.trackId,
      trackName: doc.trackName,
      artists: doc.artists,
      albumName: doc.albumName,
      albumCoverUrl: doc.albumCoverUrl,
      genres: doc.genres,
      count: doc.count,
      listenedDates: doc.listenedDates,
      createdAt: doc.createdAt,
    }));

    // Aggregazione per topTracks
    const topTracks = await ListenedTrack.aggregate([
      { $match: { user: matchId } },
      {
        $group: {
          _id: '$trackId',
          trackName: { $first: '$trackName' },
          totalCount: { $sum: '$count' },
        },
      },
      { $sort: { totalCount: -1 } },
      { $limit: 5 },
    ]);

    // Aggregazione per topArtists
    const topArtists = await ListenedTrack.aggregate([
      { $match: { user: matchId } },
      { $unwind: '$artists' },
      {
        $group: {
          _id: '$artists',
          totalCount: { $sum: '$count' },
        },
      },
      { $sort: { totalCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          artistName: '$_id',
          totalCount: 1,
          _id: 0,
        },
      },
    ]);

    // Aggregazione per dailyCounts
    const dailyCounts = await ListenedTrack.aggregate([
      { $match: { user: matchId } },
      { $unwind: '$listenedDates' },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$listenedDates' } },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          day: '$_id.day',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { day: 1 } },
    ]);

    // Costruisco la risposta con tutte le info di debug e le stats
    return res.json({
      debugFoundDocsCount: foundDocs.length,
      debugFoundDocs: mappedDocs,
      topTracks,
      topArtists,
      dailyCounts
    });

  } catch (err) {
    console.error('Errore in /api/stats/listening:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

module.exports = router;
