// server/models/ListenedTrack.js
const mongoose = require('mongoose');

const ListenedTrackSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  trackId: { type: String, required: true },    // ID Spotify del brano
  trackName: { type: String, required: true },
  artists: [{ type: String }],                  // array di nomi degli artisti
  albumName: { type: String },
  albumCoverUrl: { type: String },
  
  // Nuovi campi
  genres: [{ type: String }],                   // generi (unione di quelli degli artisti)
  count: { type: Number, default: 0 },          // quante volte l'utente ha ascoltato
  listenedDates: [{ type: Date }],              // date/timestamps di ogni ascolto
}, { timestamps: true });

// Indice unico su (user, trackId) per evitare duplicati
ListenedTrackSchema.index({ user: 1, trackId: 1 }, { unique: true });

module.exports = mongoose.model('ListenedTrack', ListenedTrackSchema);
