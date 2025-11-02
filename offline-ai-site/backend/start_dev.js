// Simple starter for DEV_STUB on Windows and other platforms
process.env.DEV_STUB = process.env.DEV_STUB || 'true';
process.env.PORT = process.env.PORT || '3012';
console.log('Starting server with DEV_STUB=%s PORT=%s', process.env.DEV_STUB, process.env.PORT);
require('./server.js');
