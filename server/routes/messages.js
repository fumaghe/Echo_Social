// server/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET: Ottieni i messaggi tra due utenti
router.get('/', async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    // Trova i messaggi della conversazione, ordinati in ordine crescente
    const messages = await Message.find({
      $or: [
        { sender: user1, recipients: user2 },
        { sender: user2, recipients: user1 }
      ]
    }).sort({ createdAt: 1 });

    // Se l'utente (user1) sta visualizzando la chat, marca i messaggi inviati dall'altro utente come delivered/read
    const updatePromises = messages.map(msg => {
      if (msg.sender.toString() === user2 && !msg.delivered) {
        return Message.findByIdAndUpdate(msg._id, { delivered: true, read: true }, { new: true });
      }
      return Promise.resolve(msg);
    });
    const updatedMessages = await Promise.all(updatePromises);
    res.json(updatedMessages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// POST: Invia un nuovo messaggio
router.post('/', async (req, res) => {
  const { sender, recipients, content, songId } = req.body;
  try {
    // Crea il messaggio
    const message = new Message({
      sender,
      recipients,
      content,
      songId,
      delivered: false,
      read: false
    });
    await message.save();

    // Recupera username mittente (per mostrare "fumaghe: ciao come va?" nella notifica)
    const senderUser = await User.findById(sender);

    // Crea una notifica per ciascun destinatario (eccetto il mittente)
    for (const recipientId of recipients) {
      if (recipientId !== sender) {
        await Notification.create({
          user: recipientId, // destinatario notifica
          message: `${senderUser.username}: ${content}`, // testo da mostrare
          type: 'message',
          partnerId: sender // utile per reindirizzare alla chat con il mittente
        });
      }
    }

    res.status(201).json({ message: 'Messaggio inviato', data: message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// DELETE: Elimina un messaggio specifico (by id)
router.delete('/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Messaggio eliminato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// DELETE: Elimina l'intera conversazione tra due utenti
router.delete('/', async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    await Message.deleteMany({
      $or: [
        { sender: user1, recipients: user2 },
        { sender: user2, recipients: user1 }
      ]
    });
    res.json({ message: 'Conversazione eliminata' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;
