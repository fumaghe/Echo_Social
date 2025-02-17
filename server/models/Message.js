const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  content: { type: String, required: true },
  songId: { type: String },
  createdAt: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', MessageSchema);
