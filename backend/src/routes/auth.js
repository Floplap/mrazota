const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// NOTE: Replace in-memory store with real DB
const users = []; // TODO: persist in DB

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  // TODO: validate input
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, email, name, password: hashed };
  users.push(user);
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
  res.json({ user: { id: user.id, email, name }, token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

module.exports = router;