// server/routes/posts.js
const express = require('express');
const router = express.Router();

// Stub: restituisce un array vuoto per i post
router.get('/', async (req, res) => {
  res.json([]);
});

module.exports = router;
