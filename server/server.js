// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ======================================================
// Middleware globali
// ======================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// ======================================================
// Rotte API
// ======================================================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const messageRoutes = require('./routes/messages');
const conversationRoutes = require('./routes/conversations');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);

// ======================================================
// Connessione a MongoDB
// ======================================================
//
// 1) Consigliato: usare una variabile d'ambiente su Render (MONGODB_URI)
//
//    const uri = process.env.MONGODB_URI;
//
// 2) Se vuoi “hardcodare” (non consigliato per sicurezza):
//    const uri = 'mongodb+srv://user:password@cluster.../echo?retryWrites=true&w=majority';
//
const uri = process.env.MONGODB_URI || 'mongodb+srv://fumaghe:1909,Andre@echo.wom6a.mongodb.net/echo?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(() => {
    console.log('Connesso a MongoDB');
  })
  .catch(err => console.error(err));

// ======================================================
// Servire i file statici di React (client/dist)
// ======================================================
app.use(express.static(path.join(__dirname, '../client/dist')));

// Se usi React Router, cattura le rotte e rimanda a index.html
// (Solo se NON coincidono con le rotte /api/ sopra)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// ======================================================
// Avvio del server
// ======================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
