// server/routes/posts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// Se vuoi mantenere lo schema inline puoi farlo, o importare da ../models/Post
// Esempio: const Post = require('../models/Post');

/**
 * (Esempio di schema inline, come già hai fatto)
 */
const PostSchema = new mongoose.Schema({
  user: {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' }
  },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  songTitle: { type: String, default: '' },
  artist: { type: String, default: '' },
  coverUrl: { type: String, default: '' },
  trackUrl: { type: String, default: '' },
  likesCount: { type: Number, default: 0 },
  likes: [{ type: String }],
  commentsCount: { type: Number, default: 0 },
  comments: [{
    user: { type: String, required: true },
    username: { type: String, required: true, default: '' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', PostSchema);

/**
 * GET /api/posts
 * Se viene passato ?user=<userId>, restituisce solo i post di quell'utente
 * altrimenti tutti i post
 */
router.get('/', async (req, res) => {
  try {
    const { user } = req.query;
    
    let filter = {};
    if (user) {
      // Nota: Poiché "user._id" nel post schema è una stringa, filtriamo su "user._id"
      filter = { 'user._id': user };
    }
    
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dei post' });
  }
});

// POST: Crea un nuovo post
router.post('/', async (req, res) => {
  try {
    const { user, description, imageUrl, songTitle, artist, coverUrl, trackUrl } = req.body;
    if (!user || !user._id || !user.username) {
      return res.status(400).json({ error: 'Informazioni utente mancanti' });
    }
    const newPost = new Post({
      user,
      description,
      imageUrl,
      songTitle,
      artist,
      coverUrl,
      trackUrl
    });
    const savedPost = await newPost.save();
    res.json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella creazione del post' });
  }
});

// POST: Toggle like per un post
router.post('/:id/like', async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId richiesto' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trovato' });

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
      // Notifica
      if (userId !== post.user._id) {
        await Notification.create({
          user: post.user._id,
          message: `${username} ha messo like al tuo post.`,
          type: 'info'
        });
      }
    } else {
      post.likes.splice(likeIndex, 1);
    }
    post.likesCount = post.likes.length;
    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dei like' });
  }
});

// POST: Aggiungi un commento
router.post('/:id/comment', async (req, res) => {
  try {
    const { userId, text, username } = req.body;
    if (!userId || !text) return res.status(400).json({ error: 'userId e testo sono richiesti' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trovato' });

    post.comments.push({ user: userId, username, text });
    post.commentsCount = post.comments.length;
    // Notifica
    if (userId !== post.user._id) {
      await Notification.create({
        user: post.user._id,
        message: `${username} ha commentato: "${text}"`,
        type: 'info'
      });
    }
    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'aggiunta del commento' });
  }
});

// DELETE: Elimina un post se l'utente loggato è l'autore
router.delete('/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body; // Riceviamo userId dal frontend
    if (!userId) return res.status(400).json({ error: 'Manca userId' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post non trovato' });

    // Verifica che l'utente che richiede la cancellazione sia l'autore
    if (post.user._id !== userId) {
      return res.status(403).json({ error: 'Non autorizzato a cancellare questo post' });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: 'Post eliminato correttamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella cancellazione del post' });
  }
});

module.exports = router;
