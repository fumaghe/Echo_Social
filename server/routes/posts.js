// server/routes/posts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema dei Post (supporta post solo testo, solo foto, testo+foto, testo+canzone, ecc.)
const PostSchema = new mongoose.Schema({
  user: {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' }
  },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },      // URL della foto, se presente
  songTitle: { type: String, default: '' },       // Titolo della canzone, se presente
  artist: { type: String, default: '' },
  coverUrl: { type: String, default: '' },        // URL della copertina della canzone
  likesCount: { type: Number, default: 0 },
  likes: [{ type: String }],                      // Array di ID degli utenti che hanno messo like
  commentsCount: { type: Number, default: 0 },
  comments: [{
    user: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', PostSchema);

// GET: Recupera tutti i post, ordinati dal più recente
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dei post' });
  }
});

// POST: Crea un nuovo post
router.post('/', async (req, res) => {
  try {
    const { user, description, imageUrl, songTitle, artist, coverUrl } = req.body;
    if (!user || !user._id || !user.username) {
      return res.status(400).json({ error: 'Informazioni utente mancanti' });
    }
    const newPost = new Post({
      user,
      description,
      imageUrl,
      songTitle,
      artist,
      coverUrl
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
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId richiesto' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trovato' });

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
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

// POST: Aggiungi un commento a un post
router.post('/:id/comment', async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) return res.status(400).json({ error: 'userId e testo sono richiesti' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trovato' });

    post.comments.push({ user: userId, text });
    post.commentsCount = post.comments.length;
    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'aggiunta del commento' });
  }
});

// Per la "share" si potrà integrare la logica di invio tramite chat (già presente in messages.js)
// Per ora il pulsante share può reindirizzare alla chat o mostrare un messaggio
module.exports = router;
