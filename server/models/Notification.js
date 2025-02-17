// server/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // destinatario
  message: { type: String, required: true },
  type: { type: String, enum: ['message', 'friend_request', 'friend_accept', 'info'], default: 'info' },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ad esempio, per un nuovo messaggio
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
