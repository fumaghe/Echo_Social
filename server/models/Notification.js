const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['message', 'friend_request', 'friend_accept', 'info'], default: 'info' },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false } // Campo per tracciare se la notifica è stata letta
});

module.exports = mongoose.model('Notification', NotificationSchema);
