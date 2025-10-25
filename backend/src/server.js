const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const payseraRoutes = require('./routes/paysera');
const ordersRoutes = require('./routes/orders');
const postsRoutes = require('./routes/posts');
const shopRoutes = require('./routes/shop');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/paysera', payseraRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/orders', ordersRoutes);

// Backwards-compatibility mounts (allow direct /paysera and /messenger paths)
app.use('/paysera', payseraRoutes);
app.use('/messenger', require('./routes/messenger'));

// health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
 
// debug
try {
	const debugRoutes = require('./routes/debug');
	app.use('/api/debug', debugRoutes);
} catch (e) {
	console.warn('Debug routes not registered:', e.message || e);
}

// init socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;
// Bind explicitly to 0.0.0.0 so the container/host can accept external connections
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Backend listening on ${HOST}:${PORT}`));
