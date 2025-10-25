const express = require('express');
const router = express.Router();

// In-memory posts (TODO: DB)
const posts = [];

// list posts
router.get('/', (req, res) => {
  res.json(posts);
});

// create post (text/media info)
router.post('/', (req, res) => {
  const { authorId, type, content, mediaUrl } = req.body;
  const post = { id: posts.length + 1, authorId, type, content, mediaUrl, likes: 0, comments: [] };
  posts.unshift(post);
  res.json(post);
});

// like post
router.post('/:id/like', (req, res) => {
  const p = posts.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).send();
  p.likes++;
  res.json(p);
});

module.exports = router;
