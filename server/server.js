// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importa le rotte
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const messageRoutes = require('./routes/messages');
const conversationRoutes = require('./routes/conversations');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rotte
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);

// Connessione a MongoDB Atlas
const uri = 'mongodb+srv://fumaghe:1909,Andre@echo.wom6a.mongodb.net/echo?retryWrites=true&w=majority';
// Rimuovi le opzioni deprecate
mongoose.connect(uri)
  .then(() => {
    console.log("Connesso a MongoDB");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server in ascolto sulla porta ${PORT}`);
    });
  })
  .catch(err => console.error(err));
